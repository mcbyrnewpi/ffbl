// src/app/api/trades/decline.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tradeId, userId } = body;

    if (!tradeId || !userId) {
      return NextResponse.json({ error: "Missing tradeId or userId" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the trade and all its assets
      const trade = await tx.trade.findUnique({
        where: { id: tradeId },
        include: {
          approvals: { include: { user: true } },
          assets: true,
        },
      });

      if (!trade) throw new Error("Trade not found");
      if (trade.status !== 'PENDING') throw new Error(`Trade is already ${trade.status}`);

      // 2. Identify who is clicking the button
      const userTeam = await tx.user.findUnique({ where: { id: userId }, select: { teamId: true } });
      if (!userTeam || !userTeam.teamId) throw new Error("User team not found");

      const isProposer = trade.initiatingTeamId === userTeam.teamId;
      const userApproval = trade.approvals.find(a => a.userId === userId);

      if (!isProposer && !userApproval) {
        throw new Error("User is not authorized to interact with this trade.");
      }

      // 3. If a receiver is rejecting it, log their specific ticket as REJECTED
      if (userApproval && !isProposer) {
         await tx.tradeApproval.update({
           where: { id: userApproval.id },
           data: { status: 'REJECTED' }
         });
      }

      // 4. Kill the parent trade
      await tx.trade.update({
        where: { id: tradeId },
        data: { status: 'CANCELLED' } 
      });

      // 5. The Master Key: Break ALL padlocks associated with this trade
      const playerIds = trade.assets.filter(a => a.playerId).map(a => a.playerId as string);
      const pickIds = trade.assets.filter(a => a.draftPickId).map(a => a.draftPickId as string);

      if (playerIds.length > 0) {
        await tx.player.updateMany({
          where: { id: { in: playerIds } },
          data: { isTradeLocked: false }
        });
      }

      if (pickIds.length > 0) {
        await tx.draftPick.updateMany({
          where: { id: { in: pickIds } },
          data: { isTradeLocked: false }
        });
      }

      return { 
        status: isProposer ? "Trade successfully cancelled." : "Trade successfully rejected.", 
        tradeId 
      };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Trade Decline Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to decline trade." },
      { status: 500 }
    );
  }
}