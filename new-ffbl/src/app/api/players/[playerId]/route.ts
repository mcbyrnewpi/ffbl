// src/app/api/players/[playerId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> } // Next.js 15 Async Params!
) {
  const { playerId } = await params;

  try {
    const body = await request.json();
    const { level, teamId } = body;

    // 1. Prepare the update data object
    // We only update fields that are actually sent in the request body
    const updateData: any = {};
    if (level !== undefined) updateData.level = level;
    if (teamId !== undefined) updateData.teamId = teamId;

    // 2. Perform the update
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: updateData,
      include: {
        team: { select: { name: true } } // Show the new owner in the response
      }
    });

    return NextResponse.json(updatedPlayer);

  } catch (error) {
    console.error("Player Update Error:", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}