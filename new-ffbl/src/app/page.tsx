//app/page.tsx

import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function HomePage() {
  // Grab some quick stats for the dashboard
  const playerCount = await prisma.player.count();
  const pendingTrades = await prisma.trade.count({ where: { status: 'PENDING' } });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Executive Dashboard</h1>
      
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