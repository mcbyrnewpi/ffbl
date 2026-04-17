import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Resend } from 'resend';
import { AnnouncementEmail } from '@/emails/AnnouncementEmail'; // ⬅️ NEW IMPORT

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        author: { select: { name: true, team: true } }
      },
      take: 20
    });
    return NextResponse.json(announcements);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    const userName = (session?.user as any)?.name || "The Commissioner";

    if (!userId || (userRole !== "COMMISH" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, isPinned, sendEmail } = body;

    const announcement = await prisma.announcement.create({
      data: { 
        title, 
        content,
        isPinned: isPinned || false,
        authorId: userId
      },
    });

    if (sendEmail && resend) {
      let emailList: string[] = [];

      if (process.env.TEST_EMAIL_OVERRIDE) {
        console.log(`🧪 [STAGING OVERRIDE] Sending Announcement to: ${process.env.TEST_EMAIL_OVERRIDE}`);
        emailList = [process.env.TEST_EMAIL_OVERRIDE];
      } else {
        const managers = await prisma.user.findMany({
          where: { email: { not: null } },
          select: { email: true }
        });
        emailList = managers.map(m => m.email as string);
      }

      if (emailList.length > 0) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'FFBL Commish <onboarding@resend.dev>',
          to: emailList,
          subject: `${title}`,
          react: AnnouncementEmail({ 
            title,
            content,
            authorName: userName
          })
        });
        console.log(`Announcement email successfully sent to ${emailList.length} address(es).`);
      }
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Failed to post announcement:", error);
    return NextResponse.json({ error: "Failed to post announcement" }, { status: 500 });
  }
}