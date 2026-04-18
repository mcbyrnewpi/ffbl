// src/app/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';

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

  // Set subtitle based on login status
  const subtitleText = session?.user 
    ? `Welcome back, ${session.user.name || session.user.email}` 
    : "Welcome to the Franklin Fantasy Baseball League.";

  return (
    <PageContainer>
      <PageHeader 
        title="Executive Dashboard"
        subtitle={subtitleText}
      >
        {/* ⚾ 3. Quick link to their own team (Renders on the right side of the header!) */}
        {myTeam && (
          <Link 
            href={`/teams/${myTeam.id}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all text-center flex-shrink-0"
          >
            Go to {myTeam.name}
          </Link>
        )}
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Players" value={playerCount} subtitle="Active in Database" />
        <StatCard title="Open Trades" value={pendingTrades} subtitle="Awaiting Decision" color="text-blue-600" />
        <StatCard title="League Status" value="Active" subtitle="Drafting in 12 days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h2 className="font-bold text-lg text-slate-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            <Link href="/players" className="p-4 bg-slate-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-slate-100 transition-all group flex flex-col justify-center">
              <p className="font-bold text-slate-800 group-hover:text-blue-600 text-sm mb-1">Find Players</p>
              <p className="text-xs text-slate-500 font-medium">Search the full league roster</p>
            </Link>
            <Link href="/trades" className="p-4 bg-slate-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-slate-100 transition-all group flex flex-col justify-center">
              <p className="font-bold text-slate-800 group-hover:text-blue-600 text-sm mb-1">Pending Deals</p>
              <p className="text-xs text-slate-500 font-medium">Approve or Decline trades</p>
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function StatCard({ title, value, subtitle, color = "text-slate-900" }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <p className={`text-4xl font-bold my-2 tracking-tight ${color}`}>{value}</p>
      <p className="text-sm font-medium text-slate-500">{subtitle}</p>
    </div>
  );
}