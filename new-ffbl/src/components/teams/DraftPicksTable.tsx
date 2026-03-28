// src/components/teams/DraftPicksTable.tsx
export default function DraftPicksTable({ picks, currentTeamId }: { picks: any[], currentTeamId: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-emerald-900 px-4 md:px-6 py-3 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-white font-bold tracking-wide text-sm md:text-base">Draft Picks</h2>
        <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-md font-bold">
          {picks?.length || 0}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-4 md:px-6 py-3 md:py-4">Pick</th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-right">Franchise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {picks?.map((pick) => {
              const isOwnPick = String(pick.originalOwnerId) === String(currentTeamId);
              
              return (
                <tr key={pick.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="font-bold text-slate-800">
                        Round {pick.round} - {pick.year}
                      </div>
                      {pick.isTradeLocked && (
                        <span title="Trade Locked" className="text-sm select-none">🔒</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-[10px] font-black border ${
                      isOwnPick 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-purple-50 text-purple-700 border-purple-100'
                    }`}>
                      {isOwnPick ? 'OWN' : `${pick.originalOwner?.name || 'Unknown'}`}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!picks || picks.length === 0) && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">
                  No draft picks found for this team.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}