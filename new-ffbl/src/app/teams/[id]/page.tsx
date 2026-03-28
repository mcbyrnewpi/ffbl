import { prisma } from '@/lib/prisma';
import RosterTable from '@/components/teams/RosterTable'; 
import DraftPicksTable from '@/components/teams/DraftPicksTable';

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: { include: { positions: true }, orderBy: [{ level: 'desc' }, { lastName: 'asc' }] },
      currentPicks: { include: { originalOwner: true }, orderBy: [{ year: 'asc' }, { round: 'asc' }] }
    }
  });

  if (!team) return null;

  const mlbActive = team.players.filter(p => p.level === 'MLB' && p.status === 'ACTIVE');
  const minorLeaguers = team.players.filter(p => p.level !== 'MLB' && p.status === 'ACTIVE');
  const naList = team.players.filter(p => p.status === 'NA');
  const injuredList = team.players.filter(p => p.status !== 'ACTIVE' && p.status !== 'NA');

  return (
    <div className="space-y-8">
      <RosterTable title="MLB Active Roster" players={mlbActive} headerColor="bg-slate-900" />
      <RosterTable title="Minor Leagues (MiLB)" players={minorLeaguers} headerColor="bg-blue-900" />
      {naList.length > 0 && <RosterTable title="Not Active (NA)" players={naList} headerColor="bg-slate-500" />}
      {injuredList.length > 0 && <RosterTable title="Injured List (IL)" players={injuredList} headerColor="bg-red-900" />}
      <DraftPicksTable picks={team.currentPicks} currentTeamId={team.id} />
    </div>
  );
}