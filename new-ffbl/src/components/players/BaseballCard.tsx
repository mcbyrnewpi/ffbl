// src/components/players/BaseballCard.tsx
"use client";

import { useState, useEffect } from 'react';
import { Trophy, Shield, Info, Activity } from 'lucide-react';

// Helper to calculate age if not provided by MLB API
const getAge = (birthdate: string | Date | null) => {
  if (!birthdate) return '??';
  const diff = Date.now() - new Date(birthdate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

// Helper to map full MLB team names to standard 3-letter abbreviations
const getTeamAbbrev = (teamName?: string) => {
  if (!teamName) return 'TOT';
  const specialCases: Record<string, string> = {
    "Tampa Bay Rays": "TB", "Seattle Mariners": "SEA", "New York Yankees": "NYY", 
    "New York Mets": "NYM", "Boston Red Sox": "BOS", "Los Angeles Dodgers": "LAD",
    "Los Angeles Angels": "LAA", "San Diego Padres": "SD", "San Francisco Giants": "SF",
    "Chicago White Sox": "CWS", "Chicago Cubs": "CHC", "Kansas City Royals": "KC",
    "Toronto Blue Jays": "TOR", "Baltimore Orioles": "BAL", "Minnesota Twins": "MIN",
    "Cleveland Guardians": "CLE", "Detroit Tigers": "DET", "Houston Astros": "HOU",
    "Oakland Athletics": "OAK", "Texas Rangers": "TEX", "Atlanta Braves": "ATL",
    "Miami Marlins": "MIA", "Washington Nationals": "WSH", "Philadelphia Phillies": "PHI",
    "Cincinnati Reds": "CIN", "Milwaukee Brewers": "MIL", "Pittsburgh Pirates": "PIT",
    "St. Louis Cardinals": "STL", "Colorado Rockies": "COL", "Arizona Diamondbacks": "ARI"
  };
  return specialCases[teamName] || teamName.substring(0, 3).toUpperCase();
};

// Math Helpers for Advanced Stats
const getKBB = (stat: any) => {
  if (!stat) return '--';
  if (stat.strikeoutWalkRatio) return stat.strikeoutWalkRatio;
  if (stat.baseOnBalls > 0) return (stat.strikeOuts / stat.baseOnBalls).toFixed(2);
  if (stat.strikeOuts > 0) return 'MAX';
  return '--';
};

const getRatePct = (part: number | undefined, total: number | undefined) => {
  if (part == null || total == null || total === 0) return '--';
  return ((part / total) * 100).toFixed(1) + '%';
};

export default function BaseballCard({ player }: { player: any }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // --- Data Normalization ---
  const isProspect = player.level !== 'MLB' || !!player.prospectRank;
  const position = player.positions?.[0]?.abbrev || player.mlbRawData?.primaryPosition?.abbreviation || '??';
  // Handles Ohtani's 'TWP' position code safely
  const isPitcherDef = position === 'P' || position === 'SP' || position === 'RP' || position === 'TWP';
  const age = player.mlbRawData?.currentAge || getAge(player.birthdate);
  const headshotUrl = player.mlbId 
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_400/v1/people/${player.mlbId}/headshot/silo/current.png` 
    : '/images/placeholders/no-player.svg';

  // FFBL Team Info
  const ffblTeamName = player.team?.name || 'Free Agent';
  const ffblTeamLogo = player.team?.logoUrl;
  const mlbTeamName = player.mlbRawData?.currentTeam?.name || 'Unassigned';

  // --- Extract Prospect History ---
  const rankingsHistory = [...(player.prospectRankings || [])].sort((a: any, b: any) => a.year - b.year);
  
  const validRankings = rankingsHistory.filter((r: any) => {
    const sc = r.scouting || {};
    return Object.entries(sc).some(([k, v]) => k !== 'report' && k !== 'overall' && v != null);
  });

  const latestRanking = rankingsHistory[rankingsHistory.length - 1];
  const latestScoutingReport = latestRanking?.scouting?.report || `"Projected ${player.prospectEta || 'future'} arrival. ${player.lastName} displays an advanced approach with a high ceiling."`;

  // --- Extract MLB Stats History ---
  const rawStats = player.mlbRawData?.stats || [];
  
  const availableViews = Array.from(new Set(rawStats.map((s: any) => s.group?.displayName)))
    .filter((g: any) => ['hitting', 'pitching', 'fielding'].includes(g)) as string[];
  
  // For TWP (Ohtani), prioritize hitting default unless pitching is explicitly forced
  const defaultView = position === 'TWP' ? 'hitting' :
                      isPitcherDef && availableViews.includes('pitching') ? 'pitching' : 
                      availableViews.includes('hitting') ? 'hitting' : 
                      availableViews[0] || 'hitting';

  const [statView, setStatView] = useState<string>(defaultView);
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);

  useEffect(() => { 
    setStatView(defaultView); 
    setIsAdvanced(false);
  }, [player.id, defaultView]);

  let statSplits = rawStats.find((s: any) => s.type?.displayName === 'yearByYear' && s.group?.displayName === statView)?.splits || [];
  if (!statSplits.length) {
    statSplits = rawStats.find((s: any) => s.group?.displayName === statView)?.splits || [];
  }
  const recentSplits = statSplits.slice(-5);
  
  const careerSplit = rawStats.find((s: any) => s.type?.displayName === 'career' && s.group?.displayName === statView)?.splits?.[0];

  // --- Visual Constants & Foil Effect ---
  const cardBackground = "bg-[#f4f1ea] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]";
  const isElite = player.isTop100 && player.prospectRank <= 25;
  
  const borderStyle = isElite 
    ? "border-[12px] border-slate-200 shadow-[0_0_20px_rgba(148,163,184,0.5)]" 
    : "border-[12px] border-white shadow-inner";

  const foilEffect = isElite ? (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 mix-blend-color-dodge">
       <div className="absolute inset-[-100%] bg-[linear-gradient(45deg,transparent_20%,rgba(255,255,255,0.8)_45%,rgba(255,200,255,0.6)_50%,rgba(200,255,255,0.8)_55%,transparent_80%)] animate-shine translate-x-[-100%]" />
    </div>
  ) : null;

  return (
    <div className="flex flex-col items-center">
      
      <div className="mb-3 px-3 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-1.5 text-[8px] font-black text-white uppercase tracking-widest animate-pulse shadow-sm shrink-0">
         <Info size={10} /> Click card to flip
      </div>

      <div 
        className="group w-full max-w-sm aspect-[2.5/3.5] [perspective:1000px] cursor-pointer relative" 
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {foilEffect}

        <div 
          className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] shadow-[0_30px_60px_rgba(0,0,0,0.4)] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          
          {/* ==========================================
              FRONT OF CARD
          ========================================== */}
          <div className={`absolute inset-0 [backface-visibility:hidden] ${cardBackground} ${borderStyle} flex flex-col p-1 bg-gradient-to-br ${isElite ? 'from-slate-100 to-slate-200' : 'from-transparent to-transparent'}`}>
            <div className="flex justify-between items-center px-2 py-1 mb-1 border-b-2 border-black/10">
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700 italic truncate">
                {ffblTeamName}
              </span>
              <div className="flex items-center gap-1.5 opacity-80 shrink-0 pl-2">
                <span className="text-[8px] font-black text-slate-500">FFBL</span>
                {ffblTeamLogo ? (
                  <img src={ffblTeamLogo} alt="Team Logo" className="w-4 h-4 object-contain" />
                ) : (
                  <Shield size={12} strokeWidth={3} className="text-slate-800" />
                )}
              </div>
            </div>

            <div className="relative flex-grow bg-white border-2 border-slate-300 overflow-hidden shadow-inner">
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
              <div className="absolute bottom-3 right-3 w-12 h-12 bg-white border-2 border-black rounded-full flex flex-col items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                <span className="text-[8px] font-black text-slate-400 leading-none mb-0.5 uppercase">POS</span>
                <span className="text-sm font-black text-black leading-none">{position}</span>
              </div>
            </div>

            <div className="mt-3 mb-2 px-1">
              <div className="bg-blue-900 border-2 border-black p-2.5 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
                <div className="text-[10px] text-blue-300 font-bold uppercase tracking-[0.2em] leading-none mb-1.5 flex justify-between">
                  <span>{player.firstName}</span>
                  <span className="text-blue-500/80 truncate ml-2">{mlbTeamName}</span>
                </div>
                <div className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic drop-shadow-md truncate">
                  {player.lastName}
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              BACK OF CARD
          ========================================== */}
          <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] ${cardBackground} border-[12px] border-white p-4 sm:p-5 flex flex-col shadow-inner`}>
            
            <div className="flex justify-between items-start border-b-2 border-red-600 pb-2 mb-2">
              <div className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-black italic shadow-sm shrink-0">
                NO. {player.id.toString().slice(-3).toUpperCase()}
              </div>
              <div className="text-right min-w-0 pl-2">
                <h3 className="text-lg font-black text-slate-800 leading-none uppercase italic truncate">{player.lastName}</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{player.firstName}</p>
              </div>
            </div>

            <div className="flex-grow flex flex-col space-y-2 min-h-0">
              {isProspect ? (
                /* Prospect: Year-by-Year Scouting Table */
                <div className="bg-amber-50/60 p-2 border-2 border-dashed border-amber-300 rounded-sm flex flex-col flex-grow overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-2 border-b border-amber-200 pb-1">
                    <Trophy size={12} className="text-amber-600" />
                    <h4 className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Scouting History</h4>
                  </div>
                  
                  {validRankings.length > 0 ? (
                    <div className="overflow-x-auto overflow-y-hidden mb-2">
                      <table className="w-full text-center text-[8px] sm:text-[9px] table-fixed">
                        <thead>
                          <tr className="border-b-2 border-amber-300 text-amber-800">
                            <th className="text-left font-black pb-1 w-8">YR</th>
                            <th className="font-black pb-1">OVR</th>
                            {isPitcherDef && statView === 'pitching' ? (
                              <>
                                <th className="font-bold pb-1 text-slate-400">FB</th>
                                <th className="font-bold pb-1 text-slate-400">SL</th>
                                <th className="font-bold pb-1 text-slate-400">CB</th>
                                <th className="font-bold pb-1 text-slate-400">CH</th>
                                <th className="font-bold pb-1 text-slate-400">CTRL</th>
                              </>
                            ) : (
                              <>
                                <th className="font-bold pb-1 text-slate-400">HIT</th>
                                <th className="font-bold pb-1 text-slate-400">PWR</th>
                                <th className="font-bold pb-1 text-slate-400">RUN</th>
                                <th className="font-bold pb-1 text-slate-400">ARM</th>
                                <th className="font-bold pb-1 text-slate-400">FLD</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-200/50 text-slate-700 font-medium">
                          {validRankings.map((r: any) => {
                            const sc = r.scouting || {};
                            return (
                              <tr key={r.year} className="hover:bg-amber-100/50 transition-colors">
                                <td className="text-left py-1 font-black text-amber-900">{r.year}</td>
                                <td className="py-1 font-black">{sc.overall ?? '--'}</td>
                                {isPitcherDef && statView === 'pitching' ? (
                                  <>
                                    <td className="py-1">{sc.fastball ?? '--'}</td>
                                    <td className="py-1">{sc.slider ?? '--'}</td>
                                    <td className="py-1">{sc.curveball ?? '--'}</td>
                                    <td className="py-1">{sc.changeup ?? '--'}</td>
                                    <td className="py-1">{sc.control ?? '--'}</td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-1">{sc.hit ?? '--'}</td>
                                    <td className="py-1">{sc.power ?? '--'}</td>
                                    <td className="py-1">{sc.run ?? '--'}</td>
                                    <td className="py-1">{sc.arm ?? '--'}</td>
                                    <td className="py-1">{sc.field ?? '--'}</td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-amber-700/60 font-bold italic py-2">
                      Scouting history unavailable.
                    </div>
                  )}

                  <div className="mt-auto pt-2 border-t border-amber-200/50 relative">
                    <div className="absolute -top-2 left-2 bg-amber-50 px-1 text-[8px] font-black text-amber-400 uppercase tracking-widest">Report</div>
                    <p className="text-[7.5px] leading-snug text-slate-700 italic font-medium line-clamp-4">
                      "{latestScoutingReport}"
                    </p>
                  </div>
                </div>
              ) : (
                /* Veteran: Year-by-Year MLB Stats */
                <div className="bg-blue-50/60 p-2 border-2 border-blue-200 rounded-sm flex flex-col flex-grow">
                  
                  {/* Dynamic Header & Toggles */}
                  <div className="flex items-center justify-between mb-1.5 border-b border-blue-200 pb-1">
                    <div className="flex items-center gap-1.5">
                      <Activity size={12} className="text-blue-600" />
                      <h4 className="text-[9px] font-black text-blue-800 uppercase tracking-widest">MLB History</h4>
                    </div>
                    
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* 🌟 UPDATED: The STD / ADV Toggle matches HIT/PIT/FLD styling exactly */}
                      {statView !== 'fielding' && (
                        <div className="flex gap-1">
                          <button onClick={() => setIsAdvanced(false)} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${!isAdvanced ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>STD</button>
                          <button onClick={() => setIsAdvanced(true)} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${isAdvanced ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>ADV</button>
                        </div>
                      )}

                      {/* The Positional Toggles */}
                      {availableViews.length > 1 && (
                        <div className="flex gap-1 border-l border-blue-300 pl-1.5">
                          {availableViews.includes('hitting') && (
                            <button onClick={() => setStatView('hitting')} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${statView === 'hitting' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>HIT</button>
                          )}
                          {availableViews.includes('pitching') && (
                            <button onClick={() => setStatView('pitching')} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${statView === 'pitching' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>PIT</button>
                          )}
                          {availableViews.includes('fielding') && (
                            <button onClick={() => setStatView('fielding')} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${statView === 'fielding' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>FLD</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {recentSplits.length > 0 ? (
                    <div className="overflow-x-auto flex-grow">
                      <table className="w-full text-center text-[7px] sm:text-[8px] table-fixed">
                        <thead>
                          <tr className="border-b-2 border-blue-300 text-blue-800">
                            <th className="text-left font-black pb-1 w-6">YR</th>
                            <th className="text-left font-bold pb-1 text-slate-400 w-6">TM</th>
                            {statView === 'pitching' ? (
                              isAdvanced ? (
                                <>
                                  <th className="font-bold pb-1 text-slate-400">BF</th>
                                  <th className="font-bold pb-1 text-slate-400">K/9</th>
                                  <th className="font-bold pb-1 text-slate-400">BB/9</th>
                                  <th className="font-bold pb-1 text-slate-400">HR/9</th>
                                  <th className="font-bold pb-1 text-slate-400">K/BB</th>
                                  <th className="font-bold pb-1 text-slate-400">BAA</th>
                                  <th className="font-bold pb-1 text-slate-400">WHIP</th>
                                </>
                              ) : (
                                <>
                                  <th className="font-bold pb-1 text-slate-400">IP</th>
                                  <th className="font-bold pb-1 text-slate-400">W</th>
                                  <th className="font-bold pb-1 text-slate-400">SV</th>
                                  <th className="font-bold pb-1 text-slate-400">K</th>
                                  <th className="font-bold pb-1 text-slate-400">ERA</th>
                                  <th className="font-bold pb-1 text-slate-400">WHIP</th>
                                  <th className="font-bold pb-1 text-slate-400">K/BB</th>
                                </>
                              )
                            ) : statView === 'fielding' ? (
                              <>
                                <th className="font-bold pb-1 text-slate-400">POS</th>
                                <th className="font-bold pb-1 text-slate-400">INN</th>
                                <th className="font-bold pb-1 text-slate-400">PO</th>
                                <th className="font-bold pb-1 text-slate-400">A</th>
                                <th className="font-bold pb-1 text-slate-400">E</th>
                                <th className="font-bold pb-1 text-slate-400">FLD%</th>
                              </>
                            ) : (
                              isAdvanced ? (
                                <>
                                  <th className="font-bold pb-1 text-slate-400">PA</th>
                                  <th className="font-bold pb-1 text-slate-400">K%</th>
                                  <th className="font-bold pb-1 text-slate-400">BB%</th>
                                  <th className="font-bold pb-1 text-slate-400">BABIP</th>
                                  <th className="font-bold pb-1 text-slate-400">GO/AO</th>
                                  <th className="font-bold pb-1 text-slate-400">AB/HR</th>
                                  <th className="font-bold pb-1 text-slate-400">SB%</th>
                                </>
                              ) : (
                                <>
                                  <th className="font-bold pb-1 text-slate-400">G</th>
                                  <th className="font-bold pb-1 text-slate-400">R</th>
                                  <th className="font-bold pb-1 text-slate-400">HR</th>
                                  <th className="font-bold pb-1 text-slate-400">RBI</th>
                                  <th className="font-bold pb-1 text-slate-400">SB</th>
                                  <th className="font-bold pb-1 text-slate-400">AVG</th>
                                  <th className="font-bold pb-1 text-slate-400">OPS</th>
                                </>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-200/50 text-slate-700 font-medium tracking-tighter">
                          {/* Map the Yearly Splits */}
                          {recentSplits.map((s: any, idx: number) => {
                            const teamAbbrev = getTeamAbbrev(s.team?.name);
                            return (
                              <tr key={idx} className="hover:bg-blue-100/50 transition-colors">
                                <td className="text-left py-1 font-black text-blue-900">{s.season || '----'}</td>
                                <td className="text-left py-1 text-slate-500 font-bold truncate pr-1" title={s.team?.name || 'Total'}>
                                  {teamAbbrev}
                                </td>
                                {statView === 'pitching' ? (
                                  isAdvanced ? (
                                    <>
                                      <td className="py-1">{s.stat?.battersFaced ?? '--'}</td>
                                      <td className="py-1">{s.stat?.strikeoutsPer9Inn ?? '-.--'}</td>
                                      <td className="py-1">{s.stat?.walksPer9Inn ?? '-.--'}</td>
                                      <td className="py-1">{s.stat?.homeRunsPer9 ?? '-.--'}</td>
                                      <td className="py-1">{getKBB(s.stat)}</td>
                                      <td className="py-1">{s.stat?.avg ?? '.---'}</td>
                                      <td className="py-1">{s.stat?.whip ?? '-.--'}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-1">{s.stat?.inningsPitched ?? s.stat?.innings ?? '-.-'}</td>
                                      <td className="py-1">{s.stat?.wins ?? '--'}</td>
                                      <td className="py-1">{s.stat?.saves ?? '--'}</td>
                                      <td className="py-1">{s.stat?.strikeOuts ?? '--'}</td>
                                      <td className="py-1">{s.stat?.era ?? '-.--'}</td>
                                      <td className="py-1">{s.stat?.whip ?? '-.--'}</td>
                                      <td className="py-1">{getKBB(s.stat)}</td>
                                    </>
                                  )
                                ) : statView === 'fielding' ? (
                                  <>
                                    <td className="py-1">{s.position?.abbreviation ?? '--'}</td>
                                    <td className="py-1">{s.stat?.innings ?? '-.-'}</td>
                                    <td className="py-1">{s.stat?.putOuts ?? '--'}</td>
                                    <td className="py-1">{s.stat?.assists ?? '--'}</td>
                                    <td className="py-1">{s.stat?.errors ?? '--'}</td>
                                    <td className="py-1">{s.stat?.fielding ?? '.---'}</td>
                                  </>
                                ) : (
                                  isAdvanced ? (
                                    <>
                                      <td className="py-1">{s.stat?.plateAppearances ?? '--'}</td>
                                      <td className="py-1">{getRatePct(s.stat?.strikeOuts, s.stat?.plateAppearances)}</td>
                                      <td className="py-1">{getRatePct(s.stat?.baseOnBalls, s.stat?.plateAppearances)}</td>
                                      <td className="py-1">{s.stat?.babip ?? '.---'}</td>
                                      <td className="py-1">{s.stat?.groundOutsToAirouts ?? '-.--'}</td>
                                      <td className="py-1">{s.stat?.atBatsPerHomeRun ?? '-.--'}</td>
                                      <td className="py-1">{s.stat?.stolenBasePercentage ?? '.---'}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-1">{s.stat?.gamesPlayed ?? '--'}</td>
                                      <td className="py-1">{s.stat?.runs ?? '--'}</td>
                                      <td className="py-1">{s.stat?.homeRuns ?? '--'}</td>
                                      <td className="py-1">{s.stat?.rbi ?? '--'}</td>
                                      <td className="py-1">{s.stat?.stolenBases ?? '--'}</td>
                                      <td className="py-1">{s.stat?.avg ?? '.---'}</td>
                                      <td className="py-1">{s.stat?.ops ?? '.---'}</td>
                                    </>
                                  )
                                )}
                              </tr>
                            );
                          })}

                          {/* The Career Row */}
                          {careerSplit && (
                            <tr className="bg-blue-200/40 font-black border-t-2 border-blue-300">
                                <td className="text-left py-1 text-blue-900">CAR</td>
                                <td className="text-left py-1 text-slate-500">TOT</td>
                                {statView === 'pitching' ? (
                                  isAdvanced ? (
                                    <>
                                      <td className="py-1">{careerSplit.stat?.battersFaced ?? '--'}</td>
                                      <td className="py-1">{careerSplit.stat?.strikeoutsPer9Inn ?? '-.--'}</td>
                                      <td className="py-1">{careerSplit.stat?.walksPer9Inn ?? '-.--'}</td>
                                      <td className="py-1">{careerSplit.stat?.homeRunsPer9 ?? '-.--'}</td>
                                      <td className="py-1">{getKBB(careerSplit.stat)}</td>
                                      <td className="py-1">{careerSplit.stat?.avg ?? '.---'}</td>
                                      <td className="py-1">{careerSplit.stat?.whip ?? '-.--'}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-1">{careerSplit.stat?.inningsPitched ?? careerSplit.stat?.innings ?? '-.-'}</td>
                                      <td className="py-1">{careerSplit.stat?.wins ?? '--'}</td>
                                      <td className="py-1">{careerSplit.stat?.saves ?? '--'}</td>
                                      <td className="py-1">{careerSplit.stat?.strikeOuts ?? '--'}</td>
                                      <td className="py-1">{careerSplit.stat?.era ?? '-.--'}</td>
                                      <td className="py-1">{careerSplit.stat?.whip ?? '-.--'}</td>
                                      <td className="py-1">{getKBB(careerSplit.stat)}</td>
                                    </>
                                  )
                                ) : statView === 'fielding' ? (
                                  <>
                                    <td className="py-1">--</td>
                                    <td className="py-1">{careerSplit.stat?.innings ?? '-.-'}</td>
                                    <td className="py-1">{careerSplit.stat?.putOuts ?? '--'}</td>
                                    <td className="py-1">{careerSplit.stat?.assists ?? '--'}</td>
                                    <td className="py-1">{careerSplit.stat?.errors ?? '--'}</td>
                                    <td className="py-1">{careerSplit.stat?.fielding ?? '.---'}</td>
                                  </>
                                ) : (
                                  isAdvanced ? (
                                    <>
                                      <td className="py-1">{careerSplit.stat?.plateAppearances ?? '--'}</td>
                                      <td className="py-1">{getRatePct(careerSplit.stat?.strikeOuts, careerSplit.stat?.plateAppearances)}</td>
                                      <td className="py-1">{getRatePct(careerSplit.stat?.baseOnBalls, careerSplit.stat?.plateAppearances)}</td>
                                      <td className="py-1">{careerSplit.stat?.babip ?? '.---'}</td>
                                      <td className="py-1">{careerSplit.stat?.groundOutsToAirouts ?? '-.--'}</td>
                                      <td className="py-1">{careerSplit.stat?.atBatsPerHomeRun ?? '-.--'}</td>
                                      <td className="py-1">{careerSplit.stat?.stolenBasePercentage ?? '.---'}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-1">{careerSplit.stat?.gamesPlayed ?? '--'}</td>
                                      <td className="py-1">{careerSplit.stat?.runs ?? '--'}</td>
                                      <td className="py-1">{careerSplit.stat?.homeRuns ?? '--'}</td>
                                      <td className="py-1">{careerSplit.stat?.rbi ?? '--'}</td>
                                      <td className="py-1">{careerSplit.stat?.stolenBases ?? '--'}</td>
                                      <td className="py-1">{careerSplit.stat?.avg ?? '.---'}</td>
                                      <td className="py-1">{careerSplit.stat?.ops ?? '.---'}</td>
                                    </>
                                  )
                                )}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-blue-700/60 font-bold italic py-2">
                      Stats unavailable.
                    </div>
                  )}
                  
                  <div className="mt-auto py-1 px-2 bg-white border border-blue-100 rounded-sm text-[7px] font-black text-blue-800 text-center uppercase tracking-tighter italic shrink-0">
                    MLB Franchise: {mlbTeamName}
                  </div>
                </div>
              )}

              {/* Physicals Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-y border-slate-200 py-1.5 shrink-0">
                <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
                  <span className="text-slate-400 italic">B/T:</span>
                  <span className="text-slate-800">{player.mlbRawData?.batSide?.code || 'R'}/{player.mlbRawData?.pitchHand?.code || 'R'}</span>
                </div>
                <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
                  <span className="text-slate-400 italic">Age:</span>
                  <span className="text-slate-800">{age}</span>
                </div>
                <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
                  <span className="text-slate-400 italic">Ht:</span>
                  <span className="text-slate-800">{player.mlbRawData?.height || '6\'0"'}</span>
                </div>
                <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
                  <span className="text-slate-400 italic">Wt:</span>
                  <span className="text-slate-800">{player.mlbRawData?.weight || '190'}</span>
                </div>
              </div>

              {/* FFBL Ownership Footer */}
              <div className="pt-1 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-white rounded flex items-center justify-center overflow-hidden shadow-sm border border-slate-300 shrink-0">
                    {ffblTeamLogo ? (
                      <img src={ffblTeamLogo} alt={ffblTeamName} className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <span className="font-black text-[8px] italic text-slate-800">FF</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[6.5px] font-black text-slate-400 uppercase leading-none mb-0.5">FFBL Franchise</span>
                    <span className="text-[9px] font-black text-slate-800 uppercase italic truncate max-w-[120px]">
                       {ffblTeamName}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="text-[6.5px] font-black text-slate-400 uppercase leading-none">Contract Status</span>
                  <div className="text-[8.5px] font-black text-red-600 leading-none uppercase italic mt-1 flex items-center justify-end gap-1">
                    <Activity size={8} />
                    {player.status === 'ACTIVE' ? 'Rostered' : player.status}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Cardboard Branding */}
            <div className="mt-2 pt-1 border-t border-slate-200 opacity-20 flex justify-center shrink-0">
               <span className="text-[7px] font-black italic tracking-[0.3em] uppercase text-slate-900">FFBL HERITAGE COLLECTION</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}