import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: { year: "desc" },
    });
    return NextResponse.json(seasons);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch seasons" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 🛡️ Protect the route: Only the COMMISH can add new seasons
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "COMMISH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      year, ffblChampion, playoffMvp, regularSeasonBest, 
      alChamp, nlChamp, mlbMvp, mlbCyYoung, mlbRoy 
    } = body;

    const newSeason = await prisma.season.create({
      data: {
        year: parseInt(year),
        ffblChampion,
        playoffMvp,
        regularSeasonBest,
        alChamp,
        nlChamp,
        mlbMvp,
        mlbCyYoung,
        mlbRoy,
      },
    });

    return NextResponse.json(newSeason, { status: 201 });
  } catch (error) {
    console.error("Failed to create season:", error);
    return NextResponse.json({ error: "Failed to create season" }, { status: 500 });
  }
}