"use client";

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import TradeDropzone from './TradeDropzone';
import DraggableAsset from './DraggableAsset';

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
}

export default function TradeBuilder({ initialTeams, initialPlayers, initialPicks }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [assets, setAssets] = useState<UIAsset[]>(() => {
    const playerAssets: UIAsset[] = initialPlayers.map(p => ({
      id: `player-${p.id}`,
      type: 'PLAYER',
      dbId: p.id,
      name: `${p.firstName} ${p.lastName}`,
      sourceTeamId: p.teamId,
      currentZone: 'roster', 
      meta: p,
    }));

    const pickAssets: UIAsset[] = initialPicks.map(dp => ({
      id: `pick-${dp.id}`,
      type: 'PICK',
      dbId: dp.id,
      name: `${dp.year} Round ${dp.round}`,
      sourceTeamId: dp.currentOwnerId,
      currentZone: 'roster',
      meta: dp,
    }));

    return [...playerAssets, ...pickAssets];
  });

  const CURRENT_USER_TEAM_ID = 'cmn9gsbqt0008u7igjzdor01l';
  const [involvedTeamIds, setInvolvedTeamIds] = useState<string[]>([CURRENT_USER_TEAM_ID]);

  const defaultOpponentId = initialTeams.find(t => t.id !== CURRENT_USER_TEAM_ID)?.id || '';
  const [viewingTeamId, setViewingTeamId] = useState(defaultOpponentId);
  const [activeAsset, setActiveAsset] = useState<UIAsset | null>(null);

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
      
      if (receivingTeamId === draggedAsset.sourceTeamId) {
        return; 
      }

      setInvolvedTeamIds(prev => {
        const newTeams = new Set(prev);
        newTeams.add(receivingTeamId);
        newTeams.add(draggedAsset.sourceTeamId);
        return Array.from(newTeams);
      });
    }

    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId) {
        return { ...asset, currentZone: newZoneId };
      }
      return asset;
    }));
  };

  const handleDragCancel = () => {
    setActiveAsset(null);
  };

  // ⬅️ NEW: Logic to remove a team and eject their acquired assets
  const removeTeamFromTrade = (teamIdToRemove: string) => {
    setInvolvedTeamIds(prev => prev.filter(id => id !== teamIdToRemove));

    // Send any players sitting in their block back to the roster list
    setAssets(prev => prev.map(asset => {
      if (asset.currentZone === `trade-block-${teamIdToRemove}`) {
        return { ...asset, currentZone: 'roster' };
      }
      return asset;
    }));
  };

  const getTeamName = (id: string) => initialTeams.find(t => t.id === id)?.name || 'Unknown Team';

  if (!isMounted) {
    return <div className="min-h-screen"></div>;
  }

  const rosterAssets = assets.filter(a => a.currentZone === 'roster' && a.sourceTeamId === viewingTeamId);

  return (
    <DndContext 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)] min-h-[600px]">
        
        {/* Left Column: Master Roster Search */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-full overflow-hidden">
          <h2 className="font-bold text-lg mb-2 text-slate-800 flex-shrink-0">Available Assets</h2>
          
          <select 
            className="w-full mb-4 p-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none flex-shrink-0"
            value={viewingTeamId}
            onChange={(e) => setViewingTeamId(e.target.value)}
          >
            {initialTeams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
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
        <div className="lg:col-span-2 flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
           
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
                    defaultValue=""
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
           
           {/* DYNAMIC GRID */}
           <div className={`grid grid-cols-1 gap-4 flex-grow content-start ${involvedTeamIds.length > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
             {involvedTeamIds.map(teamId => {
               const teamAssets = assets.filter(a => a.currentZone === `trade-block-${teamId}`);
               return (
                 <TradeDropzone 
                    key={teamId}
                    id={`trade-block-${teamId}`} 
                    teamId={teamId}
                    title={`${getTeamName(teamId)} Receives`}
                    // ⬅️ NEW: Only allow removal if it is NOT the main user's team
                    onRemove={teamId !== CURRENT_USER_TEAM_ID ? () => removeTeamFromTrade(teamId) : undefined}
                 >
                   {teamAssets.map(asset => (
                     <DraggableAsset key={asset.id} asset={asset} />
                   ))}
                   {teamAssets.length === 0 && (
                     <div className="text-center text-slate-400 text-sm py-8 font-medium">
                       Drag assets here
                     </div>
                   )}
                 </TradeDropzone>
               );
             })}
           </div>
           
        </div>

      </div>

      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeAsset ? <DraggableAsset asset={activeAsset} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}