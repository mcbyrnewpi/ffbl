// src/app/teams/[id]/minors/page.tsx
import { prisma } from '@/lib/prisma';
import FarmSystem from '@/components/teams/FarmSystem';

export default async function MinorsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const team = await prisma.team.findUnique({
    where: { id },
    // 🛡️ Make sure we include the affiliate names and logos!
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

  return <FarmSystem team={team} />; // Pass the whole team object now
}