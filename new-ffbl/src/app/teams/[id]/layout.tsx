import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Shield, User } from 'lucide-react';
import TeamTabs from '@/components/teams/TeamTabs';

export default async function TeamLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { managers: true, players: true }
  });

  if (!team) notFound();

  // 🪣 Calculate Stats for the Header
  const stats = {
    mlb: team.players.filter(p => p.level === 'MLB' && p.status === 'ACTIVE').length,
    minors: team.players.filter(p => p.level !== 'MLB' && p.status === 'ACTIVE').length,
    il: team.players.filter(p => p.status !== 'ACTIVE' && p.status !== 'NA').length,
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
            <p className="text-slate-500 flex items-center gap-2 font-medium">
              <User size={16} /> Manager: {team.managers[0]?.name || 'Unmanaged'}
            </p>
          </div>
          <div className="flex gap-3">
            <StatBadge label="MLB Active" value={stats.mlb} />
            <StatBadge label="Minors" value={stats.minors} />
            <StatBadge label="IL" value={stats.il} color="text-red-600 bg-red-50 border-red-200" />
          </div>
        </header>

        <TeamTabs teamId={id} />
        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color = "text-slate-700 bg-slate-100 border-slate-200" }: any) {
  return (
    <div className={`px-4 py-2 rounded-lg border flex flex-col items-center min-w-[80px] ${color}`}>
      <span className="text-[10px] uppercase font-bold opacity-70 mb-0.5">{label}</span>
      <span className="text-lg font-black leading-none">{value}</span>
    </div>
  );
}