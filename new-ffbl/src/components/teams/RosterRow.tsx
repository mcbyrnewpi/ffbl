// src/components/teams/RosterRow.tsx
import { AlertTriangle, Lock, Unlock } from 'lucide-react';
import PlayerActionMenu from './PlayerActionMenu';

interface RosterRowProps {
  player: any;
  onLinkClick?: () => void;
}

export default function RosterRow({ player, onLinkClick, isMyTeam }: RosterRowProps) {
  // Quick debug: If you open your browser console, you'll see exactly why the button is hiding
  if (player.lastName === 'Ohtani') {
    console.log(`Ohtani Check:`, { mlbId: player.mlbId, hasClickProp: !!onLinkClick });
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {/* COLUMN 1: Player Name & Warning Icon */}
      <td className="px-4 md:px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="font-bold text-slate-800">
            {player.firstName} {player.lastName}
          </div>
          
          {/* THE TRIGGER: Only shows if mlbId is missing AND the view passed the click handler */}
          {!player.mlbId && onLinkClick && (
            <button 
              onClick={onLinkClick}
              className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 p-1 rounded transition-colors"
              title="Missing MLB Profile Link"
            >
              <AlertTriangle size={16} />
            </button>
          )}
        </div>
        
        {/* Positions & Level Subtext */}
        <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">
          {player.positions?.map((p: any) => p.abbrev).join(' / ') || 'N/A'} — {player.level || 'Unassigned'}
        </div>
      </td>

      {/* COLUMN 2: Status / Trade Lock */}
      <td className="px-4 md:px-6 py-4 text-right">
        <div className="flex justify-end items-center gap-2">
          {/* Status Badge (Active, IL, etc) */}
          <span className="text-xs font-semibold text-slate-600">
            {player.status}
          </span>

          {/* Trade Lock Badge */}
          {player.isTradeLocked ? (
            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-[10px] font-bold border border-amber-100 uppercase flex items-center gap-1">
              <Lock size={10} /> Locked
            </span>
          ) : (
            <PlayerActionMenu player={player} isMyTeam={isMyTeam} />
          )}
        </div>
      </td>
    </tr>
  );
}