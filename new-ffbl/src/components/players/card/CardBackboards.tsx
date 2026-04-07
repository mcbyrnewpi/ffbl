// src/components/players/card/CardBackboards.tsx
import { Trophy, Activity } from 'lucide-react';
import { getTeamAbbrev, getKBB, getRatePct } from './utils';

// Reusable mini-stat component
export const CareerStat = ({ label, value }: { label: string, value: string | number | undefined }) => (
  <div className="flex flex-col items-center">
     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
     <span className="text-2xl font-black text-slate-800 leading-none">{value ?? '--'}</span>
  </div>
);

// --- 1. RETIRED / LEGEND BOARD ---
export const CareerLegacyBoard = ({ isLegend, statView, setStatView, isAdvanced, setIsAdvanced, availableViews, careerSplit }: any) => (
  <div className={`p-3 border-2 rounded-sm flex flex-col flex-grow ${isLegend ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-[#4a3c31]/5 border-[#4a3c31]/20'}`}>
     <div className="flex items-center justify-between mb-3 border-b border-black/10 pb-2">
        <div className="flex items-center gap-1.5">
           <Trophy size={14} className={isLegend ? 'text-yellow-600' : 'text-[#4a3c31]'} />
           <h4 className={`text-[10px] font-black uppercase tracking-widest ${isLegend ? 'text-yellow-800' : 'text-[#4a3c31]'}`}>Career Legacy</h4>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {statView !== 'fielding' && (
            <div className="flex gap-1">
              <button onClick={() => setIsAdvanced(false)} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${!isAdvanced ? (isLegend ? 'bg-yellow-500 text-white' : 'bg-[#4a3c31] text-white') : 'bg-white text-slate-500 hover:bg-slate-100'}`}>STD</button>
              <button onClick={() => setIsAdvanced(true)} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${isAdvanced ? (isLegend ? 'bg-yellow-500 text-white' : 'bg-[#4a3c31] text-white') : 'bg-white text-slate-500 hover:bg-slate-100'}`}>ADV</button>
            </div>
          )}
          {availableViews.length > 1 && (
            <div className="flex gap-1 border-l border-black/20 pl-1.5">
              {availableViews.includes('hitting') && <button onClick={() => setStatView('hitting')} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${statView === 'hitting' ? (isLegend ? 'bg-yellow-500 text-white' : 'bg-[#4a3c31] text-white') : 'bg-white text-slate-500 hover:bg-slate-100'}`}>HIT</button>}
              {availableViews.includes('pitching') && <button onClick={() => setStatView('pitching')} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${statView === 'pitching' ? (isLegend ? 'bg-yellow-500 text-white' : 'bg-[#4a3c31] text-white') : 'bg-white text-slate-500 hover:bg-slate-100'}`}>PIT</button>}
              {availableViews.includes('fielding') && <button onClick={() => setStatView('fielding')} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${statView === 'fielding' ? (isLegend ? 'bg-yellow-500 text-white' : 'bg-[#4a3c31] text-white') : 'bg-white text-slate-500 hover:bg-slate-100'}`}>FLD</button>}
            </div>
          )}
        </div>
     </div>

     {careerSplit ? (
        <div className="flex-grow flex flex-col justify-center">
           <div className="grid grid-cols-3 gap-y-6 gap-x-2 text-center">
              {statView === 'hitting' ? (
                 isAdvanced ? (
                    <><CareerStat label="PA" value={careerSplit.stat?.plateAppearances} /><CareerStat label="K%" value={getRatePct(careerSplit.stat?.strikeOuts, careerSplit.stat?.plateAppearances)} /><CareerStat label="BB%" value={getRatePct(careerSplit.stat?.baseOnBalls, careerSplit.stat?.plateAppearances)} /><CareerStat label="BABIP" value={careerSplit.stat?.babip} /><CareerStat label="GO/AO" value={careerSplit.stat?.groundOutsToAirouts} /><CareerStat label="AB/HR" value={careerSplit.stat?.atBatsPerHomeRun} /></>
                 ) : (
                    <><CareerStat label="G" value={careerSplit.stat?.gamesPlayed} /><CareerStat label="HITS" value={careerSplit.stat?.hits} /><CareerStat label="HR" value={careerSplit.stat?.homeRuns} /><CareerStat label="RBI" value={careerSplit.stat?.rbi} /><CareerStat label="AVG" value={careerSplit.stat?.avg} /><CareerStat label="OPS" value={careerSplit.stat?.ops} /></>
                 )
              ) : statView === 'pitching' ? (
                 isAdvanced ? (
                    <><CareerStat label="BF" value={careerSplit.stat?.battersFaced} /><CareerStat label="K/9" value={careerSplit.stat?.strikeoutsPer9Inn} /><CareerStat label="BB/9" value={careerSplit.stat?.walksPer9Inn} /><CareerStat label="HR/9" value={careerSplit.stat?.homeRunsPer9} /><CareerStat label="K/BB" value={getKBB(careerSplit.stat)} /><CareerStat label="WHIP" value={careerSplit.stat?.whip} /></>
                 ) : (
                    <><CareerStat label="IP" value={careerSplit.stat?.inningsPitched ?? careerSplit.stat?.innings} /><CareerStat label="W" value={careerSplit.stat?.wins} /><CareerStat label="SV" value={careerSplit.stat?.saves} /><CareerStat label="K" value={careerSplit.stat?.strikeOuts} /><CareerStat label="ERA" value={careerSplit.stat?.era} /><CareerStat label="WHIP" value={careerSplit.stat?.whip} /></>
                 )
              ) : (
                 <><CareerStat label="POS" value={careerSplit.position?.abbreviation} /><CareerStat label="INN" value={careerSplit.stat?.innings} /><CareerStat label="PO" value={careerSplit.stat?.putOuts} /><CareerStat label="A" value={careerSplit.stat?.assists} /><CareerStat label="E" value={careerSplit.stat?.errors} /><CareerStat label="FLD%" value={careerSplit.stat?.fielding} /></>
              )}
           </div>
        </div>
     ) : <div className="flex-grow flex items-center justify-center text-[10px] font-bold italic opacity-50">Stats unavailable.</div>}
  </div>
);

// --- 2. PROSPECT SCOUTING BOARD ---
export const ProspectScoutingBoard = ({ validRankings, isPitcherDef, statView, latestScoutingReport }: any) => (
  <div className="bg-amber-50/60 p-2 border-2 border-dashed border-amber-300 rounded-sm flex flex-col flex-grow overflow-hidden min-h-0">
    
    {/* Header - prevent shrinking */}
    <div className="flex items-center gap-1.5 mb-2 border-b border-amber-200 pb-1 shrink-0">
      <Trophy size={12} className="text-amber-600" />
      <h4 className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Scouting History</h4>
    </div>
    
    {/* Table - prevent shrinking */}
    {validRankings.length > 0 ? (
      <div className="overflow-x-auto overflow-y-hidden mb-2 shrink-0">
        <table className="w-full text-center text-[8px] sm:text-[9px] table-fixed">
          <thead>
            <tr className="border-b-2 border-amber-300 text-amber-800">
              <th className="text-left font-black pb-1 w-8">YR</th>
              <th className="font-black pb-1">OVR</th>
              {isPitcherDef && statView === 'pitching' ? (
                <><th className="font-bold pb-1 text-slate-400">FB</th><th className="font-bold pb-1 text-slate-400">SL</th><th className="font-bold pb-1 text-slate-400">CB</th><th className="font-bold pb-1 text-slate-400">CH</th><th className="font-bold pb-1 text-slate-400">CTRL</th></>
              ) : (
                <><th className="font-bold pb-1 text-slate-400">HIT</th><th className="font-bold pb-1 text-slate-400">PWR</th><th className="font-bold pb-1 text-slate-400">RUN</th><th className="font-bold pb-1 text-slate-400">ARM</th><th className="font-bold pb-1 text-slate-400">FLD</th></>
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
                    <><td className="py-1">{sc.fastball ?? '--'}</td><td className="py-1">{sc.slider ?? '--'}</td><td className="py-1">{sc.curveball ?? '--'}</td><td className="py-1">{sc.changeup ?? '--'}</td><td className="py-1">{sc.control ?? '--'}</td></>
                  ) : (
                    <><td className="py-1">{sc.hit ?? '--'}</td><td className="py-1">{sc.power ?? '--'}</td><td className="py-1">{sc.run ?? '--'}</td><td className="py-1">{sc.arm ?? '--'}</td><td className="py-1">{sc.field ?? '--'}</td></>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center text-[10px] text-amber-700/60 font-bold italic py-2 shrink-0">Scouting unavailable.</div>
    )}

    {/* 🌟 SCROLLING REPORT SECTION - Added min-h-0 and overflow-y-auto, removed line-clamp */}
    <div className="pt-3 border-t border-amber-200/50 relative flex flex-col flex-grow min-h-0 mt-auto">
      <div className="absolute -top-2 left-2 bg-[#fdfaf3] px-1 text-[8px] font-black text-amber-500 uppercase tracking-widest z-10">Report</div>
      
      {/* The actual scrolling area */}
      <div className="overflow-y-auto h-full pr-1 pb-1" style={{ scrollbarWidth: 'thin' }}>
        <p className="text-[7.5px] leading-relaxed text-slate-700 italic font-medium whitespace-pre-wrap">
          "{latestScoutingReport}"
        </p>
      </div>
    </div>
  </div>
);

// --- 3. ACTIVE VETERAN BOARD ---
export const ActiveStatsBoard = ({ statView, setStatView, isAdvanced, setIsAdvanced, availableViews, recentSplits, careerSplit, mlbTeamName }: any) => (
  <div className="bg-blue-50/60 p-2 border-2 border-blue-200 rounded-sm flex flex-col flex-grow overflow-hidden">
    
    {/* Header & Toggles */}
    <div className="flex items-center justify-between mb-1.5 border-b border-blue-200 pb-1">
      <div className="flex items-center gap-1.5">
        <Activity size={12} className="text-blue-600" />
        <h4 className="text-[9px] font-black text-blue-800 uppercase tracking-widest">MLB History</h4>
      </div>
      
      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        {statView !== 'fielding' && (
          <div className="flex gap-1">
            <button onClick={() => setIsAdvanced(false)} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${!isAdvanced ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>STD</button>
            <button onClick={() => setIsAdvanced(true)} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${isAdvanced ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>ADV</button>
          </div>
        )}
        {availableViews.length > 1 && (
          <div className="flex gap-1 border-l border-blue-300 pl-1.5">
            {availableViews.includes('hitting') && <button onClick={() => setStatView('hitting')} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${statView === 'hitting' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>HIT</button>}
            {availableViews.includes('pitching') && <button onClick={() => setStatView('pitching')} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${statView === 'pitching' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>PIT</button>}
            {availableViews.includes('fielding') && <button onClick={() => setStatView('fielding')} className={`text-[6.5px] px-1.5 py-0.5 rounded font-black transition-colors ${statView === 'fielding' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>FLD</button>}
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
                  <><th className="font-bold pb-1 text-slate-400">BF</th><th className="font-bold pb-1 text-slate-400">K/9</th><th className="font-bold pb-1 text-slate-400">BB/9</th><th className="font-bold pb-1 text-slate-400">HR/9</th><th className="font-bold pb-1 text-slate-400">K/BB</th><th className="font-bold pb-1 text-slate-400">BAA</th><th className="font-bold pb-1 text-slate-400">WHIP</th></>
                ) : (
                  <><th className="font-bold pb-1 text-slate-400">IP</th><th className="font-bold pb-1 text-slate-400">W</th><th className="font-bold pb-1 text-slate-400">SV</th><th className="font-bold pb-1 text-slate-400">K</th><th className="font-bold pb-1 text-slate-400">ERA</th><th className="font-bold pb-1 text-slate-400">WHIP</th><th className="font-bold pb-1 text-slate-400">K/BB</th></>
                )
              ) : statView === 'fielding' ? (
                <><th className="font-bold pb-1 text-slate-400">POS</th><th className="font-bold pb-1 text-slate-400">INN</th><th className="font-bold pb-1 text-slate-400">PO</th><th className="font-bold pb-1 text-slate-400">A</th><th className="font-bold pb-1 text-slate-400">E</th><th className="font-bold pb-1 text-slate-400">FLD%</th></>
              ) : (
                isAdvanced ? (
                  <><th className="font-bold pb-1 text-slate-400">PA</th><th className="font-bold pb-1 text-slate-400">K%</th><th className="font-bold pb-1 text-slate-400">BB%</th><th className="font-bold pb-1 text-slate-400">BABIP</th><th className="font-bold pb-1 text-slate-400">GO/AO</th><th className="font-bold pb-1 text-slate-400">AB/HR</th><th className="font-bold pb-1 text-slate-400">SB%</th></>
                ) : (
                  <><th className="font-bold pb-1 text-slate-400">G</th><th className="font-bold pb-1 text-slate-400">R</th><th className="font-bold pb-1 text-slate-400">HR</th><th className="font-bold pb-1 text-slate-400">RBI</th><th className="font-bold pb-1 text-slate-400">SB</th><th className="font-bold pb-1 text-slate-400">AVG</th><th className="font-bold pb-1 text-slate-400">OPS</th></>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-200/50 text-slate-700 font-medium tracking-tighter">
            {recentSplits.map((s: any, idx: number) => {
              const teamAbbrev = getTeamAbbrev(s.team?.name);
              return (
                <tr key={idx} className="hover:bg-blue-100/50 transition-colors">
                  <td className="text-left py-1 font-black text-blue-900">{s.season || '----'}</td>
                  <td className="text-left py-1 text-slate-500 font-bold truncate pr-1" title={s.team?.name || 'Total'}>{teamAbbrev}</td>
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

            {/* Career Totals Row */}
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
      <div className="text-center text-[10px] text-blue-700/60 font-bold italic py-2">Stats unavailable.</div>
    )}
    
    <div className="mt-auto py-1 px-2 bg-white border border-blue-100 rounded-sm text-[7px] font-black text-blue-800 text-center uppercase tracking-tighter italic shrink-0">MLB Franchise: {mlbTeamName}</div>
  </div>
);