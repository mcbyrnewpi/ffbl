// src/app/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function HomePage() {
  // 🔐 1. Get the current user session
  const session = await getServerSession(authOptions);
  
  // 📊 Grab some quick stats for the dashboard
  const playerCount = await prisma.player.count();
  const pendingTrades = await prisma.trade.count({ where: { status: 'PENDING' } });

  // ⚾ 2. If they have a teamId, fetch their team info
  let myTeam = null;
  if (session?.user && (session.user as any).teamId) {
    myTeam = await prisma.team.findUnique({
      where: { id: (session.user as any).teamId }
    });
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">Executive Dashboard</h1>
          {session?.user && (
            <p className="text-slate-500 mt-1">
              Welcome back, <span className="font-semibold text-slate-700">{session.user.name || session.user.email}</span>
            </p>
          )}
        </div>
        
        {/* ⚾ 3. Quick link to their own team */}
        {myTeam && (
          <Link 
            href={`/teams/${myTeam.id}`}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            Go to {myTeam.name}
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Players" value={playerCount} subtitle="Active in Database" />
        <StatCard title="Open Trades" value={pendingTrades} subtitle="Awaiting Decision" color="text-blue-600" />
        <StatCard title="League Status" value="Active" subtitle="Drafting in 12 days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/players" className="p-4 bg-slate-50 rounded-lg hover:bg-blue-50 border border-slate-100 transition-all group">
              <p className="font-bold group-hover:text-blue-600 text-sm">Find Players</p>
              <p className="text-xs text-slate-500">Search the full league roster</p>
            </Link>
            <Link href="/trades" className="p-4 bg-slate-50 rounded-lg hover:bg-blue-50 border border-slate-100 transition-all group">
              <p className="font-bold group-hover:text-blue-600 text-sm">Pending Deals</p>
              <p className="text-xs text-slate-500">Approve or Decline trades</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, color = "text-slate-900" }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`text-4xl font-black my-1 ${color}`}>{value}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}