// src/app/api/ai/generate-trade-media/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    const { tradeId } = await request.json();

    if (!tradeId) {
      return NextResponse.json({ error: "No tradeId provided" }, { status: 400 });
    }

    // 1. Fetch the fully completed trade and its assets
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        assets: {
          include: {
            player: true,
            draftPick: true,
          }
        }
      }
    });

    if (!trade || trade.status !== 'PROCESSED') {
      return NextResponse.json({ error: "Trade not found or not processed." }, { status: 400 });
    }

    // 2. We need to fetch the team names manually since assets only have teamIds
    const teamIds = [...new Set(trade.assets.flatMap(a => [a.fromTeamId, a.toTeamId]))];
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true }
    });
    
    const teamMap: Record<string, string> = {};
    teams.forEach(t => teamMap[t.id] = t.name);

    // 3. Format the data into a clean, readable string for the AI
    const cleanTradeSummary = trade.assets.map(asset => {
      const from = teamMap[asset.fromTeamId];
      const to = teamMap[asset.toTeamId];
      if (asset.player) {
        const p = asset.player as any;
        return `Player: ${p.firstName} ${p.lastName} (Age: ${p.mlbRawData?.currentAge || '??'}, Level: ${p.level}, Top 100 Rank: ${p.prospectRank || 'None'}) moved from ${from} to ${to}.`;
      } else if (asset.draftPick) {
        return `Draft Pick: ${asset.draftPick.year} Round ${asset.draftPick.round} moved from ${from} to ${to}.`;
      }
      return 'Unknown Asset';
    }).join('\n');

    // 4. Force Gemini to return our exact JSON structure!
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        theStathead: z.string().describe("The analytical breakdown. Format the text using markdown."),
        theScout: z.string().describe("The dynasty outlook. Format the text using markdown."),
        theShockJock: z.string().describe("The radio script dialogue. Format the text using markdown."),
      }),
      system: `You are the driving force behind a Fantasy Baseball Media Network. A massive trade has just occurred. You need to provide three distinct analytical reactions. 
      
      Personality 1 (Stats Guy): You are a massive nerd who relies entirely on advanced analytics, positional scarcity, regression, and immediate MLB impact. You despise "gut feel" and traditional scouting. Give a highly analytical breakdown of who won right now. If there are draft picks involved: a first round pick is equivalent to a top 100 milb prospect. A second round pick is equivalent to a top 150 prospect. A third round pick is equivalent to a very young international signing or a relief with the potential to get a closer role. Fourth and Fifth round picks are essentially guys that were dropped in the offseason.
      
      Personality 2 (Dynasty Guy): You are a grizzled, old-school minor league scout. You only care about the 2-5 year championship window. You look at projectable frames, bat speed, minor league levels, and prospect rankings. Tell us which franchise set themselves up for a dynasty. If there are draft picks involved: a first round pick is equivalent to a top 100 milb prospect. A second round pick is equivalent to a top 150 prospect. A third round pick is equivalent to a very young international signing or a relief with the potential to get a closer role. Fourth and Fifth round picks are essentially guys that were dropped in the offseason.
      
      Personality 3 (Family Guy): You are Stewie and Brian Griffin from Family Guy broadcasting a sports talk radio show. Write this entirely as a script dialogue. Brian tries to sound like a pretentious sports analyst using cliches, while Stewie ruthlessly insults Brian, roasts the managers involved in the trade, and delivers shockingly accurate, cynical fantasy baseball analysis. Once in a while Peter or another character will butt in wondering what Stewie and Brian are talking about, but not every trade.`,
      prompt: `Analyze this trade:\n\n${cleanTradeSummary}`,
    });

    // Catch Gemini if it stuffs the entire payload inside theShockJock
    let cleanAnalysis = { ...object };
    if (typeof cleanAnalysis.theShockJock === 'string' && cleanAnalysis.theShockJock.trim().startsWith('{"theStathead"')) {
      try {
        const parsed = JSON.parse(cleanAnalysis.theShockJock);
        cleanAnalysis = parsed;
      } catch (e) {
        console.error("Failed to parse nested AI JSON", e);
      }
    }

    // 5. Save the CLEAN generated media directly to the Trade record
    await prisma.trade.update({
      where: { id: tradeId },
      data: {
        aiAnalysis: cleanAnalysis 
      }
    });

    // Note: We will hook up the Resend Email function right here in the next step!

    return NextResponse.json({ success: true, aiAnalysis: cleanAnalysis }, { status: 200 });

  } catch (error) {
    console.error("AI Media Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate AI Media" }, { status: 500 });
  }
}