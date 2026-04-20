// src/app/teams/[teamId]/layout.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Shield, User, Settings, Quote } from 'lucide-react';
import Link from 'next/link';
import TeamTabs from '@/components/teams/TeamTabs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SyncStatsButton from '@/components/teams/SyncStatsButton';

export default async function TeamLayout({ children, params }: { children: React.ReactNode, params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id; 
  const myTeamId = (session?.user as any)?.teamId;
  const userRole = (session?.user as any)?.role;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { 
      managers: {
        orderBy: { createdAt: 'asc' } 
      }, 
      players: true 
    }
  });

  if (!team) notFound();

  // Determine permissions
  const isMyTeam = myTeamId === teamId;
  const isAdmin = userRole === 'ADMIN';
  const canSyncStats = isMyTeam || isAdmin; 

  const myManagerRecord = team.managers.find(m => m.id === userId);
  const isPrimaryManager = myManagerRecord?.isPrimaryManager === true;
  const canEditTeam = isAdmin || (isMyTeam && isPrimaryManager);

  // Extract Front Office Personnel
  const primaryManager = team.managers.find(m => m.isPrimaryManager) || team.managers[0];
  const coManagers = team.managers.filter(m => m.id !== primaryManager?.id);

  const draftPickCount = await prisma.draftPick.count({
    where: { currentOwnerId: teamId },
  });
  
  const hofCount = await prisma.teamHallOfFame.count({
    where: { teamId: teamId },
  });

  const stats = {
    mlb: team.players.filter(p => p.level === 'MLB' && p.status === 'ACTIVE').length,
    minors: team.players.filter(p => p.level !== 'MLB' && p.status === 'ACTIVE').length,
    il: team.players.filter(p => p.status !== 'ACTIVE' && p.status !== 'NA').length,
    na: team.players.filter(p => p.status === 'NA').length,
    picks: draftPickCount,
    hof: hofCount,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-8 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
            {/* LOGO */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0 mt-1">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain p-1" />
              ) : (
                <Shield size={32} className="text-slate-300" />
              )}
            </div>

            {/* TEAM INFO & ACTION BUTTONS */}
            <div className="flex flex-col min-w-0">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                {team.name}
              </h1>

              {team.motto && (
                <span className="text-sm font-medium italic text-slate-500 flex items-center gap-1.5 mb-3 truncate">
                  <Quote size={12} className="text-slate-400 shrink-0" /> 
                  {team.motto}
                </span>
              )}

              {/* MANAGERS */}
              <div className="flex flex-col gap-1 mb-4">
                <p className="text-slate-600 flex items-center gap-2 text-sm">
                  <User size={14} className="text-slate-400 shrink-0" /> 
                  <span className="font-medium truncate">Manager: <span className="font-black text-slate-800">{primaryManager?.name || 'Unmanaged'}</span></span>
                </p>
                
                {coManagers.length > 0 && (
                  <p className="text-slate-500 text-xs sm:text-sm flex items-center gap-1.5 pl-[22px] truncate">
                    <span className="italic shrink-0">Co-Managers:</span> 
                    <span className="font-bold text-slate-700 truncate">{coManagers.map(m => m.name).join(', ')}</span>
                  </p>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {canSyncStats && (
                  <SyncStatsButton teamId={team.id} lastStatSync={team.lastStatSync} />
                )}
                
                {canEditTeam && (
                  <Link 
                    href={`/teams/${team.id}/edit`} 
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* STAT BADGES */}
          <div className="flex flex-wrap justify-start lg:justify-end gap-2 shrink-0">
            <StatBadge label="MLB" value={stats.mlb} color="text-blue-700 bg-blue-50 border-blue-200" />
            <StatBadge label="Minors" value={stats.minors} color="text-emerald-700 bg-emerald-50 border-emerald-200" />
            <StatBadge label="IL" value={stats.il} color="text-red-700 bg-red-50 border-red-200" />
            <StatBadge label="NA" value={stats.na} color="text-slate-600 bg-slate-100 border-slate-300" />
            <StatBadge label="Picks" value={stats.picks} color="text-purple-700 bg-purple-50 border-purple-200" />
            <StatBadge label="HOF" value={stats.hof} color="text-amber-700 bg-amber-50 border-amber-200" />
          </div>

        </header>

        <TeamTabs teamId={teamId} />
        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}

interface StatBadgeProps { label: string; value: number; color?: string; }
function StatBadge({ label, value, color = "text-slate-700 bg-slate-100 border-slate-200" }: StatBadgeProps) {
  return (
    <div className={`px-3 py-2 rounded-lg border flex flex-col items-center min-w-[64px] md:min-w-[72px] ${color}`}>
      <span className="text-[10px] uppercase font-bold opacity-80 mb-0.5">{label}</span>
      <span className="text-lg font-black leading-none">{value}</span>
    </div>
  );
}