// src/app/api/users/me/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    /** * 💡 TEMP MOCK: In Phase 3, we will get this email from the 
     * NextAuth session (e.g., session.user.email).
     * For now, replace this with your actual email from the database 
     * to test the "Me" functionality!
     */
    const currentUserEmail = "mcbyrnewpi@yahoo.com"; 

    const userProfile = await prisma.user.findUnique({
      where: { email: currentUserEmail },
      include: {
        team: {
          include: {
            managers: {
              select: { name: true, role: true }
            },
            // We include the players so the "My Roster" page loads instantly
            players: {
              include: { positions: true },
              orderBy: { lastName: 'asc' }
            }
          }
        }
      }
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json(userProfile);

  } catch (error) {
    console.error("Me Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}