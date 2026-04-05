// src/components/players/BaseballCard.tsx
"use client";

import { useState } from 'react';
import { Trophy, Calendar, Star, Shield, Info, Activity } from 'lucide-react';

// Helper to calculate age if not provided by MLB API
const getAge = (birthdate: string | Date | null) => {
  if (!birthdate) return '??';
  const diff = Date.now() - new Date(birthdate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

export default function BaseballCard({ player }: { player: any }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // --- Data Normalization ---
  const isProspect = player.level !== 'MLB' || !!player.prospectRank;
  const teamName = player.team?.name || player.mlbRawData?.currentTeam?.name || 'Free Agent';
  const position = player.positions?.[0]?.abbrev || player.mlbRawData?.primaryPosition?.abbreviation || '??';
  const age = player.mlbRawData?.currentAge || getAge(player.birthdate);
  const headshotUrl = player.mlbId 
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_400/v1/people/${player.mlbId}/headshot/silo/current.png` 
    : '/images/placeholders/no-player.svg';

  // --- Extract Latest Scouting Data ---
  // Grab the most recent year's ranking to display on the card
  const rankings = player.prospectRankings || [];
  const latestRanking = rankings.sort((a: any, b: any) => b.year - a.year)[0];
  const scoutingData = latestRanking?.scouting || {};
  
  // Separate the written report from the 20-80 number grades
  const scoutingReportText = scoutingData.report || `"Projected ${player.prospectEta || 'future'} arrival. ${player.lastName} displays an advanced approach with a high ceiling."`;
  
  // Filter out the 'report' and 'overall' so we can just map the specific tools (Hit, Power, Fastball, etc.)
  const toolGrades = Object.entries(scoutingData).filter(([key, val]) => key !== 'report' && key !== 'overall' && val !== null);
  const overallGrade = scoutingData.overall;

  // --- Visual Constants & Holographic Effect ---
  const cardBackground = "bg-[#f4f1ea] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]";
  const isElite = player.isTop100 && player.prospectRank <= 10;
  
  // High-end prospect "Holographic" border logic
  const borderStyle = isElite 
    ? "border-[12px] border-slate-200 shadow-[0_0_20px_rgba(148,163,184,0.5)]" 
    : "border-[12px] border-white shadow-inner";

  // The foil shine effect (only active on elite prospects)
  const foilEffect = isElite ? (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 mix-blend-color-dodge">
       <div className="absolute inset-[-100%] bg-[linear-gradient(45deg,transparent_20%,rgba(255,255,255,0.8)_45%,rgba(255,200,255,0.6)_50%,rgba(200,255,255,0.8)_55%,transparent_80%)] animate-[shine_3s_infinite_linear] translate-x-[-100%]" />
    </div>
  ) : null;

  return (
    <div className="flex flex-col items-center">
      <div 
        className="group w-full max-w-sm aspect-[2.5/3.5] [perspective:1000px] cursor-pointer relative" 
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Magic Shine Overlay */}
        {foilEffect}

        <div 
          className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] shadow-[0_30px_60px_rgba(0,0,0,0.4)] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          
          {/* ==========================================
              FRONT OF CARD (VINTAGE HERITAGE)
          ========================================== */}
          <div className={`absolute inset-0 [backface-visibility:hidden] ${cardBackground} ${borderStyle} flex flex-col p-1 bg-gradient-to-br ${isElite ? 'from-slate-100 to-slate-200' : 'from-transparent to-transparent'}`}>
            
            {/* Top Header: Team Name & Heritage Branding */}
            <div className="flex justify-between items-center px-2 py-1 mb-1 border-b-2 border-black/10">
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700 italic">
                {teamName}
              </span>
              <div className="flex items-center gap-1 opacity-40">
                <span className="text-[8px] font-black">FFBL</span>
                <Shield size={12} strokeWidth={3} className="text-slate-800" />
              </div>
            </div>

            {/* Main Photo Frame */}
            <div className="relative flex-grow bg-white border-2 border-slate-300 overflow-hidden shadow-inner">
              {/* Retro Top Prospect Banner */}
              {player.isTop100 && (
                <div className="absolute top-2 left-2 z-10 bg-yellow-400 border-2 border-black px-2 py-0.5 shadow-[3px_3px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
                  <span className="text-[10px] font-black text-black uppercase leading-none italic">
                    TOP PROSPECT #{player.prospectRank}
                  </span>
                </div>
              )}

              <img 
                src={headshotUrl} 
                alt={player.lastName} 
                className={`w-full h-full object-cover scale-110 translate-y-4 group-hover:scale-115 transition-transform duration-700 ${isElite ? 'contrast-125 saturate-150' : 'grayscale-[0.1] contrast-125'}`} 
                onError={(e) => { e.currentTarget.src = '/images/placeholders/no-player.svg'; }}
              />

              {/* Position Badge Overlay */}
              <div className="absolute bottom-3 right-3 w-12 h-12 bg-white border-2 border-black rounded-full flex flex-col items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                <span className="text-[8px] font-black text-slate-400 leading-none mb-0.5 uppercase">POS</span>
                <span className="text-sm font-black text-black leading-none">{position}</span>
              </div>
            </div>

            {/* Bottom Footer: Heavy Name Plate */}
            <div className="mt-3 mb-2 px-1">
              <div className="bg-blue-900 border-2 border-black p-2.5 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
                <div className="text-[10px] text-blue-300 font-bold uppercase tracking-[0.2em] leading-none mb-1.5">
                  {player.firstName}
                </div>
                <div className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic drop-shadow-md">
                  {player.lastName}
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              BACK OF CARD (CARDBOARD DATA)
          ========================================== */}
          <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] ${cardBackground} border-[12px] border-white p-6 flex flex-col shadow-inner`}>
            
            {/* Heritage Header */}
            <div className="flex justify-between items-start border-b-2 border-red-600 pb-2 mb-4">
              <div className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-black italic">
                NO. {player.id.toString().slice(-3).toUpperCase()}
              </div>
              <div className="text-right">
                <h3 className="text-xl font-black text-slate-800 leading-none uppercase italic">{player.lastName}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{player.firstName}</p>
              </div>
            </div>

            {/* CONDITIONAL CONTENT: Prospect Scouting vs MLB Stats */}
            <div className="flex-grow space-y-4">
              {isProspect ? (
                /* 🧢 PROSPECT VIEW: Dynamic Scouting Grades */
                <div className="bg-amber-50/60 p-3 border-2 border-dashed border-amber-300 rounded-sm">
                  <div className="flex justify-between items-end mb-3 border-b border-amber-200 pb-1">
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className="text-amber-600" />
                      <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Scouting Grades</h4>
                    </div>
                    {overallGrade && (
                      <div className="text-[9px] font-black text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded shadow-sm">
                        OVR: {overallGrade}
                      </div>
                    )}
                  </div>
                  
                  {/* Dynamic Tool Grid (Hitters vs Pitchers) */}
                  {toolGrades.length > 0 ? (
                    <div className="grid grid-cols-3 gap-y-3 gap-x-1">
                      {toolGrades.map(([label, val]) => (
                        <div key={label} className="text-center">
                          <div className="text-[8px] font-bold text-slate-400 leading-none mb-1 uppercase tracking-wider">{label}</div>
                          <div className="text-sm font-black text-slate-700 leading-none">{String(val)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-amber-700/60 font-bold italic py-2">
                      Scouting data unavailable.
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-amber-200/50 relative">
                    <div className="absolute -top-2 left-2 bg-amber-50 px-1 text-[8px] font-black text-amber-400 uppercase tracking-widest">Report</div>
                    <p className="text-[9px] leading-snug text-slate-700 italic font-medium line-clamp-3">
                      "{scoutingReportText}"
                    </p>
                  </div>
                </div>
              ) : (
                /* ⚾ MLB VET VIEW: Season Stats */
                <div className="bg-blue-50/60 p-3 border-2 border-blue-200 rounded-sm">
                  <div className="flex items-center gap-2 mb-3 border-b border-blue-200 pb-1">
                    <Activity size={14} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Projected Stats</h4>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">Avg</div>
                      <div className="text-xs font-black text-slate-700">.278</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">HR</div>
                      <div className="text-xs font-black text-slate-700">24</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">RBI</div>
                      <div className="text-xs font-black text-slate-700">82</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">OPS</div>
                      <div className="text-xs font-black text-slate-700">.842</div>
                    </div>
                  </div>
                  <div className="mt-4 py-1.5 px-2 bg-white border border-blue-100 rounded-sm text-[9px] font-black text-blue-800 text-center uppercase tracking-tighter italic">
                    Established Veteran • {teamName}
                  </div>
                </div>
              )}

              {/* Physicals Grid (Universal) */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-y border-slate-200 py-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                  <span className="text-slate-400 italic">B/T:</span>
                  <span className="text-slate-800">{player.mlbRawData?.batSide?.code || 'R'}/{player.mlbRawData?.pitchHand?.code || 'R'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                  <span className="text-slate-400 italic">Age:</span>
                  <span className="text-slate-800">{age}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                  <span className="text-slate-400 italic">Ht:</span>
                  <span className="text-slate-800">{player.mlbRawData?.height || '6\'0"'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                  <span className="text-slate-400 italic">Wt:</span>
                  <span className="text-slate-800">{player.mlbRawData?.weight || '190'}</span>
                </div>
              </div>

              {/* FFBL Ownership Footer */}
              <div className="mt-auto pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-slate-800 rounded flex items-center justify-center text-white overflow-hidden shadow-md border border-slate-700">
                    {player.team?.logoUrl ? (
                      <img src={player.team.logoUrl} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="font-black text-[10px] italic">FF</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">FFBL Franchise</span>
                    <span className="text-[11px] font-black text-slate-800 uppercase italic truncate max-w-[140px]">
                       {player.team?.name || 'Free Agent'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-slate-400 uppercase leading-none">Contract Status</span>
                  <div className="text-[10px] font-black text-red-600 leading-none uppercase italic mt-1.5 flex items-center justify-end gap-1">
                    <Activity size={10} />
                    {player.status === 'ACTIVE' ? 'Rostered' : player.status}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Cardboard Branding */}
            <div className="mt-4 pt-2 border-t border-slate-200 opacity-20 flex justify-center">
               <span className="text-[9px] font-black italic tracking-[0.3em] uppercase text-slate-900">FFBL HERITAGE COLLECTION</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 px-4 py-2 bg-white/10 backdrop-blur rounded-full border border-white/20 flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest animate-pulse shadow-xl">
         <Info size={14} /> Click card to flip
      </div>
    </div>
  );
}