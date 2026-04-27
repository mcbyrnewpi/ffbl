// src/app/api/ai/generate-trade-media/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60; 

export async function POST(request: Request) {
  try {
    const { tradeId, isManual, useFastModel } = await request.json();

    if (!tradeId) {
      return NextResponse.json({ error: "No tradeId provided" }, { status: 400 });
    }

    // 1. Fetch the completed trade
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

    // 2. Map team names for display
    const teamIds = [...new Set(trade.assets.flatMap(a => [a.fromTeamId, a.toTeamId]))];
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true }
    });
    
    const teamMap: Record<string, string> = {};
    teams.forEach(t => teamMap[t.id] = t.name);

    // ==========================================================
    // 📧 STEP 3: FIRE THE EMAIL BLAST FIRST (Reliability Mode)
    // ==========================================================
    
    if (!isManual) {
      let recipientEmails: string[] = [];
      if (process.env.TEST_EMAIL_OVERRIDE) {
        console.log(`🧪 [STAGING OVERRIDE] Sending Proposal to: ${process.env.TEST_EMAIL_OVERRIDE}`);
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
            react: TradeAnnouncementEmail({ 
              subject: emailSubject, 
              tradeDetails, 
              tradeId, 
              appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' 
            }),
          });
          console.log("✅ Trade Announcement Email dispatched.");
        }
      } catch (emailError) {
        console.error("❌ Email failed to send, but proceeding to AI:", emailError);
      }
    } else {
      console.log("⚙️ Manual AI generation requested: Skipping email announcement.");
    }

    // ==========================================================
    // 🤖 STEP 4: GENERATE AI MEDIA (Multi-Layer Fallback)
    // ==========================================================
    let cleanAnalysis = null;

    try {
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

      const aiSchema = z.object({
        theStathead: z.string().describe("The analytical breakdown. Format the text using markdown."),
        theScout: z.string().describe("The dynasty outlook. Format the text using markdown."),
        theShockJock: z.string().describe("The radio script dialogue. Format the text using markdown."),
      });

      const systemPrompt = `You are the driving force behind a Fantasy Baseball Media Network. A trade has just occurred. You need to provide three distinct analytical reactions. 
      
      Personality 1 (Stats Guy): You are a baseball stats nerd who relies entirely on advanced analytics, positional scarcity, regression, and immediate MLB impact. You despise "gut feel" and traditional scouting. Give a highly analytical breakdown of who won right now. If there are draft picks involved: a first round pick is equivalent to a top 100 milb prospect. A second round pick is equivalent to a top 150 prospect. A third round pick is equivalent to a very young international signing or a relief with the potential to get a closer role. Fourth and Fifth round picks are essentially guys that were dropped in the offseason.
      
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

      const generateWithModel = async (modelId: string, timeoutMs: number) => {
        const { object } = await generateObject({
          model: google(modelId),
          schema: aiSchema,
          system: systemPrompt,
          prompt: userPrompt,
          abortSignal: AbortSignal.timeout(timeoutMs) 
        });
        return object;
      };

      let aiObject;
      try {
        if (useFastModel) {
          console.log("⚡ Fast Mode Requested: Giving Gemini Flash 55 seconds...");
          aiObject = await generateWithModel('gemini-2.5-flash', 55000);
        } else if (isManual) {
          console.log("👑 Manual Pro Mode Requested: Giving Gemini Pro 55 seconds...");
          aiObject = await generateWithModel('gemini-3.1-pro-preview', 55000); 
        } else {
          console.log("🤖 Automatic Background Generation: Giving Pro 40 seconds...");
          aiObject = await generateWithModel('gemini-3.1-pro-preview', 40000); 
        }
      } catch (e1) {
        if (isManual) {
          console.error("❌ Manual model generation failed or timed out:", e1);
        } else {
          console.warn("⚠️ Tier 1 Automatic Failed/Timed Out. Falling back to Gemini Flash...");
          try {
            // Give Flash the remaining 15 seconds to try and save the automatic request
            aiObject = await generateWithModel('gemini-2.5-flash', 15000); 
          } catch (e2) {
            console.error("❌ Both Pro and Flash automatic models failed.");
          }
        }
      }

      // Final cleanup check
      if (aiObject && typeof aiObject.theShockJock === 'string' && aiObject.theShockJock.trim().startsWith('{"theStathead"')) {
        try {
          aiObject = JSON.parse(aiObject.theShockJock);
        } catch (e) {
          console.error("Failed to parse nested AI JSON", e);
        }
      }

      cleanAnalysis = aiObject;

      // Update the Trade record
      if (cleanAnalysis) {
        await prisma.trade.update({
          where: { id: tradeId },
          data: { aiAnalysis: cleanAnalysis }
        });
      }

    } catch (aiError) {
      console.error("❌ All AI models failed. Trade completed without analysis:", aiError);
    }

    return NextResponse.json({ 
      success: true, 
      aiAnalysis: cleanAnalysis || { error: "Scouts are still debating. Check back in a few minutes!" } 
    }, { status: 200 });

  } catch (error) {
    console.error("Internal Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}