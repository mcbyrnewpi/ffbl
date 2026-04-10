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
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* 🌟 FIX 1: Responsive header that stacks on mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
          {session?.user && (
            <p className="text-slate-500 mt-1 font-medium">
              Welcome back, <span className="font-bold text-slate-700">{session.user.name || session.user.email}</span>
            </p>
          )}
        </div>
        
        {/* ⚾ 3. Quick link to their own team */}
        {myTeam && (
          <Link 
            href={`/teams/${myTeam.id}`}
            className="w-full sm:w-auto px-6 py-4 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl sm:rounded-lg shadow-sm shadow-blue-500/25 transition-all text-center flex-shrink-0"
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="font-black text-lg text-slate-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            <Link href="/players" className="p-4 bg-slate-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-slate-100 transition-all group flex flex-col justify-center">
              <p className="font-black text-slate-800 group-hover:text-blue-600 text-sm mb-1">Find Players</p>
              <p className="text-xs text-slate-500 font-medium">Search the full league roster</p>
            </Link>
            <Link href="/trades" className="p-4 bg-slate-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-slate-100 transition-all group flex flex-col justify-center">
              <p className="font-black text-slate-800 group-hover:text-blue-600 text-sm mb-1">Pending Deals</p>
              <p className="text-xs text-slate-500 font-medium">Approve or Decline trades</p>
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
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <p className={`text-4xl font-black my-2 tracking-tight ${color}`}>{value}</p>
      <p className="text-sm font-medium text-slate-500">{subtitle}</p>
    </div>
  );
}