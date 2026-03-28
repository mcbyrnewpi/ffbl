import { prisma } from '@/lib/prisma';
import GlobalRosterContainer from '@/components/teams/GlobalRosterContainer';

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: { 
        include: { positions: true }, 
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
      />
    </div>
  );
}