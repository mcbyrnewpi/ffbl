// src/components/teams/RosterTable.tsx
import RosterRow from "./RosterRow";

interface RosterTableProps {
  players: any[];
  onLinkClick?: (player: any) => void;
  onNameClick?: (player: any) => void;
  isMyTeam?: boolean; 
}

export default function RosterTable({ 
  players, 
  onLinkClick, 
  onNameClick,
  isMyTeam = false 
}: RosterTableProps) {
  return (
    <div className="overflow-x-auto pb-48 -mb-48 rounded-b-xl">
      <table className="w-full text-left border-collapse">
        <tbody className="divide-y divide-slate-100 bg-white">
          {players.map((player) => (
            <RosterRow 
              key={player.id} 
              player={player} 
              onLinkClick={onLinkClick ? () => onLinkClick(player) : undefined}
              onNameClick={() => onNameClick?.(player)}
              isMyTeam={isMyTeam}
            />
          ))}
          {players.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">
                No players found in this section.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}