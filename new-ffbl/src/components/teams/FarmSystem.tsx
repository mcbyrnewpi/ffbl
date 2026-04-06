// src/components/teams/FarmSystem.tsx
"use client";

import { useState } from 'react';
import { LayoutGrid, List, AlertTriangle, Trophy, Calendar } from 'lucide-react';
import RosterRow from "./RosterRow";
import { MILB_PARENT_MAP } from '@/lib/milb-map';
import MLBLinkModal from './MLBLinkModal'; 
import PlayerActionMenu from './PlayerActionMenu'; 
import PlayerCardModal from '../players/PlayerCardModal';

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString();
};

export default function FarmSystem({ team, isMyTeam }: { team: any, isMyTeam: boolean }) {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [linkingPlayer, setLinkingPlayer] = useState<any | null>(null);
  const [selectedCardPlayer, setSelectedCardPlayer] = useState<any | null>(null);

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

      <div className="flex flex-col gap-8">
        {levels.map((lvl) => {
          const levelPlayers = team.players.filter((p: any) => p.level === lvl.id);

          return (
            <div key={lvl.id} className={`bg-white rounded-xl shadow-sm border-t-4 ${lvl.color} flex flex-col`}>
              
              {/* 🧢 Branded Affiliate Header */}
              <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30 rounded-t-lg">
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

              {/* Dynamic Content Area */}
              <div className="flex-grow bg-slate-50/30 rounded-b-xl">
                {levelPlayers.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400 italic text-xs">
                    Roster Empty
                  </div>
                ) : view === 'list' ? (
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-100">
                        {levelPlayers.map((player: any) => (
                          <RosterRow 
                            key={player.id} 
                            player={player} 
                            onLinkClick={() => setLinkingPlayer(player)}
                            onNameClick={() => setSelectedCardPlayer(player)}
                            isMyTeam={isMyTeam} 
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                ) : (
                  
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {levelPlayers.map((player: any) => (
                      <div 
                        key={player.id} 
                        className={`flex flex-col p-3 rounded-lg border shadow-sm transition-all group relative hover:z-50 focus-within:z-50 ${
                          player.violation 
                            ? 'bg-red-50 border-red-300 ring-1 ring-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]' // 🚨 ILLEGAL HIGHLIGHT
                            : 'bg-white border-slate-200 hover:shadow-md'
                        }`}
                      >
                        
                        {/* 🚨 THE WARNING BADGE 🚨 */}
                        {player.violation && (
                          <div className="absolute -top-3 -right-2 z-10 flex flex-col items-end animate-bounce">
                            <div className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-md flex items-center gap-1 border border-white">
                              <AlertTriangle size={10} /> Ineligible
                            </div>
                          </div>
                        )}

                        <div className="flex items-start">
                          
                          <div className="flex flex-col items-center mr-3 flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full overflow-hidden border shadow-sm ${player.violation ? 'bg-red-100 border-red-300' : 'bg-slate-100 border-slate-200'}`}>
                              <img 
                                src={player.mlbId ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_120/v1/people/${player.mlbId}/headshot/silo/current.png` : '/images/placeholders/no-player.svg'}
                                alt={player.lastName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/placeholders/no-player.svg';
                                }}
                              />
                            </div>
                            {/* 🌟 MLB Pipeline Top 100 Badge */}
                            {player.isTop100 && player.prospectRank && (
                              <div className="relative -mt-2.5 z-10 pointer-events-none animate-in zoom-in duration-300">
                                <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-md border border-emerald-300 flex items-center gap-1">
                                  <Trophy size={10} className="text-emerald-100" />
                                  #{player.prospectRank}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Player Details */}
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedCardPlayer(player);
                                }}
                                className={`font-bold truncate text-sm transition-colors text-left ${player.violation ? 'text-red-900 hover:text-red-600' : 'text-slate-900 hover:text-blue-600'}`}
                              >
                                {player.firstName} {player.lastName}
                              </button>
                              
                              {!player.mlbId && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setLinkingPlayer(player);
                                  }}
                                  className="text-amber-500 hover:text-amber-600 transition-colors flex-shrink-0"
                                  title="Missing MLB Data - Click to Sync"
                                >
                                  <AlertTriangle size={14} strokeWidth={2.5} />
                                </button>
                              )}
                            </div>
                            
                            <div className={`flex items-center gap-1.5 text-[11px] ${player.violation ? 'text-red-700' : 'text-slate-500'}`}>
                              <span className="font-bold">
                                {player.positions?.[0]?.abbrev || player.mlbRawData?.primaryPosition?.abbreviation || '??'}
                              </span>
                            </div>
                            
                            {player.mlbRawData?.currentTeam?.name && (
                              <div className={`text-[10px] mt-1 truncate ${player.violation ? 'text-red-800' : 'text-slate-600'}`}>
                                <span className="font-medium">
                                  {player.mlbRawData.currentTeam.name}
                                </span>
                                {player.mlbRawData?.currentTeam?.id && MILB_PARENT_MAP[player.mlbRawData.currentTeam.id] && (
                                  <span className={`font-bold ml-1 ${player.violation ? 'text-red-500' : 'text-slate-400'}`}>
                                    ({MILB_PARENT_MAP[player.mlbRawData.currentTeam.id].parentAbbrev})
                                  </span>
                                )}
                              </div>
                            )}

                            {/* 📅 Prospect ETA */}
                            {player.prospectEta && (
                              <div className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${player.violation ? 'bg-red-100/50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                <Calendar size={10} className={player.violation ? 'text-red-500' : 'text-slate-400'} />
                                <span>ETA: <span className="font-bold">{player.prospectEta}</span></span>
                              </div>
                            )}

                          </div>
                        </div>

                        {/* 🚨 EXPLANATORY TEXT 🚨 */}
                        {player.violation && (
                          <div className="mt-3 text-[9px] font-bold text-red-700 bg-red-100/80 p-2 rounded border border-red-200 leading-tight">
                            {player.violation}
                          </div>
                        )}

                        {/* Bottom Action Bar */}
                        <div className={`mt-3 pt-2 flex justify-between items-center border-t ${player.violation ? 'border-red-200' : 'border-slate-100'}`}>
                          <div className={`text-[9px] uppercase font-medium tracking-wide ${player.violation ? 'text-red-500' : 'text-slate-400'}`}>
                            Born: {formatDate(player.birthdate || player.mlbRawData?.birthDate)}
                          </div>
                          
                          {!player.isTradeLocked && (
                            <PlayerActionMenu player={player} isMyTeam={isMyTeam} />
                          )}
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
            window.location.reload(); 
          }}
        />
      )}

      {/* 🃏 THE 3D BASEBALL CARD MODAL */}
      <PlayerCardModal 
        isOpen={!!selectedCardPlayer}
        onClose={() => setSelectedCardPlayer(null)}
        player={selectedCardPlayer}
      />
    </div>
  );
}