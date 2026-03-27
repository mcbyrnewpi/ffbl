// src/app/players/page.tsx
import { prisma } from '@/lib/prisma';
import { Search, Lock, Unlock } from 'lucide-react';

export default async function PlayersPage(props: {
  searchParams: Promise<{ name?: string }>;
}) {
  // 1. Await the params (Crucial for Next.js 15)
  const searchParams = await props.searchParams;
  const searchTerm = searchParams.name || '';

  // 2. Fetch logic: If searching, filter. If not, show top 50.
  const players = await prisma.player.findMany({
    where: searchTerm ? {
      OR: [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
      ],
    } : {}, 
    take: 50,
    include: {
      team: true,
      positions: true, // We know this works now!
    },
    orderBy: { lastName: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">League Roster</h1>
          <form className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              name="name"
              defaultValue={searchTerm}
              placeholder="Search players..."
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            />
          </form>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">
                      {player.firstName} {player.lastName}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium">
                      {player.positions?.map(p => p.abbrev).join(' / ') || 'N/A'} — {player.level}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {player.team?.name || 'Free Agent'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {player.isTradeLocked ? (
                      <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-[10px] font-bold border border-amber-100 uppercase flex items-center gap-1 justify-end">
                        <Lock size={10} /> Locked
                      </span>
                    ) : (
                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold border border-green-100 uppercase flex items-center gap-1 justify-end">
                        <Unlock size={10} /> Open
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {players.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No players found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}