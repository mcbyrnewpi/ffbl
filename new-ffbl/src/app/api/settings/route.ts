// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    // We assume there's always one master settings row with id: 1
    let settings = await prisma.leagueSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      // 🛠️ The Self-Healing DB: If the row doesn't exist, create it with your FFBL defaults!
      settings = await prisma.leagueSettings.create({
        data: {
          id: 1,
          enforceRosterLimits: true,
          mlbLimit: 25,
          aaaLimit: 6,
          aaLimit: 6,
          aLimit: 6,
          ilLimit: 5,
          naLimit: 2
        }
      });
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

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    // 🛡️ Protect: Commish or Admin only
    if (!session?.user || (userRole !== "COMMISH" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      tradeDeadline, 
      enforceRosterLimits, 
      mlbLimit, aaaLimit, aaLimit, aLimit, ilLimit, naLimit 
    } = body;

    const updatedSettings = await prisma.leagueSettings.update({
      where: { id: 1 },
      data: {
        tradeDeadline: tradeDeadline ? new Date(tradeDeadline) : null,
        enforceRosterLimits,
        mlbLimit: parseInt(mlbLimit),
        aaaLimit: parseInt(aaaLimit),
        aaLimit: parseInt(aaLimit),
        aLimit: parseInt(aLimit),
        ilLimit: parseInt(ilLimit),
        naLimit: parseInt(naLimit),
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}