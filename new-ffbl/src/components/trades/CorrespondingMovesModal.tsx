// src/components/trades/CorrespondingMovesModal.tsx
"use client";

import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (moves: { drops: string[], levelChanges: any[], statusChanges: any[] }) => void;
  teamId: string;
  tradeAssets: any[];
  settings: any;
}

export default function CorrespondingMovesModal({ isOpen, onClose, onConfirm, teamId, tradeAssets, settings }: Props) {
  const [roster, setRoster] = useState<any[]>([]);
  
  // ⬅️ NEW: Replaced `drops: string[]` with a mapping of playerId -> 'DROP' | 'MLB' | 'AAA' | 'AA' | 'A'
  const [pendingMoves, setPendingMoves] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchRoster = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/rosters/${teamId}`);
        const data = await res.json();
        const players = Array.isArray(data) ? data : (data.players || []);
        setRoster(players);
      } catch (error) {
        console.error("Failed to fetch roster", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoster();
  }, [isOpen, teamId]);

  if (!isOpen || !settings) return null;

  const incomingPlayers = tradeAssets.filter(a => a.toTeamId === teamId && a.playerId).map(a => a.player || a.meta);
  const outgoingPlayerIds = tradeAssets.filter(a => a.fromTeamId === teamId && a.playerId).map(a => a.playerId);

  // ⬅️ UPDATED: Now accounts for level changes and drops when projecting!
  const getProjectedCount = (level: string, status: string = 'ACTIVE') => {
    const current = roster.filter(p => {
      if (outgoingPlayerIds.includes(p.id)) return false;
      if (p.status !== status) return false;

      const move = pendingMoves[p.id];
      if (move === 'DROP') return false; // They are gone
      if (move) return move === level;   // If moved, they only count in their NEW level

      return p.level === level;          // If untouched, count in their CURRENT level
    });

    const incoming = incomingPlayers.filter(p => p?.level === level && (status === 'ACTIVE' ? (p?.status === 'ACTIVE' || p?.status === 'NA') : p?.status === status));
    
    return current.length + incoming.length;
  };

  const getProjectedStatusCount = (status: string) => {
    const current = roster.filter(p => {
      if (outgoingPlayerIds.includes(p.id)) return false;
      if (pendingMoves[p.id] === 'DROP') return false;
      // Note: Changing levels (MLB to AAA) does not change status (IL/NA), so we just check original status
      return p.status === status;
    });
    
    const incoming = incomingPlayers.filter(p => p?.status === status);
    return current.length + incoming.length;
  };

  const rosterChecks = [
    { name: 'MLB', projected: getProjectedCount('MLB'), limit: settings.mlbLimit },
    { name: 'AAA', projected: getProjectedCount('AAA'), limit: settings.aaaLimit },
    { name: 'AA', projected: getProjectedCount('AA'), limit: settings.aaLimit },
    { name: 'A', projected: getProjectedCount('A'), limit: settings.aLimit },
    { name: 'IL', projected: getProjectedStatusCount('IL'), limit: settings.ilLimit },
    { name: 'NA', projected: getProjectedStatusCount('NA'), limit: settings.naLimit },
  ];

  const overLimitChecks = rosterChecks.filter(check => check.projected > check.limit);
  const isOverLimit = overLimitChecks.length > 0;

  // ⬅️ NEW: Handle any move type
  const handleMoveChange = (playerId: string, action: string) => {
    setPendingMoves(prev => {
      const next = { ...prev };
      if (action === '') {
        delete next[playerId]; // Clear the move
      } else {
        next[playerId] = action;
      }
      return next;
    });
  };

  // ⬅️ UPDATED: Format the payload for the API based on the selected moves
  const handleConfirm = () => {
    if (isOverLimit) return;
    
    const drops: string[] = [];
    const levelChanges: any[] = [];

    Object.entries(pendingMoves).forEach(([playerId, action]) => {
      if (action === 'DROP') {
        drops.push(playerId);
      } else {
        levelChanges.push({ playerId, newLevel: action });
      }
    });

    onConfirm({ drops, levelChanges, statusChanges: [] });
  };

  const droppablePlayers = roster.filter(p => !outgoingPlayerIds.includes(p.id));

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Confirm Approval & Escrow</h2>
          <p className="text-sm text-slate-500 mt-1">Review your projected roster limits and make space if necessary.</p>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-slate-50">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 font-medium">Loading roster data...</div>
          ) : (
            <>
              {/* Roster Math Tracker */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {rosterChecks.map(check => {
                  if (check.projected === 0 && check.limit > 0) return null; 
                  const isExceeded = check.projected > check.limit;
                  return (
                    <div key={check.name} className={`p-3 rounded-lg border flex flex-col ${
                      isExceeded ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-slate-700">{check.name}</span>
                        <span className={`text-lg font-black ${isExceeded ? 'text-red-600' : 'text-slate-700'}`}>
                          {check.projected}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
                        Limit: {check.limit}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Roster Move Selectors */}
              <div className="mb-2 text-sm font-bold text-slate-700">Corresponding Moves</div>
              <p className="text-xs text-slate-500 mb-4">Promote, demote, or drop players to balance your limits.</p>
              
              <div className="space-y-2">
                {droppablePlayers.map(player => {
                  const currentMove = pendingMoves[player.id] || '';
                  const isDropped = currentMove === 'DROP';
                  const isMoved = currentMove !== '' && currentMove !== 'DROP';

                  return (
                    <div key={player.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      isDropped ? 'bg-red-50 border-red-200 opacity-75' : 
                      isMoved ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
                    }`}>
                      
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className={`text-sm font-bold truncate ${isDropped ? 'text-red-700 line-through' : 'text-slate-800'}`}>
                          {player.firstName} {player.lastName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                          {player.level} • {player.positions?.[0]?.abbrev || 'UNK'}
                        </span>
                      </div>

                      {/* ⬅️ NEW: The Action Dropdown */}
                      <select 
                        value={currentMove}
                        onChange={(e) => handleMoveChange(player.id, e.target.value)}
                        className={`text-xs p-1.5 border rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          currentMove !== '' ? 'bg-white text-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        <option value="">Keep at {player.level}</option>
                        <option value="DROP">Drop</option>
                        {['MLB', 'AAA', 'AA', 'A'].filter(l => l !== player.level).map(level => (
                          <option key={level} value={level}>Move to {level}</option>
                        ))}
                      </select>
                      
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isOverLimit || isLoading}
            className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
              isOverLimit 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 shadow-sm'
            }`}
          >
            {isOverLimit ? 'Clear Space to Approve' : 'Submit Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}