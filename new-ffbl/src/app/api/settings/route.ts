// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // We assume there's always one master settings row with id: 1
    const settings = await prisma.leagueSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      // Fallback defaults just in case the DB hasn't been seeded yet
      return NextResponse.json({
        enforceRosterLimits: true,
        mlbLimit: 25,
        aaaLimit: 6,
        aaLimit: 6,
        aLimit: 6,
        ilLimit: 5,
        naLimit: 2
      }, { status: 200 });
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Error fetching league settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch league settings." },
      { status: 500 }
    );
  }
}