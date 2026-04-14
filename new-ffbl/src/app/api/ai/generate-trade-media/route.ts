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
    const aiSchema = z.object({
      theStathead: z.string().describe("The analytical breakdown. Format the text using markdown."),
      theScout: z.string().describe("The dynasty outlook. Format the text using markdown."),
      theShockJock: z.string().describe("The radio script dialogue. Format the text using markdown."),
    });

    const systemPrompt = `You are the driving force behind a Fantasy Baseball Media Network. A massive trade has just occurred. You need to provide three distinct analytical reactions. 
      
      Personality 1 (Stats Guy): You are a massive nerd who relies entirely on advanced analytics, positional scarcity, regression, and immediate MLB impact. You despise "gut feel" and traditional scouting. Give a highly analytical breakdown of who won right now. If there are draft picks involved: a first round pick is equivalent to a top 100 milb prospect. A second round pick is equivalent to a top 150 prospect. A third round pick is equivalent to a very young international signing or a relief with the potential to get a closer role. Fourth and Fifth round picks are essentially guys that were dropped in the offseason.
      
      Personality 2 (Dynasty Guy): You are a grizzled, old-school minor league scout. You only care about the 2-5 year championship window. You look at projectable frames, bat speed, minor league levels, and prospect rankings. Tell us which franchise set themselves up for a dynasty. If there are draft picks involved: a first round pick is equivalent to a top 100 milb prospect. A second round pick is equivalent to a top 150 prospect. A third round pick is equivalent to a very young international signing or a relief with the potential to get a closer role. Fourth and Fifth round picks are essentially guys that were dropped in the offseason.
      
      Personality 3 (Family Guy): You are Stewie and Brian Griffin from Family Guy broadcasting a sports talk radio show. 
        Write this entirely as a script dialogue. 
        CRITICAL: Do not use the phrases "seismic shift," "shockwaves," or "fantasy landscape" in the intro. 
        Every episode must have a unique, creative show title and a different opening hook. 
        Brian should try to be a "serious" analyst using annoying sports-talk-radio tropes, while Stewie is 
        cynically brilliant, ruthlessly insulting Brian's intelligence and the managers' competence. 
        Focus the banter on the specific players traded—if a player is old, made of glass, or a "never-was," 
        Stewie should weaponize those specific facts. 
        Occasionally, other characters like Peter (asking unrelated questions), Quagmire (distracted by a manager's 
        team name), Cleveland, or other characters might interrupt for a single line of dialogue.`;

    const userPrompt = `Analyze this trade:\n\n${cleanTradeSummary}`;

    // THE HEAVY HITTER SETUP (Pro primary, Flash fallback)
    let aiObject;
    try {
      console.log("Attempting to generate premium media with gemini-2.5-pro...");
      const { object } = await generateObject({
        model: google('gemini-2.5-pro'), 
        schema: aiSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });
      aiObject = object;
    } catch (error) {
      console.warn("⚠️ 2.5-pro is overloaded or timed out. Falling back to 2.5-flash!");
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        schema: aiSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });
      aiObject = object;
    }

    // Catch Gemini if it stuffs the entire payload inside theShockJock
    let cleanAnalysis = { ...aiObject };
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

    // ==========================================
    // 📧 6. FIRE THE RESEND EMAIL BLAST!
    // ==========================================
    
    let recipientEmails: string[] = [];

    // 1. Check for a test override first - Staging/Local testing
    if (process.env.TEST_EMAIL_OVERRIDE) {
      console.log(`🧪 [STAGING OVERRIDE] Sending trade email ONLY to: ${process.env.TEST_EMAIL_OVERRIDE}`);
      recipientEmails = [process.env.TEST_EMAIL_OVERRIDE];
    } else {
      // Prod - Fetch all User emails from the database
      const allUsers = await prisma.user.findMany({
        where: { 
          email: { not: null } 
        },
        select: { email: true }
      });

      recipientEmails = allUsers
        .map(u => u.email as string)
        .filter(email => email.length > 0);
    }

    // 2. Prepare Grouped Assets and Subject (Keep your existing logic)
    const groupedAssets: Record<string, string[]> = {};
    trade.assets.forEach(asset => {
      const toTeamName = teamMap[asset.toTeamId];
      const assetName = asset.player 
        ? `${(asset.player as any).firstName} ${(asset.player as any).lastName}` 
        : `a ${asset.draftPick?.year} Round ${asset.draftPick?.round} Pick`;
        
      if (!groupedAssets[toTeamName]) {
        groupedAssets[toTeamName] = [];
      }
      groupedAssets[toTeamName].push(assetName);
    });

    const tradeDetails = Object.keys(groupedAssets)
      .sort((a, b) => a.localeCompare(b))
      .map(teamName => ({
        teamName,
        assets: groupedAssets[teamName]
      }));

    const teamNames = Object.values(teamMap);
    const dateString = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const emailSubject = teamNames.length === 2 
      ? `${dateString} FFBL Trade Announcement: ${teamNames[0]} & ${teamNames[1]}`
      : `${dateString} FFBL Trade Announcement: ${teamNames.length}-team trade finalized!`;

    const { resend } = await import('@/lib/resend');
    const { TradeAnnouncementEmail } = await import('@/emails/TradeAnnouncementEmail');

    try {
      if (recipientEmails.length > 0) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'FFBL Commissioner <onboarding@resend.dev>',
          to: recipientEmails, 
          subject: emailSubject,
          react: TradeAnnouncementEmail({ 
            subject: emailSubject, 
            tradeDetails, 
            tradeId,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          }),
        });
        console.log(`Trade email successfully dispatched to ${recipientEmails.length} managers.`);
      }
    } catch (emailError) {
      console.error("Failed to send trade announcement email:", emailError);
    }

    return NextResponse.json({ success: true, aiAnalysis: cleanAnalysis }, { status: 200 });

  } catch (error) {
    console.error("AI Media Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate AI Media" }, { status: 500 });
  }
}