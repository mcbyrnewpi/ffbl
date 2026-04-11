"use client";

import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import RosterView from './RosterView';
import SyncStatsButton from './SyncStatsButton';

export default function GlobalRosterContainer({ 
  mlbActive, 
  naList, 
  injuredList,
  isMyTeam,
  teamId,    
  lastStatSync  
}: { 
  mlbActive: any[], 
  naList: any[], 
  injuredList: any[] ,
  isMyTeam: boolean,
  teamId: string,
  lastStatSync: Date | null   
}) {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-8">
      {/* 🌎 GLOBAL TOGGLE BAR */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded-xl shadow-sm mb-6">
        <h2 className="text-lg font-black tracking-tight text-slate-900 ml-2">Major League Roster</h2>

        <div className="flex items-center">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-3 tracking-widest hidden sm:inline-block">
            View Mode
          </span>
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

      <RosterView title="MLB Active Roster" players={mlbActive} headerColor="text-slate-900" view={view} isMyTeam={isMyTeam} />
      
      {naList.length > 0 && (
        <RosterView title="Not Active (NA)" players={naList} headerColor="text-slate-500" view={view} isMyTeam={isMyTeam} defaultOpen={false} />
      )}
      
      {injuredList.length > 0 && (
        <RosterView title="Injured List (IL)" players={injuredList} headerColor="text-red-700" view={view} isMyTeam={isMyTeam} defaultOpen={false} />
      )}
    </div>
  );
}