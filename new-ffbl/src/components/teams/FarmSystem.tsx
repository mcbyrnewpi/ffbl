// src/components/teams/FarmSystem.tsx
"use client";

import { useState } from 'react';
import { LayoutGrid, List, AlertTriangle } from 'lucide-react';
import RosterRow from "./RosterRow";
import { MILB_PARENT_MAP } from '@/lib/milb-map';
import MLBLinkModal from './MLBLinkModal'; // ⚾ Adjust this import path if needed!

// Helper to format dates safely
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString();
};

export default function FarmSystem({ team }: { team: any }) {
  const [view, setView] = useState<'list' | 'grid'>('list');
  
  // ✨ State to manage which player is currently being linked
  const [linkingPlayer, setLinkingPlayer] = useState<any | null>(null);

  // Define our levels and map them to the team's specific affiliate data
  const levels = [
    { 
      id: 'AAA', 
      title: team.aaaAffiliateName || 'Triple-A', 
      logo: team.aaaLogoUrl,
      color: 'border-orange-500' 
    },
    { 
      id: 'AA', 
      title: team.aaAffiliateName || 'Double-A', 
      logo: team.aaLogoUrl,
      color: 'border-blue-500' 
    },
    { 
      id: 'A', 
      title: team.aAffiliateName || 'Single-A', 
      logo: team.aLogoUrl,
      color: 'border-emerald-500' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* 🌎 FARM SYSTEM TOGGLE BAR */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 ml-2">Farm System Overview</h2>
        <div className="flex items-center">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-3 tracking-widest hidden sm:inline-block">View Mode</span>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={14} /> List
            </button>
            <button 
              onClick={() => setView('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={14} /> Cards
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {levels.map((lvl) => {
          const levelPlayers = team.players.filter((p: any) => p.level === lvl.id);

          return (
            <div key={lvl.id} className={`bg-white rounded-xl shadow-sm border-t-4 ${lvl.color} overflow-hidden flex flex-col`}>
              
              {/* 🧢 Branded Affiliate Header */}
              <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                {lvl.logo ? (
                  <img src={lvl.logo} alt="" className="w-10 h-10 object-contain shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-[10px] font-black text-slate-400">
                    {lvl.id}
                  </div>
                )}
                <div className="flex flex-col">
                  <h3 className="text-slate-900 font-black text-xs uppercase tracking-tight leading-tight">
                    {lvl.title}
                  </h3>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    Level {lvl.id}
                  </span>
                </div>
              </div>

              {/* Dynamic Content Area based on View State */}
              <div className="flex-grow bg-slate-50/30">
                {levelPlayers.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400 italic text-xs">
                    Roster Empty
                  </div>
                ) : view === 'list' ? (
                  
                  /* 📋 LIST VIEW (Traditional Rows) */
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-100">
                        {levelPlayers.map((player: any) => (
                          <RosterRow 
                            key={player.id} 
                            player={player} 
                            onLinkClick={() => setLinkingPlayer(player)} // 🚀 Pass the trigger down!
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                ) : (
                  
                  /* 🗂️ GRID VIEW (Rich Player Cards) */
                  <div className="p-3 flex flex-col gap-3">
                    {levelPlayers.map((player: any) => (
                      <div 
                        key={player.id} 
                        className="flex items-start p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                      >
                        {/* Headshot */}
                        <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 mr-3 relative shadow-sm">
                          <img 
                            src={player.mlbId ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_120/v1/people/${player.mlbId}/headshot/silo/current.png` : '/images/placeholders/no-player.svg'}
                            alt={player.lastName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.src = '/images/placeholders/no-player.svg';
                            }}
                          />
                        </div>

                        {/* Player Details */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="font-bold text-slate-900 truncate text-sm">
                              {player.firstName} {player.lastName}
                            </div>
                            
                            {/* ⚠️ THE SYNC WARNING TRIANGLE */}
                            {!player.mlbId && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setLinkingPlayer(player); // 🚀 Trigger modal!
                                }}
                                className="text-amber-500 hover:text-amber-600 transition-colors flex-shrink-0"
                                title="Missing MLB Data - Click to Sync"
                              >
                                <AlertTriangle size={14} strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-bold text-slate-700">
                              {player.positions?.[0]?.abbrev || player.mlbRawData?.primaryPosition?.abbreviation || '??'}
                            </span>
                          </div>
                          
                          {/* Real-Life Affiliate with Parent Map */}
                          {player.mlbRawData?.currentTeam?.name && (
                            <div className="text-[10px] text-slate-600 mt-1 truncate">
                              <span className="font-medium">
                                {player.mlbRawData.currentTeam.name}
                              </span>
                              {player.mlbRawData?.currentTeam?.id && MILB_PARENT_MAP[player.mlbRawData.currentTeam.id] && (
                                <span className="font-bold text-slate-400 ml-1">
                                  ({MILB_PARENT_MAP[player.mlbRawData.currentTeam.id].parentAbbrev})
                                </span>
                              )}
                            </div>
                          )}

                          <div className="text-[9px] text-slate-400 mt-1 uppercase font-medium tracking-wide">
                            Born: {formatDate(player.birthdate || player.mlbRawData?.birthDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔮 THE MLB LINK MODAL */}
      {linkingPlayer && (
        <MLBLinkModal
          isOpen={!!linkingPlayer}
          onClose={() => setLinkingPlayer(null)}
          player={linkingPlayer}
          onSuccess={() => {
            setLinkingPlayer(null);
            // Optional: You can trigger a router.refresh() here if you want the page to update instantly
            window.location.reload(); 
          }}
        />
      )}
    </div>
  );
}