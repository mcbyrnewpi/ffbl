// src/app/api/admin/test-email/[tradeId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';
import { TradeAnnouncementEmail } from '@/emails/TradeAnnouncementEmail';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const tradeId = resolvedParams.tradeId;

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        assets: { include: { player: true, draftPick: true } }
      }
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found." }, { status: 404 });
    }

    const teamIds = [...new Set(trade.assets.flatMap(a => [a.fromTeamId, a.toTeamId]))];
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true }
    });
    
    const teamMap: Record<string, string> = {};
    teams.forEach(t => teamMap[t.id] = t.name);

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
      ? `🚨 FFBL Trade - ${dateString}: ${teamNames[0]} & ${teamNames[1]}`
      : `🚨 FFBL Trade - ${dateString}: ${teamNames.length}-team trade finalized!`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'FFBL Commissioner <onboarding@resend.dev>',
      to: ['ffblwebsite@gmail.com'], 
      subject: emailSubject,
      react: TradeAnnouncementEmail({ 
        subject: emailSubject, 
        tradeDetails,
        tradeId,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }),
    });

    return NextResponse.json({ 
      success: true, 
      message: `Test email sent successfully to your inbox for trade ${tradeId}!` 
    });

  } catch (error) {
    console.error("Test Email Generation Error:", error);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}