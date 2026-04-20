// src/components/teams/RosterRow.tsx
import { AlertTriangle, Lock, Trophy, Calendar } from 'lucide-react';
import PlayerActionMenu from './PlayerActionMenu';

interface RosterRowProps {
  player: any;
  onLinkClick?: () => void;
  onNameClick?: () => void;
  isMyTeam?: boolean; 
}

// 💻 DESKTOP COMPONENT 
const DesktopStatItem = ({ label, value }: { label: string, value: any }) => (
  <div className="flex flex-col items-center min-w-[32px]">
    <span className="text-[9px] text-slate-400 font-bold uppercase mb-0.5 tracking-wider">{label}</span>
    <span className="font-black text-slate-800 text-xs">{value !== undefined && value !== null ? value : '-'}</span>
  </div>
);

// 📱 MOBILE COMPONENT (Centered, slightly larger for full-width)
const MobileStatItem = ({ label, value }: { label: string, value: any }) => (
  <div className="flex flex-col items-center shrink-0">
    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{label}</span>
    <span className="font-black text-slate-800 text-[11px] leading-none">{value !== undefined && value !== null ? value : '-'}</span>
  </div>
);

const StatDivider = () => <div className="w-px h-6 bg-slate-200 shrink-0"></div>;
const MobileStatDivider = () => <div className="w-px h-4 bg-slate-200 shrink-0"></div>;

export default function RosterRow({ player, onLinkClick, onNameClick, isMyTeam }: RosterRowProps) {
  const hasViolation = !!player.violation;

  const pos = player.positions?.[0]?.abbrev || player.mlbRawData?.primaryPosition?.abbreviation;
  const isPitcher = pos === 'P' || pos === 'SP' || pos === 'RP';
  const statGroup = isPitcher ? 'pitching' : 'hitting';
  
  const statBlock = player.mlbRawData?.stats?.find(
    (s: any) => s.type?.displayName === 'season' && s.group?.displayName === statGroup
  )?.splits?.[0]?.stat;

  // --- REUSABLE ACTION MENU ---
  const renderActionMenu = () => (
    <div className="flex justify-end items-center gap-3">
      {player.status !== 'ACTIVE' && (
        <span className={`text-[10px] font-black uppercase tracking-widest ${hasViolation ? 'text-red-800' : 'text-slate-500'}`}>
          {player.status}
        </span>
      )}
      {player.isTradeLocked ? (
        <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded text-[10px] font-bold border border-slate-200 uppercase flex items-center gap-1 shrink-0 mt-0.5">
          <Lock size={10} /> Locked
        </span>
      ) : (
        // FIX: Removed static z-10, added focus-within and hover z-[60] so the active row jumps to the front!
        <div className="shrink-0 relative z-0 focus-within:z-[60] hover:z-[60] mt-0.5">
          <PlayerActionMenu player={player} isMyTeam={!!isMyTeam} />
        </div>
      )}
    </div>
  );

  // --- 📱 MOBILE STATS RENDERER (Full-Width Flex Row) ---
  const renderMobileStats = () => {
    if (!statBlock) return null;
    const containerClasses = "flex items-center justify-between w-full max-w-sm mx-auto px-1";

    if (isPitcher) {
      const kbb = (statBlock.strikeOuts !== undefined && statBlock.baseOnBalls > 0) 
        ? (statBlock.strikeOuts / statBlock.baseOnBalls).toFixed(2) : '-';

      return (
        <div className={containerClasses}>
           <MobileStatItem label="W" value={statBlock.wins} /> <MobileStatDivider />
           <MobileStatItem label="SV" value={statBlock.saves} /> <MobileStatDivider />
           <MobileStatItem label="K" value={statBlock.strikeOuts} /> <MobileStatDivider />
           <MobileStatItem label="ERA" value={statBlock.era} /> <MobileStatDivider />
           <MobileStatItem label="WHIP" value={statBlock.whip} /> <MobileStatDivider />
           <MobileStatItem label="K/BB" value={kbb} />
        </div>
      );
    } else {
      return (
        <div className={containerClasses}>
           <MobileStatItem label="R" value={statBlock.runs} /> <MobileStatDivider />
           <MobileStatItem label="HR" value={statBlock.homeRuns} /> <MobileStatDivider />
           <MobileStatItem label="RBI" value={statBlock.rbi} /> <MobileStatDivider />
           <MobileStatItem label="SB" value={statBlock.stolenBases} /> <MobileStatDivider />
           <MobileStatItem label="AVG" value={statBlock.avg} /> <MobileStatDivider />
           <MobileStatItem label="OPS" value={statBlock.ops} />
        </div>
      );
    }
  };

  // --- 💻 DESKTOP STATS RENDERER ---
  const renderDesktopStats = () => {
    if (!statBlock) return null;

    if (isPitcher) {
      const kbb = (statBlock.strikeOuts !== undefined && statBlock.baseOnBalls > 0) 
        ? (statBlock.strikeOuts / statBlock.baseOnBalls).toFixed(2) : '-';

      return (
        <div className="flex items-center justify-center gap-3 lg:gap-4 text-xs font-medium text-slate-700 w-full max-w-md mx-auto">
           <DesktopStatItem label="W" value={statBlock.wins} /> <StatDivider />
           <DesktopStatItem label="SV" value={statBlock.saves} /> <StatDivider />
           <DesktopStatItem label="K" value={statBlock.strikeOuts} /> <StatDivider />
           <DesktopStatItem label="ERA" value={statBlock.era} /> <StatDivider />
           <DesktopStatItem label="WHIP" value={statBlock.whip} /> <StatDivider />
           <DesktopStatItem label="K/BB" value={kbb} />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center gap-3 lg:gap-4 text-xs font-medium text-slate-700 w-full max-w-md mx-auto">
           <DesktopStatItem label="R" value={statBlock.runs} /> <StatDivider />
           <DesktopStatItem label="HR" value={statBlock.homeRuns} /> <StatDivider />
           <DesktopStatItem label="RBI" value={statBlock.rbi} /> <StatDivider />
           <DesktopStatItem label="SB" value={statBlock.stolenBases} /> <StatDivider />
           <DesktopStatItem label="AVG" value={statBlock.avg} /> <StatDivider />
           <DesktopStatItem label="OPS" value={statBlock.ops} />
        </div>
      );
    }
  };

  return (
    <tr className={`block md:table-row transition-colors border-b ${
      hasViolation ? 'bg-red-50 hover:bg-red-100/80 border-red-200' : 'hover:bg-slate-50 border-slate-100'
    }`}>
      
      <td className="block md:table-cell px-4 md:px-6 py-3 w-full focus-within:relative focus-within:z-[50]">
        
        <div className="flex justify-between items-start w-full">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={onNameClick}
                className={`font-black text-sm sm:text-base transition-colors text-left truncate ${
                  hasViolation ? 'text-red-900 hover:text-red-600' : 'text-slate-900 hover:text-blue-600'
                }`}
              >
                {player.firstName} {player.lastName}
              </button>
              
              {player.isTop100 && player.prospectRank && (
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm shrink-0" title="Top 100 Prospect">
                  <Trophy size={10} className="text-emerald-500" />
                  #{player.prospectRank}
                </span>
              )}

              {hasViolation && (
                 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest bg-red-600 text-white shadow-sm shrink-0 uppercase" title={player.violation}>
                   <AlertTriangle size={10} strokeWidth={3} /> Ineligible
                 </span>
              )}
              
              {!player.mlbId && onLinkClick && (
                <button onClick={onLinkClick} className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 p-1 rounded transition-colors shrink-0" title="Missing MLB Profile Link">
                  <AlertTriangle size={16} />
                </button>
              )}
            </div>
            
            <div className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] uppercase font-bold mt-1 ${
              hasViolation ? 'text-red-700' : 'text-slate-500'
            }`}>
              <div className="flex items-center gap-2">
                <span>{player.positions?.map((p: any) => p.abbrev).join(' / ') || player.mlbRawData?.primaryPosition?.abbreviation || 'N/A'}</span>
                <span className="opacity-50">—</span>
                <span>{player.level || 'Unassigned'}</span>
                
                {player.prospectEta && (
                  <>
                    <span className="opacity-30 hidden sm:inline">•</span>
                    <span className={`inline-flex items-center gap-1 tracking-wider ${hasViolation ? 'text-red-600' : 'text-slate-400'}`} title="Estimated Arrival">
                      <Calendar size={10} className={hasViolation ? 'text-red-500' : 'text-slate-400'} />
                      ETA {player.prospectEta}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE ONLY CTA */}
          <div className="block md:hidden shrink-0">
            {renderActionMenu()}
          </div>
        </div>

        <div className="block md:hidden mt-3 pt-3 border-t border-slate-100 w-full">
          <div className="flex justify-center w-full">
            {renderMobileStats() || <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">No recent stats</span>}
          </div>
        </div>
      </td>

      <td className="hidden md:table-cell px-4 py-3 align-middle text-center min-w-[320px]">
        {renderDesktopStats() || <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No recent stats</span>}
      </td>

      <td className="hidden md:table-cell px-4 md:px-6 py-3 text-right w-24 sm:w-32 align-middle focus-within:relative focus-within:z-[50]">
        {renderActionMenu()}
      </td>
    </tr>
  );
}