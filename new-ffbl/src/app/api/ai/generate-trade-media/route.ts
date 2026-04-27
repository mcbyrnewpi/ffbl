// src/app/api/ai/generate-trade-media/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { tradeId, isManual, useFastModel } = await request.json();

    if (!tradeId) {
      return NextResponse.json({ error: "No tradeId provided" }, { status: 400 });
    }

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        assets: {
          include: { player: true, draftPick: true }
        }
      }
    });

    if (!trade || trade.status !== 'PROCESSED') {
      return NextResponse.json({ error: "Trade not found or not processed." }, { status: 400 });
    }

    const teamIds = [...new Set(trade.assets.flatMap(a => [a.fromTeamId, a.toTeamId]))];
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true }
    });
    
    const teamMap: Record<string, string> = {};
    teams.forEach(t => teamMap[t.id] = t.name);

    // ==========================================================
    // 📧 STEP 3: FIRE THE EMAIL BLAST FIRST
    // ==========================================================
    if (!isManual) {
      // ... (Email logic remains unchanged)
      let recipientEmails: string[] = [];
      if (process.env.TEST_EMAIL_OVERRIDE) {
        recipientEmails = [process.env.TEST_EMAIL_OVERRIDE];
      } else {
        const allUsers = await prisma.user.findMany({
          where: { email: { not: null } },
          select: { email: true }
        });
        recipientEmails = allUsers.map(u => u.email as string).filter(e => e.length > 0);
      }

      const groupedAssets: Record<string, string[]> = {};
      trade.assets.forEach(asset => {
        const toTeamName = teamMap[asset.toTeamId];
        const assetName = asset.player 
          ? `${(asset.player as any).firstName} ${(asset.player as any).lastName}` 
          : `${asset.draftPick?.year} Round ${asset.draftPick?.round} Pick (${teamMap[asset.draftPick?.originalOwnerId || ''] || 'Unknown'})`;
          
        if (!groupedAssets[toTeamName]) groupedAssets[toTeamName] = [];
        groupedAssets[toTeamName].push(assetName);
      });

      const tradeDetails = Object.keys(groupedAssets).sort().map(teamName => ({
        teamName,
        assets: groupedAssets[teamName]
      }));

      const teamNames = Object.values(teamMap);
      const dateString = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const emailSubject = `${dateString} FFBL Trade: ${teamNames.join(' & ')}`;

      try {
        const { resend } = await import('@/lib/resend');
        const { TradeAnnouncementEmail } = await import('@/emails/TradeAnnouncementEmail');
        if (recipientEmails.length > 0) {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'FFBL Commissioner <onboarding@resend.dev>',
            to: recipientEmails,
            subject: emailSubject,
            react: TradeAnnouncementEmail({ subject: emailSubject, tradeDetails, tradeId, appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' }),
          });
        }
      } catch (emailError) {
        console.error("❌ Email failed:", emailError);
      }
    }

    // ==========================================================
    // 🤖 STEP 4: GENERATE AI MEDIA (SMART BACKFILL)
    // ==========================================================
    
    const cleanTradeSummary = trade.assets.map(asset => {
      const from = teamMap[asset.fromTeamId];
      const to = teamMap[asset.toTeamId];
      if (asset.player) {
        const p = asset.player as any;
        return `Player: ${p.firstName} ${p.lastName} (Age: ${p.mlbRawData?.currentAge || '??'}, Level: ${p.level}, Top 100 Rank: ${p.prospectRank || 'None'}) moved from ${from} to ${to}.`;
      } else if (asset.draftPick) {
        return `Draft Pick: ${asset.draftPick.year} Round ${asset.draftPick.round} moved from ${from} to ${to}.`;
      }
      return 'Unknown';
    }).join('\n');

    const userPrompt = `Analyze this trade:\n\n${cleanTradeSummary}`;

    const prompts = {
      stathead: `You are a baseball stats nerd who relies entirely on advanced analytics, positional scarcity, regression, and immediate MLB impact. You despise "gut feel" and traditional scouting. Give a highly analytical but CONCISE breakdown (max 2 short paragraphs) of who won right now. Format using markdown. If draft picks are involved: 1st round = Top 100 prospect, 2nd round = Top 150, 3rd round = wild card, 4th/5th = organizational depth.`,
      scout: `You are a grizzled, old-school minor league scout. You only care about the 2-5 year championship window, projectable frames, and prospect rankings. Tell us which franchise set themselves up for a dynasty in 1 or 2 short paragraphs. Format using markdown. If draft picks are involved: 1st round = Top 100 prospect, 2nd round = Top 150, 3rd round = wild card, 4th/5th = organizational depth.`,
      shockjock: `You are Stewie and Brian Griffin from Family Guy broadcasting a sports talk radio show. Write a SHORT script dialogue (MAXIMUM 6 to 8 lines total). Do not use the phrases "seismic shift," "shockwaves," or "fantasy landscape". Include a unique show title and hook. Stewie should ruthlessly insult Brian's intelligence and the managers' competence based on the specific players traded. Format using markdown.`,
      seinfeld: `You are writing a scene for the TV show Seinfeld reacting to this fantasy baseball trade. Write a SHORT script dialogue (MAXIMUM 6 to 8 lines total). Set the scene in a random iconic location (e.g., Jerry's apartment, Monk's Diner). Include 2 to 4 of the main characters. They should be arguing about the specific players and picks involved using their classic neuroses. Format using markdown.`
    };

    // 🌟 Independent Fetcher with built-in Flash fallback
    const fetchPersonaWithFallback = async (systemPrompt: string, primaryModel: string, timeoutMs: number, label: string) => {
      try {
        console.log(`🚀 Starting ${label} via ${primaryModel}...`);
        const { text, usage } = await generateText({
          model: google(primaryModel),
          system: systemPrompt,
          prompt: userPrompt,
          abortSignal: AbortSignal.timeout(timeoutMs),
          maxTokens: 1000, 
        });
        console.log(`✅ [${label}] Finished! Tokens: ${usage.totalTokens}`);
        return text;
      } catch (e) {
        console.warn(`⚠️ [${label}] Primary failed. Falling back to Flash...`);
        try {
          const { text, usage } = await generateText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            prompt: userPrompt,
            abortSignal: AbortSignal.timeout(15000), // 15s absolute limit for fallback
            maxTokens: 1000,
          });
          console.log(`✅ [${label}] Fallback Finished! Tokens: ${usage.totalTokens}`);
          return text;
        } catch (e2) {
          console.error(`❌ [${label}] Both models failed.`);
          return null; // Signals ultimate failure
        }
      }
    };

    let primaryModel = useFastModel ? 'gemini-2.5-flash' : 'gemini-3.1-pro-preview';
    let timeoutMs = isManual ? 40000 : 35000; // Leave 15s at the end for the Flash fallback to run!

    const existing = (trade.aiAnalysis as any) || {};
    
    // Helper to determine if a persona needs to be generated
    const needsGen = (text: string | undefined, errorPhrase: string) => 
      !text || text.includes(errorPhrase) || text === "Analysis unavailable.";

    const needsStathead = needsGen(existing.theStathead, "technical difficulties");
    const needsScout = needsGen(existing.theScout, "grabbing a hot dog");
    const needsShockjock = needsGen(existing.theShockJock, "dead air");
    const needsSeinfeld = needsGen(existing.theSeinfeld, "dead air");

    const tasks = [];
    
    if (needsStathead) {
      tasks.push(fetchPersonaWithFallback(prompts.stathead, primaryModel, timeoutMs, 'Stathead')
        .then(val => ({ key: 'theStathead', val, fallback: "*The analytics department is experiencing technical difficulties.*" })));
    }
    if (needsScout) {
      tasks.push(fetchPersonaWithFallback(prompts.scout, primaryModel, timeoutMs, 'Scout')
        .then(val => ({ key: 'theScout', val, fallback: "*The scouts are out grabbing a hot dog. Check back later.*" })));
    }
    if (needsShockjock) {
      tasks.push(fetchPersonaWithFallback(prompts.shockjock, primaryModel, timeoutMs, 'Shockjock')
        .then(val => ({ key: 'theShockJock', val, fallback: "*BEEEEEEP. We're experiencing dead air.*" })));
    }
    if (needsSeinfeld) {
      tasks.push(fetchPersonaWithFallback(prompts.seinfeld, primaryModel, timeoutMs, 'Seinfeld')
        .then(val => ({ key: 'theSeinfeld', val, fallback: "*What's the deal with dead air? Check back later.*" })));
    }

    if (tasks.length === 0) {
      console.log("⚡ All personas already exist. Nothing to backfill!");
      return NextResponse.json({ success: true, aiAnalysis: existing }, { status: 200 });
    }

    const results = await Promise.all(tasks);

    // Merge new results into the existing ones
    const cleanAnalysis = { ...existing };
    results.forEach(res => {
      // If it returned null (both models failed), use the funny fallback text
      cleanAnalysis[res.key] = res.val || res.fallback;
    });

    await prisma.trade.update({
      where: { id: tradeId },
      data: { aiAnalysis: cleanAnalysis }
    });

    return NextResponse.json({ 
      success: true, 
      aiAnalysis: cleanAnalysis 
    }, { status: 200 });

  } catch (error) {
    console.error("Internal Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}