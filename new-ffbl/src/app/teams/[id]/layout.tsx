// src/app/teams/[id]/layout.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Shield, User } from 'lucide-react';
import TeamTabs from '@/components/teams/TeamTabs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SyncStatsButton from '@/components/teams/SyncStatsButton';

export default async function TeamLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Get session to verify ownership OR admin status
  const session = await getServerSession(authOptions);
  const myTeamId = (session?.user as any)?.teamId;
  const userRole = (session?.user as any)?.role;
  
  const isMyTeam = myTeamId === id;
  const isAdmin = userRole === 'ADMIN';
  const canSyncStats = isMyTeam || isAdmin; // Both owners and commishes get the button!

  const team = await prisma.team.findUnique({
    where: { id },
    include: { managers: true, players: true }
  });

  if (!team) notFound();

  // ⚡ Fetch fast counts for the related tables
  const draftPickCount = await prisma.draftPick.count({
    where: { currentOwnerId: id },
  });
  
  const hofCount = await prisma.teamHallOfFame.count({
    where: { teamId: id },
  });

  // 🪣 Calculate Stats for the Header
  const stats = {
    mlb: team.players.filter(p => p.level === 'MLB' && p.status === 'ACTIVE').length,
    minors: team.players.filter(p => p.level !== 'MLB' && p.status === 'ACTIVE').length,
    il: team.players.filter(p => p.status !== 'ACTIVE' && p.status !== 'NA').length,
    na: team.players.filter(p => p.status === 'NA').length,
    picks: draftPickCount,
    hof: hofCount,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white"><Shield size={24} /></div>
              <h1 className="text-3xl font-black text-slate-900">{team.name}</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-slate-500 flex items-center gap-2 font-medium">
                <User size={16} /> Manager: {team.managers[0]?.name || 'Unmanaged'}
              </p>
              
              {/* Uses the canSyncStats boolean */}
              {canSyncStats && (
                <SyncStatsButton teamId={team.id} lastStatSync={team.lastStatSync} />
              )}
            </div>
          </div>
          
          {/* 📊 The Front Office Badges */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            <StatBadge label="MLB" value={stats.mlb} color="text-blue-700 bg-blue-50 border-blue-200" />
            <StatBadge label="Minors" value={stats.minors} color="text-emerald-700 bg-emerald-50 border-emerald-200" />
            <StatBadge label="IL" value={stats.il} color="text-red-700 bg-red-50 border-red-200" />
            <StatBadge label="NA" value={stats.na} color="text-slate-600 bg-slate-100 border-slate-300" />
            <StatBadge label="Picks" value={stats.picks} color="text-purple-700 bg-purple-50 border-purple-200" />
            <StatBadge label="HOF" value={stats.hof} color="text-amber-700 bg-amber-50 border-amber-200" />
          </div>
        </header>

        <TeamTabs teamId={id} />
        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}

interface StatBadgeProps {
  label: string;
  value: number;
  color?: string;
}

function StatBadge({ label, value, color = "text-slate-700 bg-slate-100 border-slate-200" }: StatBadgeProps) {
  return (
    <div className={`px-3 py-2 rounded-lg border flex flex-col items-center min-w-[64px] md:min-w-[72px] ${color}`}>
      <span className="text-[10px] uppercase font-bold opacity-80 mb-0.5">{label}</span>
      <span className="text-lg font-black leading-none">{value}</span>
    </div>
  );
}