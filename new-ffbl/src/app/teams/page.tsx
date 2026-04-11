// src/app/teams/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Shield, User, Users, ChevronRight } from 'lucide-react';

export default async function TeamsDirectoryPage() {
  const teams = await prisma.team.findMany({
    include: {
      managers: true,
      players: {
        select: { level: true, status: true }
      }
    },
    orderBy: {
      name: 'asc' 
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">League Franchises</h1>
          <p className="text-slate-500 mt-1">Directory of all teams and managers in the dynasty league.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {teams.map((team: any) => {
            const mlb = team.players.filter((p: any) => p.level === 'MLB' && p.status === 'ACTIVE').length;
            const aaa = team.players.filter((p: any) => p.level === 'AAA' && p.status === 'ACTIVE').length;
            const aa = team.players.filter((p: any) => p.level === 'AA' && p.status === 'ACTIVE').length;
            const a = team.players.filter((p: any) => p.level === 'A' && p.status === 'ACTIVE').length;
            const il = team.players.filter((p: any) => p.status === 'IL' || p.status === 'IL_60').length;
            const na = team.players.filter((p: any) => p.status === 'NA').length;
            const totalPlayers = team.players.length;

            const teamLogo = team.logoUrl;

            return (
              <Link 
                href={`/teams/${team.id}`} 
                key={team.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group block flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    
                    {/* 🌟 FIX: Added referrerPolicy to prevent external hosts from blocking your image */}
                    {teamLogo ? (
                      <div className="w-16 h-16 relative flex-shrink-0 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden group-hover:border-blue-200 shadow-sm transition-colors p-1.5 flex items-center justify-center">
                         <img 
                           src={teamLogo} 
                           alt={`${team.name} logo`} 
                           className="w-full h-full object-contain drop-shadow-sm" 
                           referrerPolicy="no-referrer"
                         />
                      </div>
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 shadow-sm border border-slate-200 group-hover:border-blue-600">
                        <Shield size={32} />
                      </div>
                    )}

                    <div>
                      <h2 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {team.name}
                      </h2>
                      
                      <div className="flex flex-col mt-1">
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                          <User size={14} className="text-slate-400" /> 
                          {team.managers && team.managers.length > 0 
                            ? team.managers[0].name 
                            : 'Orphan Team'}
                        </p>
                        
                        {team.managers && team.managers.length > 1 && (
                          <p className="text-xs text-slate-400 pl-5 mt-0.5 font-medium">
                            Co-manager{team.managers.length > 2 ? 's' : ''}:{' '}
                            {team.managers.slice(1).map((m: any) => m.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto pb-4">
                  <div className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                    MLB <span className="text-slate-900">{mlb}</span>
                  </div>
                  <div className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                    AAA <span className="text-orange-900">{aaa}</span>
                  </div>
                  <div className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                    AA <span className="text-orange-900">{aa}</span>
                  </div>
                  <div className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                    A <span className="text-orange-900">{a}</span>
                  </div>
                  
                  {il > 0 && (
                    <div className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                      IL <span className="text-red-900">{il}</span>
                    </div>
                  )}
                  {na > 0 && (
                    <div className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                      NA <span className="text-slate-800">{na}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 font-bold uppercase tracking-wide">
                    <Users size={16} className="text-slate-400" />
                    {totalPlayers} Total Players
                  </div>
                  <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sm font-bold bg-blue-50 px-2 py-1 rounded">
                    View Roster <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {teams.length === 0 && (
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
            <p className="text-slate-400 font-medium text-lg">No teams found in the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}