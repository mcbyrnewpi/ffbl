import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initiatingTeamId, expiresInDays, assets } = body;

    // 1. Basic Payload Validation
    if (!initiatingTeamId || !assets || assets.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: Must include an initiating team and at least one asset." },
        { status: 400 }
      );
    }

    // 2. Calculate the Expiration Date (if provided)
    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // 3. The Mega-Transaction
    const newTrade = await prisma.$transaction(async (tx) => {
      
      // 👉 A: Create the Trade and nested Assets
      const trade = await tx.trade.create({
        data: {
          initiatingTeamId,
          expiresAt,
          status: 'PENDING',
          assets: {
            create: assets.map((asset: any) => ({
              fromTeamId: asset.fromTeamId,
              toTeamId: asset.toTeamId,
              playerId: asset.playerId || null,
              draftPickId: asset.draftPickId || null,
            })),
          },
        },
        include: {
          assets: true, 
        },
      });

      // 👉 B: The Roster Freeze 🔒
      const playerIds = trade.assets
        .filter((a) => a.playerId && a.fromTeamId === initiatingTeamId)
        .map((a) => a.playerId as string);
        
      const pickIds = trade.assets
        .filter((a) => a.draftPickId && a.fromTeamId === initiatingTeamId)
        .map((a) => a.draftPickId as string);

      if (playerIds.length > 0) {
        await tx.player.updateMany({
          where: { id: { in: playerIds } },
          data: { isTradeLocked: true },
        });
      }

      if (pickIds.length > 0) {
        await tx.draftPick.updateMany({
          where: { id: { in: pickIds } },
          data: { isTradeLocked: true },
        });
      }

      // 👉 C: Figure out unique teams and create Approvals (Double-Lock Ready)
      const allTeamIds = trade.assets.flatMap((a) => [a.fromTeamId, a.toTeamId]);
      const uniqueTeamIds = [...new Set(allTeamIds)] as string[];

      const teamManagers = await tx.user.findMany({
        where: {
          teamId: { in: uniqueTeamIds },
          isPrimaryManager: true, 
        },
        select: { id: true, teamId: true }, 
      });

      for (const teamId of uniqueTeamIds) {
        if (!teamManagers.some(m => m.teamId === teamId)) {
          throw new Error(`Cannot propose trade: No primary manager found for team ${teamId}`);
        }
      }

      const approvalData = teamManagers.map((manager) => {
        return {
          tradeId: trade.id,
          userId: manager.id, 
          status: manager.teamId === initiatingTeamId ? 'APPROVED' : 'PENDING' 
        };
      });

      await tx.tradeApproval.createMany({
        data: approvalData
      });

      // 👉 Return the fully assembled trade out of the transaction
      return await tx.trade.findUnique({
        where: { id: trade.id },
        include: {
          assets: true,
          approvals: true
        }
      });
    });

    // 4. Send the successful response back to the frontend
    return NextResponse.json(newTrade, { status: 201 });

  } catch (error) {
    console.error("Trade Proposal Error:", error);
    return NextResponse.json(
      { error: "Failed to propose trade." },
      { status: 500 }
    );
  }
}