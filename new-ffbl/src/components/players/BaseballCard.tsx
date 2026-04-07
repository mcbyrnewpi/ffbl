// src/components/players/BaseballCard.tsx
"use client";

import { useState, useEffect } from 'react';
import { Trophy, Shield, Info, Activity, Star } from 'lucide-react';
import { getAge, getLegacyTeam } from './card/utils';
import { CareerLegacyBoard, ProspectScoutingBoard, ActiveStatsBoard } from './card/CardBackboards';

export default function BaseballCard({ player }: { player: any }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // --- Data Normalization ---
  const isRetired = player.status === 'RETIRED';
  const isLegend = isRetired && player.hallOfFame && player.hallOfFame.length > 0;
  const isProspect = !isRetired && (player.level !== 'MLB' || !!player.prospectRank);
  const isElite = player.isTop100 && player.prospectRank <= 25 && !isRetired;

  const position = player.positions?.[0]?.abbrev || player.mlbRawData?.primaryPosition?.abbreviation || '??';
  const isPitcherDef = position === 'P' || position === 'SP' || position === 'RP' || position === 'TWP';
  const age = player.mlbRawData?.currentAge || getAge(player.birthdate);
  const headshotUrl = player.mlbId 
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_400/v1/people/${player.mlbId}/headshot/silo/current.png` 
    : '/images/placeholders/no-player.svg';

  const ffblTeamName = player.team?.name || 'Free Agent';
  const ffblTeamLogo = player.team?.logoUrl;
  const mlbTeamName = player.mlbRawData?.currentTeam?.name || 'Unassigned';
  const mlbDisplayTeam = isRetired ? getLegacyTeam(player) : mlbTeamName;

  // --- Prop Extraction for Boards ---
  const rankingsHistory = [...(player.prospectRankings || [])].sort((a: any, b: any) => a.year - b.year);
  const validRankings = rankingsHistory.filter((r: any) => Object.entries(r.scouting || {}).some(([k, v]) => k !== 'report' && k !== 'overall' && v != null));
  const latestScoutingReport = rankingsHistory[rankingsHistory.length - 1]?.scouting?.report || `"Projected ${player.prospectEta || 'future'} arrival. ${player.lastName} displays an advanced approach."`;

  const rawStats = player.mlbRawData?.stats || [];
  const availableViews = Array.from(new Set(rawStats.map((s: any) => s.group?.displayName))).filter((g: any) => ['hitting', 'pitching', 'fielding'].includes(g)) as string[];
  const defaultView = position === 'TWP' ? 'hitting' : isPitcherDef && availableViews.includes('pitching') ? 'pitching' : availableViews.includes('hitting') ? 'hitting' : availableViews[0] || 'hitting';

  const [statView, setStatView] = useState<string>(defaultView);
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);

  useEffect(() => { 
    setStatView(defaultView); 
    setIsAdvanced(false); 
  }, [player.id, defaultView]);

  let statSplits = rawStats.find((s: any) => s.type?.displayName === 'yearByYear' && s.group?.displayName === statView)?.splits || [];
  if (!statSplits.length) statSplits = rawStats.find((s: any) => s.group?.displayName === statView)?.splits || [];
  const recentSplits = statSplits.slice(-5);
  const careerSplit = rawStats.find((s: any) => s.type?.displayName === 'career' && s.group?.displayName === statView)?.splits?.[0];

  // --- Dynamic Visual Theming ---
  let cardBackground = "bg-[#f4f1ea] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]";
  if (isLegend) cardBackground = "bg-gradient-to-br from-amber-50 to-yellow-100 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]";
  else if (isRetired) cardBackground = "bg-[#e8dcc7] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]";

  let borderStyle = "border-[12px] border-white shadow-inner";
  if (isLegend) borderStyle = "border-[12px] border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]";
  else if (isElite) borderStyle = "border-[12px] border-slate-200 shadow-[0_0_20px_rgba(148,163,184,0.5)]";
  else if (isRetired) borderStyle = "border-[12px] border-[#c4af98] shadow-inner";

  let imageFilters = 'grayscale-[0.1] contrast-125';
  if (isLegend) imageFilters = 'contrast-125 saturate-150 sepia-[0.3]';
  else if (isElite) imageFilters = 'contrast-125 saturate-150';
  else if (isRetired) imageFilters = 'sepia-[0.6] contrast-100 opacity-90';

  let namePlateBg = "bg-blue-900 border-2 border-black p-2.5 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]";
  if (isLegend) namePlateBg = "bg-gradient-to-r from-yellow-600 to-yellow-500 border-2 border-yellow-800 p-2.5 shadow-[4px_4px_0px_rgba(133,77,14,0.4)]";
  else if (isRetired) namePlateBg = "bg-[#4a3c31] border-2 border-[#2a221c] p-2.5 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]";

  const foilEffect = (isLegend || isElite) ? (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 mix-blend-color-dodge">
       <div className="absolute inset-[-100%] bg-[linear-gradient(45deg,transparent_20%,rgba(255,255,255,0.8)_45%,rgba(255,255,255,0.6)_50%,rgba(255,255,255,0.8)_55%,transparent_80%)] animate-shine translate-x-[-100%]" />
    </div>
  ) : null;

  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 px-3 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-1.5 text-[8px] font-black text-white uppercase tracking-widest animate-pulse shadow-sm shrink-0">
         <Info size={10} /> Click card to flip
      </div>

      <div className="group w-full max-w-sm aspect-[2.5/3.5] [perspective:1000px] cursor-pointer relative" onClick={() => setIsFlipped(!isFlipped)}>
        {foilEffect}
        <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] shadow-[0_30px_60px_rgba(0,0,0,0.4)] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          
          {/* ==========================================
              FRONT OF CARD
          ========================================== */}
          <div className={`absolute inset-0 [backface-visibility:hidden] ${cardBackground} ${borderStyle} flex flex-col p-1`}>
            <div className="flex justify-between items-center px-2 py-1 mb-1 border-b-2 border-black/10">
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700 italic truncate">
                {isRetired && ffblTeamName === 'Free Agent' ? 'Alumni Archive' : ffblTeamName}
              </span>
              <div className="flex items-center gap-1.5 opacity-80 shrink-0 pl-2">
                <span className="text-[8px] font-black text-slate-500">{isLegend ? 'HOF' : 'FFBL'}</span>
                {ffblTeamLogo ? <img src={ffblTeamLogo} alt="Logo" className="w-4 h-4 object-contain" /> : <Shield size={12} className="text-slate-800" />}
              </div>
            </div>

            <div className="relative flex-grow bg-white border-2 border-slate-300 overflow-hidden shadow-inner">
              {isLegend ? (
                <div className="absolute top-2 left-2 z-10 bg-yellow-400 border-2 border-yellow-800 px-2 py-0.5 shadow-[3px_3px_0px_rgba(133,77,14,1)] rotate-[-2deg]">
                  <span className="text-[10px] font-black text-yellow-900 uppercase italic flex items-center gap-1"><Star size={10} fill="currentColor" /> FFBL LEGEND</span>
                </div>
              ) : isRetired ? (
                <div className="absolute top-2 left-2 z-10 bg-[#4a3c31] border-2 border-[#2a221c] px-2 py-0.5 rotate-[-2deg]">
                  <span className="text-[10px] font-black text-[#dac4a4] uppercase italic">ALUMNI</span>
                </div>
              ) : isElite ? (
                <div className="absolute top-2 left-2 z-10 bg-yellow-400 border-2 border-black px-2 py-0.5 shadow-[3px_3px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
                  <span className="text-[10px] font-black text-black uppercase italic">TOP PROSPECT #{player.prospectRank}</span>
                </div>
              ) : null}

              <img src={headshotUrl} alt={player.lastName} className={`w-full h-full object-cover scale-110 translate-y-4 group-hover:scale-115 transition-transform duration-700 ${imageFilters}`} />
              
              <div className="absolute bottom-3 right-3 w-12 h-12 bg-white border-2 border-black rounded-full flex flex-col items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                <span className="text-[8px] font-black text-slate-400 mb-0.5 uppercase">POS</span>
                <span className="text-sm font-black text-black leading-none">{position}</span>
              </div>
            </div>

            <div className="mt-3 mb-2 px-1">
              <div className={namePlateBg}>
                <div className={`text-[10px] font-bold uppercase tracking-[0.2em] leading-none mb-1.5 flex justify-between ${isLegend ? 'text-yellow-100' : isRetired ? 'text-[#dac4a4]' : 'text-blue-300'}`}>
                  <span>{player.firstName}</span>
                  <span className="truncate ml-2">{mlbDisplayTeam}</span>
                </div>
                <div className="text-2xl font-black text-white uppercase italic truncate tracking-tighter">{player.lastName}</div>
              </div>
            </div>
          </div>

          {/* ==========================================
              BACK OF CARD
          ========================================== */}
          <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] ${cardBackground} border-[12px] ${isLegend ? 'border-yellow-400' : 'border-white'} p-4 sm:p-5 flex flex-col shadow-inner`}>
            
            <div className={`flex justify-between items-start border-b-2 pb-2 mb-2 ${isLegend ? 'border-yellow-500' : isRetired ? 'border-[#4a3c31]' : 'border-red-600'}`}>
              <div className={`${isLegend ? 'bg-yellow-500' : isRetired ? 'bg-[#4a3c31]' : 'bg-red-600'} text-white px-2 py-0.5 text-[10px] font-black italic shadow-sm shrink-0`}>NO. {player.mlbRawData?.primaryNumber || '??'}</div>
              <div className="text-right min-w-0 pl-2">
                <h3 className="text-lg font-black text-slate-800 leading-none uppercase italic truncate">{player.lastName}</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{player.firstName}</p>
              </div>
            </div>

            <div className="flex-grow flex flex-col space-y-2 min-h-0">
              
              {/* 🌟 RENDER THE CORRECT DASHBOARD SUB-COMPONENT */}
              {isRetired ? (
                <CareerLegacyBoard isLegend={isLegend} statView={statView} setStatView={setStatView} isAdvanced={isAdvanced} setIsAdvanced={setIsAdvanced} availableViews={availableViews} careerSplit={careerSplit} />
              ) : isProspect ? (
                <ProspectScoutingBoard validRankings={validRankings} isPitcherDef={isPitcherDef} statView={statView} latestScoutingReport={latestScoutingReport} />
              ) : (
                <ActiveStatsBoard statView={statView} setStatView={setStatView} isAdvanced={isAdvanced} setIsAdvanced={setIsAdvanced} availableViews={availableViews} recentSplits={recentSplits} careerSplit={careerSplit} mlbTeamName={mlbTeamName} />
              )}

              {/* Physicals Grid */}
              <div className="grid grid-cols-2 gap-x-6 border-y border-slate-200 py-1 flex-shrink-0">
                <div className="flex justify-between text-[8px] font-bold uppercase"><span className="text-slate-400">B/T:</span><span className="text-slate-800">{player.mlbRawData?.batSide?.code || 'R'}/{player.mlbRawData?.pitchHand?.code || 'R'}</span></div>
                <div className="flex justify-between text-[8px] font-bold uppercase"><span className="text-slate-400">Age:</span><span className="text-slate-800">{age}</span></div>
              </div>

              {/* Ownership Footer */}
              <div className="pt-1 flex items-center justify-between flex-shrink-0">
                <div className="flex flex-col">
                  <span className="text-[6.5px] font-black text-slate-400 uppercase leading-none">FFBL Archive</span>
                  <span className="text-[9px] font-black text-slate-800 uppercase italic truncate">{isLegend ? 'Hall of Fame' : isRetired ? 'Retired Alumni' : ffblTeamName}</span>
                </div>
                <div className={`text-[8.5px] font-black italic flex items-center gap-1 ${isLegend ? 'text-yellow-600' : isRetired ? 'text-[#4a3c31]' : 'text-red-600'}`}>
                  {isLegend ? <Star size={8} fill="currentColor" /> : <Activity size={8} />} {isLegend ? 'LEGEND' : isRetired ? 'RETIRED' : player.status === 'ACTIVE' ? 'ROSTERED' : 'FREE AGENT'}
                </div>
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-slate-200 opacity-20 flex justify-center shrink-0">
               <span className="text-[7px] font-black italic tracking-[0.3em] uppercase text-slate-900">FFBL HERITAGE COLLECTION</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}