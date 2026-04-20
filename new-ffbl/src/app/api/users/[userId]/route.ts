// src/app/api/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as any;
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const isCommish = currentUser.role === 'COMMISH' || currentUser.role === 'ADMIN';
  const isPrimaryManagerOfTeam = currentUser.teamId === targetUser.teamId && currentUser.isPrimaryManager;

  if (!isCommish && !isPrimaryManagerOfTeam) {
    return NextResponse.json({ error: 'Unauthorized to modify this user' }, { status: 403 });
  }

  try {
    const { action } = await req.json();

    if (action === 'REMOVE_FROM_TEAM') {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          teamId: null, 
          isPrimaryManager: false 
        }
      });
      return NextResponse.json({ message: 'User removed from franchise.' });
    }

    if (action === 'TOGGLE_PRIMARY') {
      await prisma.user.update({
        where: { id: userId },
        data: { isPrimaryManager: !targetUser.isPrimaryManager }
      });
      return NextResponse.json({ message: 'Primary status toggled successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as any;
  
  if (!currentUser || (currentUser.role !== 'COMMISH' && currentUser.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Only Commissioners can permanently delete users.' }, { status: 403 });
  }

  try {
    const { userId } = await params;
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ message: 'User permanently deleted.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}