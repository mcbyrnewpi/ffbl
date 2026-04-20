// src/app/api/teams/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        managers: {
          select: { 
            id: true,               
            name: true, 
            email: true, 
            role: true,
            isPrimaryManager: true  
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc' 
      }
    });

    return NextResponse.json(teams);
    
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}