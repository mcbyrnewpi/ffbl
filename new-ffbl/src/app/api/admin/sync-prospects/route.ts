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
    
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch from provided URL. Status: ${res.status}` }, { status: 400 });
    }
    
    const html = await res.text();

    const stateMatch = html.match(/data-init-state="(\{[\s\S]*?\})"/);
    
    if (!stateMatch || !stateMatch[1]) {
      return NextResponse.json({ error: "Could not locate data-init-state payload in MLB HTML." }, { status: 400 });
    }

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

    let prospects: any[] = [];
    const rootQuery = nextData?.payload?.ROOT_QUERY;
    
    if (rootQuery) {
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
      const refString = playerEntity.player?.__ref; 
      
      if (!refString) continue;
      
      const mlbId = parseInt(refString.replace('Person:', ''), 10);

      if (!mlbId || rank > 100) continue;

      // ==========================================
      // 🌟 THE NEW PROSPECT BIO PARSER 🌟
      // ==========================================
      let scoutingBlob: any = {};
      const bios = playerEntity.prospectBio || [];
      
      // Grab the bio for the specific target year, or fallback to the most recent one available
      const targetBio = bios.find((b: any) => b.contentTitle === targetYear.toString()) || bios[bios.length - 1];

      if (targetBio && targetBio.contentText) {
        const htmlText = targetBio.contentText;

        // 1. Extract the Grades (e.g., "Hit: 50 | Power: 60 | Run: 65")
        // Regex looks for "Scouting grades:" and grabs everything up to the next closing </p>
        const gradesMatch = htmlText.match(/Scouting grades[^:]*:\s*(.*?)(?:<\/p>)/i);
        if (gradesMatch && gradesMatch[1]) {
          const gradesStr = gradesMatch[1].replace(/<[^>]+>/g, ''); // strip rogue tags
          const gradePairs = gradesStr.split('|').map((s: string) => s.trim());
          
          gradePairs.forEach((pair: string) => {
            const [key, val] = pair.split(':').map((s: string) => s.trim());
            if (key && val) {
              scoutingBlob[key.toLowerCase()] = parseInt(val, 10) || val;
            }
          });
        }

        // 2. Extract the Written Report
        // Remove the Video link and the Scouting Grades line entirely from the text
        let reportHtml = htmlText.replace(/<p><a[^>]*>Video scouting report.*?<\/a><\/p>/gi, '');
        reportHtml = reportHtml.replace(/<p><strong>Scouting grades.*?<\/p>/gi, '');
        
        // Strip the remaining HTML tags and convert ugly text entities
        const cleanReport = reportHtml
          .replace(/(<([^>]+)>)/gi, "")
          .replace(/&nbsp;/g, ' ')
          .replace(/&#x27;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .trim();
          
        if (cleanReport) {
          scoutingBlob.report = cleanReport;
        }
      }

      // Find the player in our local FFBL database
      const player = await prisma.player.findFirst({
        where: { mlbId: mlbId }
      });

      if (player) {
        // Log the history!
        await prisma.prospectRanking.upsert({
          where: {
            playerId_year: { playerId: player.id, year: targetYear }
          },
          update: { 
            rank: rank, 
            eta: eta ? eta.toString() : null,
            scouting: Object.keys(scoutingBlob).length > 0 ? scoutingBlob : null
          },
          create: { 
            playerId: player.id, 
            year: targetYear, 
            rank: rank, 
            eta: eta ? eta.toString() : null,
            scouting: Object.keys(scoutingBlob).length > 0 ? scoutingBlob : null
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
      message: `Successfully scraped MLB HTML and matched ${matchedCount}/100 prospects for ${targetYear}.`,
      matchedCount, 
      year: targetYear 
    });

  } catch (error: any) {
    console.error("Prospect Scraping Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during scraping." }, { status: 500 });
  }
}