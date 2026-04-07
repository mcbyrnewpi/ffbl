// src/app/teams/[id]/minors/page.tsx
import { prisma } from '@/lib/prisma';
import FarmSystem from '@/components/teams/FarmSystem';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkMinorLeagueEligibility } from '@/lib/roster-rules'; // 🌟 NEW IMPORT

export default async function MinorsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  // 1. Get session to determine if it's the user's team
  const session = await getServerSession(authOptions);
  const myTeamId = (session?.user as any)?.teamId || null;

  const team = await prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      aaaAffiliateName: true,
      aaaLogoUrl: true,
      aaAffiliateName: true,
      aaLogoUrl: true,
      aAffiliateName: true,
      aLogoUrl: true,
      players: {
        where: { 
          level: { in: ['AAA', 'AA', 'A'] },
          status: 'ACTIVE' 
        },
        include: { 
          positions: true,
          prospectRankings: true,
          team: true
        },
        orderBy: { lastName: 'asc' }
      }
    }
  });

  if (!team) return null;

  // Run the bouncer on every player and attach any violations
  const playersWithViolations = team.players.map(player => {
    // We know they are in the minors based on the Prisma query above
    const check = checkMinorLeagueEligibility(player, player.level || 'A');
    return {
      ...player,
      violation: check.isEligible ? null : check.reason // null if good, string if illegal
    };
  });

  const updatedTeam = { 
    ...team, 
    players: playersWithViolations 
  };

  return <FarmSystem team={updatedTeam} isMyTeam={myTeamId === id} />; 
}