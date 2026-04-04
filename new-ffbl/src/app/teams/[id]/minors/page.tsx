// src/app/teams/[id]/minors/page.tsx
import { prisma } from '@/lib/prisma';
import FarmSystem from '@/components/teams/FarmSystem';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function MinorsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  // 1. ⬅️ NEW: Get session to determine if it's the user's team
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
        include: { positions: true },
        orderBy: { lastName: 'asc' }
      }
    }
  });

  if (!team) return null;

  return <FarmSystem team={team} isMyTeam={myTeamId === id} />; 
}