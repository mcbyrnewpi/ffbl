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