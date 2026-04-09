// src/app/api/teams/[teamId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    
    // 🛡️ SECURITY CHECK: Get the logged-in user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // If they aren't an admin, verify they are the PRIMARY manager for this exact team
    if (userRole !== 'ADMIN') {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true, isPrimaryManager: true }
      });

      if (dbUser?.teamId !== teamId || !dbUser?.isPrimaryManager) {
        return NextResponse.json({ error: "Forbidden: Only Primary Managers can edit franchise settings." }, { status: 403 });
      }
    }

    const body = await req.json();
    
    // Extract fields including the new motto!
    const { 
      name, logoUrl, motto,
      aaaAffiliateName, aaAffiliateName, aAffiliateName,
      aaaLogoUrl, aaLogoUrl, aLogoUrl
    } = body;

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(motto !== undefined && { motto }), // 🌟 Added motto
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