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
  addPlayerId?: string;
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
  const [isTeamSelectOpen, setIsTeamSelectOpen] = useState(false);
  const [isViewingTeamSelectOpen, setIsViewingTeamSelectOpen] = useState(false);
  const [isExpiresOpen, setIsExpiresOpen] = useState(false);

  const [mobileMoveAsset, setMobileMoveAsset] = useState<UIAsset | null>(null);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setLeagueSettings(data))
      .catch(err => console.error("Failed to fetch settings", err));
  }, []);

  const CURRENT_USER_TEAM_ID = (session?.user as any)?.teamId || '';

  const [assets, setAssets] = useState<UIAsset[]>(() => {
    const getZone = (type: string, dbId: string) => {
      if (initialCounterTrade) {
        const foundAsset = initialCounterTrade.assets.find((a: any) => 
          (type === 'PLAYER' && a.playerId === dbId) || 
          (type === 'PICK' && a.draftPickId === dbId)
        );
        if (foundAsset) return `trade-block-${foundAsset.toTeamId}`;
      }
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
  
  const [involvedTeamIds, setInvolvedTeamIds] = useState<string[]>(() => {
    if (initialCounterTrade) {
      const allTeams = initialCounterTrade.assets.flatMap((a: any) => [a.fromTeamId, a.toTeamId]);
      const uniqueTeams = Array.from(new Set(allTeams)) as string[];
      if (!uniqueTeams.includes(CURRENT_USER_TEAM_ID)) uniqueTeams.push(CURRENT_USER_TEAM_ID);
      return uniqueTeams;
    }

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

  const handleMobileAdd = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const validReceivers = involvedTeamIds.filter(id => id !== asset.sourceTeamId);

    if (validReceivers.length === 0) {
      alert("Please add a trade partner to the Trade Blocks first!");
      return;
    }

    if (validReceivers.length === 1) {
      executeMobileMove(assetId, validReceivers[0]);
    } else {
      setMobileMoveAsset(asset);
    }
  };

  const executeMobileMove = (assetId: string, receivingTeamId: string) => {
    const asset = assets.find(a => a.id === assetId);
    
    if (asset) {
      setInvolvedTeamIds(prev => {
        const newTeams = new Set(prev);
        newTeams.add(receivingTeamId);
        newTeams.add(asset.sourceTeamId);
        return Array.from(newTeams);
      });
    }

    setAssets(prev => prev.map(a =>
      a.id === assetId ? { ...a, currentZone: `trade-block-${receivingTeamId}` } : a
    ));
    setMobileMoveAsset(null); 
  };

  const removeTeamFromTrade = (teamIdToRemove: string) => {
    setInvolvedTeamIds(prev => prev.filter(id => id !== teamIdToRemove));
    setAssets(prev => prev.map(asset => {
      if (asset.currentZone === `trade-block-${teamIdToRemove}`) return { ...asset, currentZone: 'roster' };
      return asset;
    }));
  };

  const getTeamName = (id: string) => initialTeams.find(t => t.id === id)?.name || 'Unknown Team';

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

  const formattedAssetsForModal = tradeAssetsList.map(a => ({
    fromTeamId: a.sourceTeamId,
    toTeamId: a.currentZone.replace('trade-block-', ''),
    playerId: a.type === 'PLAYER' ? a.dbId : null,
    draftPickId: a.type === 'PICK' ? a.dbId : null,
    meta: a.meta
  }));

  const handleProposeClick = async () => {
    setIsSubmitting(true);
    const needsMoves = await checkNeedsCorrespondingMoves(CURRENT_USER_TEAM_ID, formattedAssetsForModal, leagueSettings);
    
    if (needsMoves) {
      setIsSubmitting(false);
      setIsModalOpen(true);
    } else {
      executeProposal(null);
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

  if (isReviewing) {
    const reviewFooterControls = (
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        
        {/* 🌟 FIX: Custom Expires Dropdown */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-200 sm:border-0 relative">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Expires:</label>
          
          <div className="relative w-[140px] z-[60]">
            <button 
              onClick={() => setIsExpiresOpen(!isExpiresOpen)}
              className="w-full h-11 sm:h-10 px-4 flex items-center justify-between bg-white border border-slate-300 rounded-lg outline-none text-slate-900 font-bold text-base sm:text-sm shadow-sm hover:border-blue-500 transition-colors"
            >
              <span>{expiresInDays === 0 ? 'Never' : `${expiresInDays} Day${expiresInDays > 1 ? 's' : ''}`}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {isExpiresOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsExpiresOpen(false)}></div>
                <div className="absolute bottom-full mb-2 right-0 w-full sm:w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 custom-scrollbar">
                  {[1, 2, 3, 4, 5, 6, 7, 14, 0].map(val => (
                    <button
                      key={val}
                      className="w-full text-left px-4 py-3 sm:py-2 text-base sm:text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-slate-50 last:border-0"
                      onClick={() => {
                        setExpiresInDays(val);
                        setIsExpiresOpen(false);
                      }}
                    >
                      {val === 0 ? 'Never' : `${val} Day${val > 1 ? 's' : ''}`}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* PROPOSE TRADE BUTTON */}
        <button 
          onClick={handleProposeClick} 
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-4 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-base sm:text-sm rounded-xl sm:rounded-lg shadow-sm shadow-blue-500/25 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
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
              <div className="relative z-[70]">
                <button 
                  onClick={() => setIsViewingTeamSelectOpen(!isViewingTeamSelectOpen)}
                  className="w-full h-11 sm:h-9 px-4 sm:px-3 flex items-center justify-between bg-slate-50 border border-slate-300 rounded-lg outline-none text-slate-700 font-bold text-base sm:text-sm shadow-sm hover:border-blue-500 transition-colors"
                >
                  <span className="truncate">{getTeamName(viewingTeamId)}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {isViewingTeamSelectOpen && (
                  <>
                    <div className="fixed inset-0 z-[65]" onClick={() => setIsViewingTeamSelectOpen(false)}></div>
                    <div className="absolute left-0 top-full mt-2 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-[70] py-2 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                      {initialTeams.map(team => (
                        <button
                          key={team.id}
                          className={`w-full text-left px-4 py-3 sm:py-2 text-base sm:text-sm font-bold transition-colors border-b border-slate-50 last:border-0 ${
                            viewingTeamId === team.id ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                          }`}
                          onClick={() => {
                            setViewingTeamId(team.id);
                            setIsViewingTeamSelectOpen(false);
                          }}
                        >
                          {team.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

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

            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar pb-28 lg:pb-16">
              <TradeDropzone id="roster" title="Team Roster">
                {rosterAssets.map(asset => (
                  <DraggableAsset 
                    key={asset.id} 
                    asset={asset} 
                    onMobileAdd={() => handleMobileAdd(asset.id)} 
                  />
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
          <div className="lg:col-span-2 flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar pb-28 lg:pb-16">
             <div className="flex justify-between items-center mb-4 flex-shrink-0">
               <h2 className="font-bold text-lg text-slate-800">Trade Blocks</h2>
               
               {involvedTeamIds.length < initialTeams.length && (
                  <div className="relative flex items-center gap-2 z-[70]">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline-block">Add Team:</span>
                    
                    {/* Custom Dropdown Trigger Button */}
                    <button 
                      onClick={() => setIsTeamSelectOpen(!isTeamSelectOpen)}
                      className="h-11 sm:h-9 px-4 sm:px-3 bg-white border border-slate-300 rounded-lg outline-none text-slate-900 font-bold shadow-sm hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      <span>Add Team...</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>

                    {/* Custom Dropdown Menu */}
                    {isTeamSelectOpen && (
                      <>
                        {/* Invisible overlay to catch clicks outside the menu and close it */}
                        <div className="fixed inset-0 z-[65]" onClick={() => setIsTeamSelectOpen(false)}></div>
                        
                        {/* The actual menu */}
                        <div className="absolute right-0 top-full mt-2 w-64 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-[70] py-2 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                          {initialTeams
                            .filter(team => !involvedTeamIds.includes(team.id))
                            .map(team => (
                              <button
                                key={team.id}
                                className="w-full text-left px-4 py-3 sm:py-2 text-base sm:text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-slate-50 last:border-0"
                                onClick={() => {
                                  setInvolvedTeamIds(prev => [...prev, team.id]);
                                  setIsTeamSelectOpen(false);
                                }}
                              >
                                {team.name}
                              </button>
                            ))}
                        </div>
                      </>
                    )}
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

        {/* Sticky Bottom Footer on Mobile, Floating Button on Desktop */}
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-slate-200 z-[60] lg:absolute lg:bottom-4 lg:left-auto lg:right-4 lg:w-auto lg:p-3 lg:rounded-xl lg:shadow-lg lg:border lg:border-slate-200">
          <button 
            onClick={() => setIsReviewing(true)}
            disabled={!isTradeValid}
            className={`w-full lg:w-auto px-6 py-4 lg:py-2 rounded-xl lg:rounded-lg font-black text-base lg:text-sm transition-all shadow-sm ${
              isTradeValid 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25' 
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

      {/* Multi-Team Mobile Destination Prompt */}
      {mobileMoveAsset && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm sm:justify-center sm:p-4 animate-in fade-in" onClick={() => setMobileMoveAsset(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-black text-slate-800 text-center">Where is <span className="text-blue-600">{mobileMoveAsset.name}</span> going?</h3>
            </div>
            <div className="p-2">
              {involvedTeamIds
                .filter(id => id !== mobileMoveAsset.sourceTeamId)
                .map(teamId => (
                  <button
                    key={teamId}
                    onClick={() => executeMobileMove(mobileMoveAsset.id, teamId)}
                    className="w-full text-left p-4 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-100 last:border-0 font-bold text-slate-700 transition-colors"
                  >
                    Send to {getTeamName(teamId)}
                  </button>
              ))}
            </div>
            <div className="p-2 bg-slate-50 border-t border-slate-200">
              <button 
                onClick={() => setMobileMoveAsset(null)}
                className="w-full py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}