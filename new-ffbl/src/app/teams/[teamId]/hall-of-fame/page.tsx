// src/app/teams/[teamId]/hall-of-fame/page.tsx
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ClientHofWrapper from './ClientHofWrapper';
import HofPlaque from '@/components/teams/HofPlaque'; // <-- Good, we have the import

// --- STAT EXTRACTOR HELPER ---
function getCareerStats(player: any) {
  const mlbData = player.mlbRawData;
  if (!mlbData || !mlbData.stats) return null;

  const isPitcher = player.positions?.[0]?.abbrev === 'P' || player.positions?.[0]?.abbrev === 'SP' || player.positions?.[0]?.abbrev === 'RP';

  if (isPitcher) {
    const pitchingStats = mlbData.stats.find((s: any) => s.type?.displayName === 'career' && s.group?.displayName === 'pitching')?.splits?.[0]?.stat;
    if (!pitchingStats) return null;
    return {
      type: 'pitching',
      s1Label: 'ERA', s1: pitchingStats.era || '-',
      s2Label: 'WHIP', s2: pitchingStats.whip || '-',
      s3Label: 'W', s3: pitchingStats.wins || '-',
      s4Label: 'K', s4: pitchingStats.strikeOuts || '-',
    };
  } else {
    const hittingStats = mlbData.stats.find((s: any) => s.type?.displayName === 'career' && s.group?.displayName === 'hitting')?.splits?.[0]?.stat;
    if (!hittingStats) return null;
    return {
      type: 'hitting',
      s1Label: 'AVG', s1: hittingStats.avg || '-',
      s2Label: 'OBP', s2: hittingStats.obp || '-',
      s3Label: 'HR', s3: hittingStats.homeRuns || '-',
      s4Label: 'HITS', s4: hittingStats.hits || '-',
    };
  }
}

export default async function HallOfFamePage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  
  // 1. Auth Check
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const userTeamId = (session?.user as any)?.teamId;
  const canInduct = userTeamId === teamId || userRole === 'COMMISH' || userRole === 'ADMIN';

  // 2. Fetch the Data
  const inductees = await prisma.teamHallOfFame.findMany({
    where: { teamId },
    include: {
      team: true,
      player: {
        include: { positions: true }
      }
    },
    orderBy: { inductionYear: 'desc' }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Area */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hall of Fame</h2>
          <p className="text-sm text-slate-500 mt-1">
            Immortalizing the legends who built this franchise.
          </p>
        </div>
        {canInduct && (
          <ClientHofWrapper teamId={teamId} />
        )}
      </div>

      {inductees.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <p className="text-slate-400 font-medium">This franchise has not inducted any players yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inductees.map((inductee) => {
            const stats = getCareerStats(inductee.player);
            return <HofPlaque key={inductee.id} inductee={inductee} stats={stats} />;
          })}
        </div>
      )}
    </div>
  );
}