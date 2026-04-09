import { prisma } from '@/lib/prisma';
import DraftPicksTable from "@/components/teams/DraftPicksTable";

export default async function DraftCapitalPage({ params }: { params: Promise<{ teamId: string }> }) {
  // Await the params per Next 15 rules
  const { teamId } = await params;

  // Fetch all draft picks currently owned by this team
  const picks = await prisma.draftPick.findMany({
    where: {
      currentOwnerId: teamId,
    },
    include: {
      originalOwner: true, // We need this so the table can display the original franchise name
    },
    orderBy: [
      { year: 'asc' },
      { round: 'asc' },
    ],
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Area */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Draft Picks</h2>
          <p className="text-sm text-slate-500 mt-1">
            Future amateur draft picks currently owned by this franchise.
          </p>
        </div>
      </div>

      {/* Render your pre-built component! */}
      <DraftPicksTable picks={picks} currentTeamId={id} />
      
    </div>
  );
}