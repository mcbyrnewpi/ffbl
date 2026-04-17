import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }

    const roster = await prisma.player.findMany({
      where: { teamId: teamId },
      include: {
        team: true,
        positions: {
          include: {
            position: true
          }
        },
        prospectRankings: true
      },
      orderBy: {
        lastName: 'asc'
      }
    });

    return NextResponse.json(roster);
  } catch (error) {
    console.error("Roster Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch roster" }, { status: 500 });
  }
}