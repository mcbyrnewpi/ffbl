// src/components/trades/TradeBuilder.tsx
"use client";

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TradeDropzone from './TradeDropzone';
import DraggableAsset from './DraggableAsset';
import TradeSummary from './TradeSummary';
import CorrespondingMovesModal from './CorrespondingMovesModal';
import { checkNeedsCorrespondingMoves } from '@/lib/trade-utils';

export type UIAsset = {
  id: string;             
  type: 'PLAYER' | 'PICK';
  dbId: string;           
  name: string;           
  sourceTeamId: string;   
  currentZone: string;    
  meta?: any;             
};

interface Props {
  initialTeams: any[];
  initialPlayers: any[];
  initialPicks: any[];
  initialCounterTrade?: any | null; 
  addPlayerId?: string; // ⬅️ NEW PROP
}

export default function TradeBuilder({ initialTeams, initialPlayers, initialPicks, initialCounterTrade, addPlayerId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  
  // UI States
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number>(7);

  // Modal & Settings States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leagueSettings, setLeagueSettings] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setLeagueSettings(data))
      .catch(err => console.error("Failed to fetch settings", err));
  }, []);

  // ⬅️ MOVED UP: We need this ID *before* we initialize the assets state!
  const CURRENT_USER_TEAM_ID = (session?.user as any)?.teamId || '';

  const [assets, setAssets] = useState<UIAsset[]>(() => {
    // ⬅️ UPDATED: Helper handles both counter trades AND single-player deep links
    const getZone = (type: string, dbId: string) => {
      // 1. Counter Trade Logic
      if (initialCounterTrade) {
        const foundAsset = initialCounterTrade.assets.find((a: any) => 
          (type === 'PLAYER' && a.playerId === dbId) || 
          (type === 'PICK' && a.draftPickId === dbId)
        );
        if (foundAsset) return `trade-block-${foundAsset.toTeamId}`;
      }
      
      // 2. Direct Player Add Logic
      if (addPlayerId && type === 'PLAYER' && dbId === addPlayerId) {
         return `trade-block-${CURRENT_USER_TEAM_ID}`;
      }

      return 'roster';
    };

    const playerAssets: UIAsset[] = initialPlayers.map(p => ({
      id: `player-${p.id}`,
      type: 'PLAYER',
      dbId: p.id,
      name: `${p.firstName} ${p.lastName}`,
      sourceTeamId: p.teamId,
      currentZone: getZone('PLAYER', p.id),
      meta: p,
    }));

    const pickAssets: UIAsset[] = initialPicks.map(dp => ({
      id: `pick-${dp.id}`,
      type: 'PICK',
      dbId: dp.id,
      name: `${dp.year} Round ${dp.round}`,
      sourceTeamId: dp.currentOwnerId,
      currentZone: getZone('PICK', dp.id),
      meta: {
        ...dp,
        originalTeamName: initialTeams.find(t => t.id === dp.originalOwnerId)?.name || 'Unknown Team'
      },
    }));

    return [...playerAssets, ...pickAssets];
  });
  
  // ⬅️ UPDATED: Pre-populate involved teams if countering or targeting a player
  const [involvedTeamIds, setInvolvedTeamIds] = useState<string[]>(() => {
    if (initialCounterTrade) {
      const allTeams = initialCounterTrade.assets.flatMap((a: any) => [a.fromTeamId, a.toTeamId]);
      const uniqueTeams = Array.from(new Set(allTeams)) as string[];
      if (!uniqueTeams.includes(CURRENT_USER_TEAM_ID)) uniqueTeams.push(CURRENT_USER_TEAM_ID);
      return uniqueTeams;
    }

    // ⬅️ NEW: If we are trading for a specific player, automatically add their current team!
    if (addPlayerId) {
      const targetPlayer = initialPlayers.find(p => p.id === addPlayerId);
      if (targetPlayer && targetPlayer.teamId !== CURRENT_USER_TEAM_ID) {
        return [CURRENT_USER_TEAM_ID, targetPlayer.teamId];
      }
    }

    return [CURRENT_USER_TEAM_ID];
  });

  const defaultOpponentId = initialTeams.find(t => t.id !== CURRENT_USER_TEAM_ID)?.id || '';
  const [viewingTeamId, setViewingTeamId] = useState(defaultOpponentId);
  const [activeAsset, setActiveAsset] = useState<UIAsset | null>(null);
  
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'MAJORS' | 'MINORS' | 'PICKS'>('ALL');

  // --- DND Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedItem = assets.find(a => a.id === active.id);
    if (draggedItem) setActiveAsset(draggedItem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveAsset(null);
    const { active, over } = event;
    if (!over) return;

    const assetId = active.id as string;
    const newZoneId = over.id as string;

    const draggedAsset = assets.find(a => a.id === assetId);
    if (!draggedAsset) return;

    if (newZoneId.startsWith('trade-block-')) {
      const receivingTeamId = newZoneId.replace('trade-block-', '');
      
      if (receivingTeamId === draggedAsset.sourceTeamId) return; 

      setInvolvedTeamIds(prev => {
        const newTeams = new Set(prev);
        newTeams.add(receivingTeamId);
        newTeams.add(draggedAsset.sourceTeamId);
        return Array.from(newTeams);
      });
    }

    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId) return { ...asset, currentZone: newZoneId };
      return asset;
    }));
  };

  const handleDragCancel = () => setActiveAsset(null);

  const removeTeamFromTrade = (teamIdToRemove: string) => {
    setInvolvedTeamIds(prev => prev.filter(id => id !== teamIdToRemove));
    setAssets(prev => prev.map(asset => {
      if (asset.currentZone === `trade-block-${teamIdToRemove}`) return { ...asset, currentZone: 'roster' };
      return asset;
    }));
  };

  const getTeamName = (id: string) => initialTeams.find(t => t.id === id)?.name || 'Unknown Team';

  // Derived state
  const tradeAssetsList = assets.filter(a => a.currentZone.startsWith('trade-block-'));
  const isTradeValid = tradeAssetsList.length > 0;

  const rosterAssets = assets
    .filter(a => a.currentZone === 'roster' && a.sourceTeamId === viewingTeamId)
    .filter(a => {
      if (assetFilter === 'ALL') return true;
      if (assetFilter === 'PICKS') return a.type === 'PICK';
      
      const isMajorLeaguer = a.meta?.level === 'MLB' || a.meta?.status === 'NA';
      
      if (assetFilter === 'MAJORS') return a.type === 'PLAYER' && isMajorLeaguer;
      if (assetFilter === 'MINORS') return a.type === 'PLAYER' && !isMajorLeaguer;
      
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // --- Map assets for the API payload and Modal ---
  const formattedAssetsForModal = tradeAssetsList.map(a => ({
    fromTeamId: a.sourceTeamId,
    toTeamId: a.currentZone.replace('trade-block-', ''),
    playerId: a.type === 'PLAYER' ? a.dbId : null,
    draftPickId: a.type === 'PICK' ? a.dbId : null,
    meta: a.meta
  }));

  // --- API Submission Handlers ---
  const handleProposeClick = async () => {
    setIsSubmitting(true);
    const needsMoves = await checkNeedsCorrespondingMoves(CURRENT_USER_TEAM_ID, formattedAssetsForModal, leagueSettings);
    
    if (needsMoves) {
      setIsSubmitting(false);
      setIsModalOpen(true); // Pop open the escrow modal
    } else {
      executeProposal(null); // No drops needed, fire instantly!
    }
  };

  const executeProposal = async (correspondingMoves: any) => {
    setIsSubmitting(true);
    setIsModalOpen(false);
    
    try {
      const response = await fetch('/api/trades/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiatingTeamId: CURRENT_USER_TEAM_ID,
          expiresInDays: expiresInDays, 
          assets: formattedAssetsForModal,
          correspondingMoves,
          counteringTradeId: initialCounterTrade?.id 
        }),
      });

      if (!response.ok) throw new Error('Failed to propose trade');
      
      router.push('/trades?success=true');
    } catch (error) {
      console.error(error);
      alert("Something went wrong proposing the trade.");
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return <div className="min-h-screen"></div>;

  // ==========================================
  // VIEW: REVIEW SUMMARY
  // ==========================================
  if (isReviewing) {
    const reviewFooterControls = (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Expires:</label>
          <select 
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            className="p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
          >
            <option value={1}>1 Day</option>
            <option value={2}>2 Days</option>
            <option value={3}>3 Days</option>
            <option value={4}>4 Days</option>
            <option value={5}>5 Days</option>
            <option value={6}>6 Days</option>
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={0}>Never</option>
          </select>
        </div>
        <button 
          onClick={handleProposeClick} 
          disabled={isSubmitting}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? 'Processing...' : 'Propose Trade'}
        </button>
      </div>
    );

    return (
      <>
        <TradeSummary 
          tradeAssetsList={tradeAssetsList}
          involvedTeamIds={involvedTeamIds}
          getTeamName={getTeamName}
          onBack={() => setIsReviewing(false)}
          actionButtons={reviewFooterControls}
        />

        <CorrespondingMovesModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={executeProposal}
          teamId={CURRENT_USER_TEAM_ID}
          tradeAssets={formattedAssetsForModal}
          settings={leagueSettings}
        />
      </>
    );
  }

  // ==========================================
  // VIEW: DND BUILDER
  // ==========================================
  return (
    <DndContext 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col h-[calc(100vh-120px)] min-h-[600px] relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
          
          {/* Left Column: Master Roster Search */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-full overflow-hidden">
            <h2 className="font-bold text-lg mb-2 text-slate-800 flex-shrink-0">Available Assets</h2>
            
            <div className="space-y-3 mb-4 flex-shrink-0">
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={viewingTeamId}
                onChange={(e) => setViewingTeamId(e.target.value)}
              >
                {initialTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>

              <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                {(['ALL', 'MAJORS', 'MINORS', 'PICKS'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setAssetFilter(f)}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded transition-all ${
                      assetFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar pb-16">
              <TradeDropzone id="roster" title="Team Roster">
                {rosterAssets.map(asset => (
                  <DraggableAsset key={asset.id} asset={asset} />
                ))}
                {rosterAssets.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-8 font-medium">
                    No available assets left.
                  </div>
                )}
              </TradeDropzone>
            </div>
          </div>

          {/* Right Columns: The Trade Blocks */}
          <div className="lg:col-span-2 flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar pb-16">
             <div className="flex justify-between items-center mb-4 flex-shrink-0">
               <h2 className="font-bold text-lg text-slate-800">Trade Blocks</h2>
               
               {involvedTeamIds.length < initialTeams.length && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline-block">Add Team:</span>
                    <select 
                      className="text-xs p-1.5 bg-white border border-slate-300 rounded-md outline-none text-slate-700 shadow-sm focus:border-blue-500"
                      onChange={(e) => {
                        if (e.target.value) {
                          setInvolvedTeamIds(prev => [...prev, e.target.value]);
                          e.target.value = ""; 
                        }
                      }}
                      value=""
                    >
                      <option value="" disabled>Select...</option>
                      {initialTeams
                        .filter(team => !involvedTeamIds.includes(team.id))
                        .map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                  </div>
                )}
             </div>
             
             {/* DYNAMIC GRID - STACKED VERTICALLY */}
             <div className="flex flex-col gap-6 flex-grow content-start">
               {involvedTeamIds.map(teamId => {
                 const teamAssets = assets.filter(a => a.currentZone === `trade-block-${teamId}`);
                 const isViewing = viewingTeamId === teamId; 

                 return (
                   <div 
                     key={teamId}
                     onClickCapture={(e) => {
                        if ((e.target as HTMLElement).closest('button')) return;
                        setViewingTeamId(teamId);
                     }}
                     className={`rounded-xl cursor-pointer transition-all duration-200 ${
                       isViewing 
                         ? 'ring-2 ring-blue-500 shadow-md ring-offset-2' 
                         : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 opacity-95 hover:opacity-100'
                     }`}
                   >
                     <TradeDropzone 
                        id={`trade-block-${teamId}`} 
                        teamId={teamId}
                        title={`${getTeamName(teamId)} Receives`}
                        onRemove={teamId !== CURRENT_USER_TEAM_ID ? () => removeTeamFromTrade(teamId) : undefined}
                     >
                       {teamAssets.map(asset => (
                         <DraggableAsset 
                            key={asset.id} 
                            asset={asset} 
                            onRemove={() => {
                              setAssets(prev => prev.map(a => 
                                a.id === asset.id ? { ...a, currentZone: 'roster' } : a
                              ));
                            }}
                         />
                       ))}
                       {teamAssets.length === 0 && (
                         <div className="text-center text-slate-400 text-sm py-8 font-medium">
                           Drag assets here
                         </div>
                       )}
                     </TradeDropzone>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-xl shadow-lg border border-slate-200">
          <button 
            onClick={() => setIsReviewing(true)}
            disabled={!isTradeValid}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              isTradeValid 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Review Trade ({tradeAssetsList.length} Assets)
          </button>
        </div>

      </div>

      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeAsset ? <DraggableAsset asset={activeAsset} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}