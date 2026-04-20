// src/app/teams/[teamId]/page.tsx
import { prisma } from '@/lib/prisma';
import GlobalRosterContainer from '@/components/teams/GlobalRosterContainer';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  
  // 1. Get the current user's session
  const session = await getServerSession(authOptions);
  const myTeamId = (session?.user as any)?.teamId || null;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      players: { 
        include: { 
          positions: true, 
          prospectRankings: true, 
          team: true
        }, 
        orderBy: [{ level: 'desc' }, { lastName: 'asc' }] 
      }
    }
  });

  if (!team) return null;

  const mlbActive = team.players.filter(p => p.level === 'MLB' && p.status === 'ACTIVE');
  const naList = team.players.filter(p => p.status === 'NA');
  const injuredList = team.players.filter(p => p.status !== 'ACTIVE' && p.status !== 'NA');

  return (
    <div className="animate-in fade-in duration-500">
      <GlobalRosterContainer 
        mlbActive={mlbActive} 
        naList={naList} 
        injuredList={injuredList} 
        isMyTeam={myTeamId === teamId}
        teamId={team.id}            
        lastStatSync={team.lastStatSync}
      />
    </div>
  );
}