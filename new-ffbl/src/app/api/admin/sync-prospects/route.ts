// src/app/api/admin/sync-prospects/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const targetYear = parseInt(body.year) || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const sourceUrl = body.sourceUrl; 

    if (!sourceUrl) {
      return NextResponse.json({ error: "Missing source URL." }, { status: 400 });
    }

    console.log(`⚾ Scraping MLB Pipeline HTML from: ${sourceUrl}`);
    
    // 1. Fetch the raw HTML from the public MLB Webpage you provide
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch from provided URL. Status: ${res.status}` }, { status: 400 });
    }
    
    const html = await res.text();

    // 2. Extract the hidden data-init-state JSON blob using Regex
    const stateMatch = html.match(/data-init-state="(\{[\s\S]*?\})"/);
    
    if (!stateMatch || !stateMatch[1]) {
      return NextResponse.json({ error: "Could not locate data-init-state payload in MLB HTML." }, { status: 400 });
    }

    // 3. Decode the HTML entities (like &quot;) back into a valid JSON string
    const rawJsonStr = stateMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    let nextData;
    try {
      nextData = JSON.parse(rawJsonStr);
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse the decoded JSON state." }, { status: 400 });
    }

    // 4. Traverse the JSON to find the Rankings Array
    let prospects: any[] = [];
    const rootQuery = nextData?.payload?.ROOT_QUERY;
    
    if (rootQuery) {
      // Find the dynamic key that contains the rankings
      for (const key of Object.keys(rootQuery)) {
        if (key.includes('getPlayerRankingsFromSelection') && Array.isArray(rootQuery[key])) {
          prospects = rootQuery[key];
          break;
        }
      }
    }

    if (prospects.length === 0) {
      return NextResponse.json({ error: "Successfully fetched data, but couldn't find a valid prospect array inside the JSON." }, { status: 400 });
    }

    let matchedCount = 0;

    // 5. Clear the slate for live player cards if syncing the current year
    if (targetYear === currentYear) {
      await prisma.player.updateMany({
        where: { isTop100: true },
        data: { isTop100: false, prospectRank: null, prospectEta: null }
      });
    }

    // 6. Process the extracted Top 100
    for (const item of prospects) {
      const rank = item.rank;
      const playerEntity = item.playerEntity;
      
      if (!rank || !playerEntity) continue;

      const eta = playerEntity.eta;
      const refString = playerEntity.player?.__ref; // e.g., "Person:804606"
      
      if (!refString) continue;
      
      // Extract the integer MLB ID from the string
      const mlbId = parseInt(refString.replace('Person:', ''), 10);

      if (!mlbId || rank > 100) continue;

      // Compile the 20-80 Scouting Grades & Report
      // We check for both hitter (hit/power) and pitcher (fastball/slider) fields
      const rawReport = playerEntity.scoutingReport || '';
      const cleanReport = rawReport.replace(/(<([^>]+)>)/gi, "").trim(); // Strips HTML tags like <p>

      const scoutingBlob = {
        hit: playerEntity.hit,
        power: playerEntity.power,
        run: playerEntity.run,
        arm: playerEntity.arm,
        field: playerEntity.field,
        fastball: playerEntity.fastball,
        curveball: playerEntity.curveball,
        slider: playerEntity.slider,
        changeup: playerEntity.changeup,
        control: playerEntity.control,
        overall: playerEntity.overall,
        report: cleanReport !== '' ? cleanReport : null,
      };

      // Filter out undefined/null fields so Hitters don't save empty Pitcher grades and vice versa
      const cleanScoutingBlob = Object.fromEntries(
        Object.entries(scoutingBlob).filter(([_, v]) => v != null)
      );

      // Find the player in our local FFBL database
      const player = await prisma.player.findFirst({
        where: { mlbId: mlbId }
      });

      if (player) {
        // Log the history with the new SCOUTING JSON
        await prisma.prospectRanking.upsert({
          where: {
            playerId_year: { playerId: player.id, year: targetYear }
          },
          update: { 
            rank: rank, 
            eta: eta ? eta.toString() : null,
            scouting: cleanScoutingBlob 
          },
          create: { 
            playerId: player.id, 
            year: targetYear, 
            rank: rank, 
            eta: eta ? eta.toString() : null,
            scouting: cleanScoutingBlob
          }
        });

        // Apply the live badge!
        if (targetYear === currentYear) {
          await prisma.player.update({
            where: { id: player.id },
            data: { isTop100: true, prospectRank: rank, prospectEta: eta ? eta.toString() : null }
          });
        }
        matchedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully scraped MLB HTML and matched ${matchedCount}/100 prospects for ${targetYear}. Saved 20-80 Scouting Grades!`,
      matchedCount, 
      year: targetYear 
    });

  } catch (error: any) {
    console.error("Prospect Scraping Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during scraping." }, { status: 500 });
  }
}