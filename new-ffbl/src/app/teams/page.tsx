// src/app/teams/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Shield, User, Users, ChevronRight } from 'lucide-react';

export default async function TeamsDirectoryPage() {
  // Fetch all teams, including their manager and a count of their players
  const teams = await prisma.team.findMany({
    include: {
      managers: true,
      _count: {
        select: { players: true }
      }
    },
    orderBy: {
      name: 'asc' // Alphabetical order
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">League Franchises</h1>
          <p className="text-slate-500 mt-1">Directory of all teams and managers in the dynasty league.</p>
        </header>

        {/* Responsive Grid for Team Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link 
              href={`/teams/${team.id}`} 
              key={team.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group block"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
				  <div className="bg-slate-100 text-slate-600 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
				    <Shield size={24} />
				  </div>
				  <div>
				    <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
				      {team.name}
				    </h2>
				    
				    <div className="flex flex-col mt-0.5">
				      {/* Primary Manager */}
				      <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
				        <User size={14} /> 
				        {team.managers && team.managers.length > 0 
				          ? team.managers[0].name 
				          : 'Orphan Team'}
				      </p>
				      
				      {/* Co-Managers (Only renders if there is more than 1 manager) */}
				      {team.managers && team.managers.length > 1 && (
				        <p className="text-xs text-slate-400 pl-5 mt-0.5">
				          Co-manager{team.managers.length > 2 ? 's' : ''}:{' '}
				          {team.managers.slice(1).map(m => m.name).join(', ')}
				        </p>
				      )}
				    </div>
				  </div>
				</div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                  <Users size={16} />
                  {team._count.players} Players
                </div>
                <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sm font-bold">
                  View Roster <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
            <p className="text-slate-400 font-medium">No teams found in the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}