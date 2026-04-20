// src/app/api/teams/[teamId]/invite/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { resend } from '@/lib/resend';
import CoManagerInviteEmail from '@/emails/CoManagerInviteEmail';


export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { teamId } = await params;

  // Security: Only the Commish or the Primary Manager of THIS team can invite a co-manager
  const isCommish = user.role === 'COMMISH' || user.role === 'ADMIN';
  const isPrimaryManagerOfTeam = user.teamId === teamId && user.isPrimaryManager;

  if (!isCommish && !isPrimaryManagerOfTeam) {
    return NextResponse.json({ error: 'Only the Primary Manager or Commish can invite co-managers.' }, { status: 403 });
  }

  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch the Team name so we can use it in the email
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    // 2. Check if user already exists
    let existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      // If they exist but belong to another team, block it
      if (existingUser.teamId && existingUser.teamId !== teamId) {
        return NextResponse.json({ error: 'This user is already managing another franchise.' }, { status: 400 });
      }

      // If they exist, just update their team ID to yours
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          teamId: teamId,
          role: existingUser.role === 'COMMISH' ? 'COMMISH' : 'OWNER',
          isPrimaryManager: false // Invites are always secondary managers by default
        }
      });
    } else {
      // 3. If they don't exist, create a shell account. 
      // When they log in via Magic Link, NextAuth will seamlessly attach to this record!
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || email.split('@')[0], // Fallback to email prefix if no name provided
          teamId: teamId,
          role: 'OWNER',
          isPrimaryManager: false
        }
      });
    }

    // 4. 🚀 BLAST THE INVITE EMAIL
    const loginUrl = `${process.env.NEXTAUTH_URL}/teams/${teamId}`;
    
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'FFBL Commissioner <onboarding@resend.dev>',
      to: [normalizedEmail],
      subject: `FFBL Invite: Join the ${team.name}!`,
      react: CoManagerInviteEmail({ 
        teamName: team.name, 
        inviterName: user.name || 'Your League Commissioner',
        inviteeName: name || 'Manager',
        loginUrl 
      }),
    });

    return NextResponse.json({ message: 'Co-Manager invited successfully!' });

  } catch (error: any) {
    console.error("Co-Manager Invite Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}