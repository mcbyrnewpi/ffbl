import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mlbId: string }> }
) {
  const { mlbId } = await params;

  try {
    // 1. Fetch EVERYTHING MLB has on this ID
    // We hydrate stats for hitting, pitching, and even fielding/advanced
    const mlbUrl = `https://statsapi.mlb.com/api/v1/people/${mlbId}?hydrate=stats(group=[hitting,pitching,fielding],type=[career,season,projected])`;
    
    const res = await fetch(mlbUrl);
    const data = await res.json();
    const person = data.people?.[0];

    if (!person) return NextResponse.json({ error: "MLB Player not found" }, { status: 404 });

    // 2. Save the ENTIRE thing to mlbRawData
    // We also update basic fields like first/last name to keep things in sync
    const updatedPlayer = await prisma.player.update({
      where: { mlbId: parseInt(mlbId) },
      data: {
        mlbRawData: person, // This is the gold mine
        firstName: person.firstName,
        lastName: person.lastName,
        birthdate: person.birthDate ? new Date(person.birthDate) : null,
      }
    });

    return NextResponse.json({
      message: "Sync Successful",
      category_check: {
        has_hitting: person.stats?.some((s: any) => s.group.displayName === 'hitting'),
        has_pitching: person.stats?.some((s: any) => s.group.displayName === 'pitching'),
        is_active: person.active,
        current_team: person.currentTeam?.name || "None/Retired"
      },
      raw_data_preview: person
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}