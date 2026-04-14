// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const teamId = searchParams.get('teamId');
    const type = searchParams.get('type'); 
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    let modernTransactions: any[] = [];
    let legacyTransactions: any[] = [];

    let modernSearchCondition = {};
    let legacySearchCondition = {};

    if (search) {
      const terms = search.trim().split(/\s+/); // Splits by space
      if (terms.length === 1) {
        // Single word: check if it's in first OR last name
        modernSearchCondition = {
          player: {
            OR: [
              { firstName: { contains: terms[0], mode: 'insensitive' } },
              { lastName: { contains: terms[0], mode: 'insensitive' } }
            ]
          }
        };
        legacySearchCondition = {
          OR: [
            { player_first_name: { contains: terms[0], mode: 'insensitive' } },
            { player_last_name: { contains: terms[0], mode: 'insensitive' } }
          ]
        };
      } else {
        // Two words (e.g. "Freddie Freeman"): First matches First, Last matches Last
        modernSearchCondition = {
          player: {
            firstName: { contains: terms[0], mode: 'insensitive' },
            lastName: { contains: terms[1], mode: 'insensitive' }
          }
        };
        legacySearchCondition = {
          player_first_name: { contains: terms[0], mode: 'insensitive' },
          player_last_name: { contains: terms[1], mode: 'insensitive' }
        };
      }
    }

    // ==========================================
    // 1. FETCH MODERN TRANSACTIONS
    // ==========================================
    modernTransactions = await prisma.transaction.findMany({
      where: {
        ...(playerId && { playerId }),
        ...(teamId && { teamId }),
        ...(type && { type: type as TransType }),
        ...modernSearchCondition
      },
      include: {
        player: { select: { firstName: true, lastName: true, mlbId: true, legacyId: true } },
        team: { select: { name: true } },
        draftPick: { select: { year: true, round: true, originalOwner: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // ==========================================
    // 2. FETCH LEGACY TRANSACTIONS
    // ==========================================
    let targetLegacyId: number | null = null;
    if (playerId) {
      const p = await prisma.player.findUnique({ where: { id: playerId }, select: { legacyId: true } });
      targetLegacyId = p?.legacyId || null;
    }

    let targetTeamName: string | null = null;
    if (teamId) {
      const t = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });
      targetTeamName = t?.name || null;
    }

    // Only query legacy if we aren't filtered strictly to a modern-only concept
    if (!playerId || targetLegacyId) {
      
      // Map Modern Types to Legacy Logic
      let legacyTypeFilter = {};
      if (type === 'ADD') legacyTypeFilter = { team_before: { equals: 'null' } }; // Or literal null depending on your DB
      if (type === 'DROP') legacyTypeFilter = { team_after: { equals: 'null' } };
      // Trades are harder to map in a single Prisma 'where' because we have to compare two columns (team_before != team_after). 
      // We will fetch slightly broader and filter trades in memory.

      legacyTransactions = await prisma.legacyTransaction.findMany({
        where: {
          ...legacyTypeFilter,
          ...(targetLegacyId && { player_id: targetLegacyId }),
          ...(targetTeamName && { 
            OR: [ { team_before: targetTeamName }, { team_after: targetTeamName } ]
          }),
          ...legacySearchCondition
        },
        orderBy: { created_at: 'desc' },
        take: limit * 2, // Fetch a bit extra in case we have to drop some during in-memory mapping
      });
    }

    // ==========================================
    // 3. THE MAPPING ROSETTA STONE
    // ==========================================
    const unified: any[] = [
      ...modernTransactions.map(t => {
        let assetName = 'Unknown Asset';
        if (t.player) {
          assetName = `${t.player.firstName} ${t.player.lastName}`;
        } else if (t.draftPick) {
          const origTeam = t.draftPick.originalOwner?.name || 'Unknown Team';
          assetName = `${t.draftPick.year} Round ${t.draftPick.round} Pick (${origTeam})`;
        }

        return {
          id: t.id,
          date: t.createdAt,
          type: t.type,
          playerName: assetName, 
          mlbId: t.player?.mlbId || null, 
          teamName: t.team?.name || "Free Agency",
          details: t.details,
          tradeId: t.tradeId || null,
          era: 'MODERN'
        };
      }),
      ...legacyTransactions.map(lt => {
        let mappedType = 'OTHER';
        if (lt.team_before === 'null' || !lt.team_before) mappedType = 'ADD';
        else if (lt.team_after === 'null' || !lt.team_after) mappedType = 'DROP';
        else if (lt.team_before !== lt.team_after) mappedType = 'TRADE';
        else if (lt.league_after !== lt.league_before) {
            if (lt.league_after?.includes('DL')) mappedType = 'PLACE_ON_IL';
            else if (lt.league_before?.includes('DL')) mappedType = 'ACTIVATE';
            else mappedType = 'ROSTER_MOVE';
        }

        return {
          id: `legacy-${lt.id}`,
          date: lt.created_at,
          type: mappedType,
          playerName: `${lt.player_first_name} ${lt.player_last_name}`,
          mlbId: null, 
          teamName: lt.team_after !== 'null' ? lt.team_after : lt.team_before,
          details: lt.details,
          tradeId: null,
          era: 'LEGACY'
        };
      })
    ];

    // IN-MEMORY FILTER FOR LEGACY TRADES & TYPES
    // Because Prisma can't easily do `WHERE columnA != columnB`, we filter the legacy trades here.
    let finalUnified = unified;
    if (type) {
      finalUnified = unified.filter(t => t.type === type);
    }

    // 4. FINAL SORT & LIMIT
    finalUnified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(finalUnified.slice(0, limit));

  } catch (error) {
    console.error("Transaction Feed Error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}