// src/components/teams/RosterTable.tsx
import RosterRow from "./RosterRow";

interface RosterTableProps {
  title: string;
  players: any[];
  headerColor: string;
  onLinkClick?: (player: any) => void;
}

export default function RosterTable({ title, players, headerColor, onLinkClick }: RosterTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Header */}
      <div className={`${headerColor} px-4 md:px-6 py-3 border-b border-slate-800 flex justify-between items-center`}>
        <h2 className="text-white font-bold tracking-wide text-sm md:text-base">{title}</h2>
        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-md font-bold">
          {players.length}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-4 md:px-6 py-3 md:py-4">Player</th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-right">Status/Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.map((player) => (
              <RosterRow 
                key={player.id} 
                player={player} 
                onLinkClick={onLinkClick ? () => onLinkClick(player) : undefined}
              />
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">
                  No players found in this section.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}