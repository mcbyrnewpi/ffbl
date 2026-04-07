// src/app/api/teams/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Prisma's "include" fetches relational data in a single query
    const teams = await prisma.team.findMany({
      include: {
        managers: {
          select: { 
            name: true, 
            email: true, 
            role: true 
          } // Only grab safe data (e.g., leaving out session tokens)
        }
      },
      orderBy: {
        name: 'asc' // Sort the output alphabetically
      }
    });

    // Return the data as a clean JSON response
    return NextResponse.json(teams);
    
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const body = await req.json();
    
    // Extract ALL fields including affiliates
    const { 
      name, logoUrl,
      aaaAffiliateName, aaAffiliateName, aAffiliateName,
      aaaLogoUrl, aaLogoUrl, aLogoUrl
    } = body;

    const updatedTeam = await prisma.team.update({
      where: { id: teamId }, // Use the resolved teamId
      data: {
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(aaaAffiliateName !== undefined && { aaaAffiliateName }),
        ...(aaAffiliateName !== undefined && { aaAffiliateName }),
        ...(aAffiliateName !== undefined && { aAffiliateName }),
        ...(aaaLogoUrl !== undefined && { aaaLogoUrl }),
        ...(aaLogoUrl !== undefined && { aaLogoUrl }),
        ...(aLogoUrl !== undefined && { aLogoUrl }),
      },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("Failed to update team:", error);
    return NextResponse.json({ error: "Failed to update franchise settings." }, { status: 500 });
  }
}