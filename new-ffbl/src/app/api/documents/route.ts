import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const documents = await prisma.leagueDocument.findMany({
      orderBy: { updatedAt: "desc" },
      include: { updatedBy: { select: { name: true } } }
    });
    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    if (!userId || (userRole !== "COMMISH" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug, content } = body;

    const document = await prisma.leagueDocument.create({
      data: { 
        title, 
        slug, 
        content,
        updatedById: userId 
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    if (!userId || (userRole !== "COMMISH" && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, slug, content } = body;

    const document = await prisma.leagueDocument.update({
      where: { id },
      data: { 
        title, 
        slug, 
        content,
        updatedById: userId
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}