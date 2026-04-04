"use client";

import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import RosterView from './RosterView'; // We will simplify this component next

export default function GlobalRosterContainer({ 
  mlbActive, 
  naList, 
  injuredList,
  isMyTeam
}: { 
  mlbActive: any[], 
  naList: any[], 
  injuredList: any[] ,
  isMyTeam: boolean
}) {
  const [view, setView] = useState<'grid' | 'list'>('list');

  return (
    <div className="space-y-12">
      {/* 🌎 GLOBAL TOGGLE BAR */}
      <div className="flex justify-end items-center bg-white border border-slate-200 p-2 rounded-xl shadow-sm mb-6">
        <span className="text-[10px] font-black uppercase text-slate-400 mr-3 tracking-widest">View Mode</span>
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

      {/* RENDER THE SECTIONS */}
      <RosterView title="MLB Active Roster" players={mlbActive} headerColor="bg-blue-900" view={view} isMyTeam={isMyTeam} />
      
      {naList.length > 0 && (
        <RosterView title="Not Active (NA)" players={naList} headerColor="bg-slate-500" view={view} isMyTeam={isMyTeam} />
      )}
      
      {injuredList.length > 0 && (
        <RosterView title="Injured List (IL)" players={injuredList} headerColor="bg-red-900" view={view} isMyTeam={isMyTeam} />
      )}
    </div>
  );
}