// src/components/teams/PlayerCard.tsx
import { AlertTriangle, Trophy } from 'lucide-react';
import PlayerActionMenu from './PlayerActionMenu';
import PlayerHeadshot from './PlayerHeadshot';

interface PlayerCardProps {
  player: any;
  onLinkClick?: () => void;
  onNameClick?: () => void; 
  isMyTeam?: boolean;
}

const MiniStat = ({ label, value }: { label: string, value: any }) => (
  <div className="flex flex-col">
    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">{label}</span>
    <span className="text-[11px] font-black text-slate-800 leading-tight">{value !== undefined && value !== null ? value : '-'}</span>
  </div>
);

export default function PlayerCard({ player, onLinkClick, onNameClick, isMyTeam }: PlayerCardProps) {
  
  const age = player.mlbRawData?.currentAge || 
    (player.birthdate ? Math.floor((new Date().getTime() - new Date(player.birthdate).getTime()) / 31557600000) : '??');

  const isMinorLeaguer = player.level !== 'MLB' && player.status !== 'RETIRED';

  const getQuickStats = () => {
    if (!player.mlbRawData?.stats) return null;
    
    const pos = player.positions?.[0]?.abbrev || player.mlbRawData?.primaryPosition?.abbreviation;
    const isPitcher = pos === 'P' || pos === 'SP' || pos === 'RP';

    const statGroup = isPitcher ? 'pitching' : 'hitting';
    
    const statBlock = player.mlbRawData.stats.find(
      (s: any) => s.type?.displayName === 'season' && s.group?.displayName === statGroup
    )?.splits?.[0]?.stat;

    if (!statBlock) return null;

    if (isPitcher) {
      const kbb = (statBlock.strikeOuts !== undefined && statBlock.baseOnBalls > 0) 
        ? (statBlock.strikeOuts / statBlock.baseOnBalls).toFixed(2) : '-';
        
      return (
        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 mt-0.5">
          <MiniStat label="W" value={statBlock.wins} />
          <MiniStat label="SV" value={statBlock.saves} />
          <MiniStat label="K" value={statBlock.strikeOuts} />
          <MiniStat label="ERA" value={statBlock.era} />
          <MiniStat label="WHIP" value={statBlock.whip} />
          <MiniStat label="K/BB" value={kbb} />
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 mt-0.5">
          <MiniStat label="R" value={statBlock.runs} />
          <MiniStat label="HR" value={statBlock.homeRuns} />
          <MiniStat label="RBI" value={statBlock.rbi} />
          <MiniStat label="SB" value={statBlock.stolenBases} />
          <MiniStat label="AVG" value={statBlock.avg} />
          <MiniStat label="OPS" value={statBlock.ops} />
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 group relative flex flex-col hover:shadow-md transition-all hover:z-50 focus-within:z-50">
      
      <div className="absolute top-2 inset-x-2 flex justify-between items-start z-30 pointer-events-none">
        {player.status !== 'ACTIVE' ? (
          <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
            {player.status}
          </span>
        ) : <div />}

        {!player.mlbId && onLinkClick && (
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLinkClick(); }}
            className="pointer-events-auto text-amber-500 hover:text-amber-600 hover:bg-amber-50 p-1.5 rounded-full transition-colors shadow-md border border-amber-200 bg-white"
            title="Link MLB Profile"
          >
            <AlertTriangle size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <button 
        onClick={onNameClick}
        className="relative h-36 overflow-hidden bg-slate-100 flex flex-col items-center flex-shrink-0 w-full group/img focus:outline-none rounded-t-xl border-b border-slate-200"
      >
        <PlayerHeadshot player={player} />

        {player.isTop100 && player.prospectRank && (
          <div className="absolute bottom-1.5 z-10 animate-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-md border border-emerald-300 flex items-center gap-1">
              <Trophy size={10} className="text-emerald-100" />
              #{player.prospectRank}
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-blue-600/0 group-hover/img:bg-blue-600/5 transition-colors flex items-center justify-center">
             <span className="opacity-0 group-hover/img:opacity-100 bg-white/90 text-blue-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-opacity tracking-widest">VIEW CARD</span>
        </div>
      </button>

      <div className="p-3 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <button 
            onClick={onNameClick}
            className="text-left min-w-0 flex-grow group/name focus:outline-none"
          >
            <span className="text-[10px] font-bold text-slate-500 block leading-tight uppercase tracking-wide">{player.firstName}</span>
            <h3 className="font-black text-slate-900 leading-tight truncate group-hover/name:text-blue-600 transition-colors">
              {player.lastName}
            </h3>
          </button>
          
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 uppercase tracking-widest border border-blue-100">
            {player.positions?.[0]?.abbrev || '??'}
          </span>
        </div>
        
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-50">
           <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
             <span>Age: {age}</span>
             {isMinorLeaguer && player.prospectEta && (
               <>
                 <span className="w-0.5 h-0.5 bg-slate-300 rounded-full shrink-0"></span>
                 <span className="text-blue-500">ETA: {player.prospectEta}</span>
               </>
             )}
           </div>

           {/* NEW STAT GRID */}
           {getQuickStats() ? getQuickStats() : (
             <div className="text-[10px] text-slate-300 italic truncate uppercase font-bold tracking-widest mt-1">
               No recent stats
             </div>
           )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 relative mt-auto">
           <PlayerActionMenu player={player} isMyTeam={!!isMyTeam} />
        </div>
      </div>
    </div>
  );
}