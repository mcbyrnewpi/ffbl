// src/components/teams/RosterRow.tsx
export default function RosterRow({ player }: { player: any }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-800">
            {player.firstName} {player.lastName}
          </span>
          {player.isTradeLocked && (
            <span title="Trade Locked" className="text-sm select-none">🔒</span>
          )}
        </div>
        <div className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">
          {player.positions?.map((p: any) => p.abbrev).join(' / ') || 'N/A'}
        </div>
      </td>
      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
           <span className={`px-2 py-1 rounded text-[10px] font-black border ${
             player.status === 'ACTIVE' 
               ? 'bg-blue-50 text-blue-700 border-blue-100' 
               : player.status === 'NA' 
                 ? 'bg-slate-500 text-white border-slate-600' 
                 : 'bg-red-50 text-red-700 border-red-100'
           }`}>
             {player.status === 'ACTIVE' ? player.level : player.status.replace('_', ' ')}
           </span>
        </div>
      </td>
    </tr>
  );
}