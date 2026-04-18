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
    
    // Build the update payload dynamically. 
    // This allows partial updates (like just hitting "Start Draft") without overriding roster limits to NaN.
    const updateData: any = {};

    if (body.tradeDeadline !== undefined) {
      updateData.tradeDeadline = body.tradeDeadline ? new Date(body.tradeDeadline) : null;
    }
    
    if (body.enforceRosterLimits !== undefined) updateData.enforceRosterLimits = Boolean(body.enforceRosterLimits);
    if (body.isDraftOpen !== undefined) updateData.isDraftOpen = Boolean(body.isDraftOpen);
    if (body.currentSeason !== undefined) updateData.currentSeason = parseInt(body.currentSeason);

    // Roster Limits
    if (body.mlbLimit !== undefined) updateData.mlbLimit = parseInt(body.mlbLimit);
    if (body.aaaLimit !== undefined) updateData.aaaLimit = parseInt(body.aaaLimit);
    if (body.aaLimit !== undefined) updateData.aaLimit = parseInt(body.aaLimit);
    if (body.aLimit !== undefined) updateData.aLimit = parseInt(body.aLimit);
    if (body.ilLimit !== undefined) updateData.ilLimit = parseInt(body.ilLimit);
    if (body.naLimit !== undefined) updateData.naLimit = parseInt(body.naLimit);

    const updatedSettings = await prisma.leagueSettings.update({
      where: { id: 1 },
      data: updateData,
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}