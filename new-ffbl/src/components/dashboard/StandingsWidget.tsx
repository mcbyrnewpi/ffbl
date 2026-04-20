// src/components/dashboard/StandingsWidget.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function StandingsWidget() {
  const settings = await prisma.leagueSettings.findUnique({ where: { id: 1 } });
  const currentSeason = settings?.currentSeason || new Date().getFullYear();

  const standingsData = await prisma.seasonStanding.findMany({
    where: { year: currentSeason },
    orderBy: { rank: 'asc' }, 
  });

  const groupedStandings = standingsData.reduce((acc: any, team) => {
    const div = team.division || 'Unassigned';
    if (!acc[div]) acc[div] = [];
    acc[div].push(team);
    return acc;
  }, {});

  const sortedDivisions = Object.keys(groupedStandings).sort();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-black text-slate-900 uppercase tracking-tight">{currentSeason} Standings</h2>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded">Live</span>
      </div>
      
      <div className="p-0">
        {sortedDivisions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm font-bold italic">
            No standings recorded for {currentSeason}.
          </div>
        ) : (
          sortedDivisions.map((division, idx) => {
            const teams = groupedStandings[division];
            return (
              <div key={division} className={idx !== 0 ? 'border-t border-slate-200' : ''}>
                <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{division}</h3>
                </div>
                
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white">
                      <th className="px-4 py-2 font-black text-slate-400 text-[10px] uppercase tracking-widest">Franchise</th>
                      <th className="px-2 py-2 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">W</th>
                      <th className="px-2 py-2 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">L</th>
                      <th className="px-2 py-2 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">T</th>
                      <th className="px-4 py-2 font-black text-slate-400 text-[10px] uppercase tracking-widest text-right">PCT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teams.map((team: any) => (
                      <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 max-w-[140px] truncate">
                          <Link href={`/teams/${team.teamId}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                            {team.teamName}
                          </Link>
                        </td>
                        <td className="px-2 py-2.5 text-center font-medium text-slate-600">{team.wins}</td>
                        <td className="px-2 py-2.5 text-center font-medium text-slate-600">{team.losses}</td>
                        <td className="px-2 py-2.5 text-center font-medium text-slate-600">{team.ties}</td>
                        <td className="px-4 py-2.5 text-right font-black text-slate-800">
                          {team.pct?.toFixed(3).replace(/^0+/, '') || '.000'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}