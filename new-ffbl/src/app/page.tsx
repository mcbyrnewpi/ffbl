// src/app/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import StandingsWidget from '@/components/dashboard/StandingsWidget';
import AnnouncementsWidget from '@/components/dashboard/AnnouncementsWidget';
import DraftStatusWidget from '@/components/dashboard/DraftStatusWidget';
import RecentTransactionsWidget from '@/components/dashboard/RecentTransactionsWidget';
import RecentTradeWidget from '@/components/dashboard/RecentTradeWidget';

export const revalidate = 0;

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  let myTeam = null;
  if (session?.user && (session.user as any).teamId) {
    myTeam = await prisma.team.findUnique({
      where: { id: (session.user as any).teamId }
    });
  }

  const subtitleText = session?.user 
    ? `Welcome back, ${session.user.name || session.user.email}` 
    : "Welcome to the Franklin Fantasy Baseball League.";

  return (
    <PageContainer>
      <PageHeader title="FFBL Dashboard" subtitle={subtitleText}>
        {myTeam && (
          <Link 
            href={`/teams/${myTeam.id}`}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all text-center flex-shrink-0"
          >
            Go to {myTeam.name}
          </Link>
        )}
      </PageHeader>
      
      {/* 🌟 1. DRAFT WIDGET: Front, Center, and Full-Width */}
      <DraftStatusWidget /> 
      
      {/* 🌟 2. THE 2-COLUMN DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <StandingsWidget />
          <RecentTransactionsWidget />
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <AnnouncementsWidget />
          <RecentTradeWidget />
        </div>

      </div>
    </PageContainer>
  );
}