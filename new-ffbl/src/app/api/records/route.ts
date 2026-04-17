import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Helper to check Commish/Admin auth
async function isAuthorized() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  return role === "COMMISH" || role === "ADMIN";
}

export async function GET() {
  try {
    const records = await prisma.leagueRecord.findMany({
      orderBy: [
        { type: 'asc' },
        { title: 'asc' },
        { yearSet: 'desc' }
      ]
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { type, title, value, yearSet, recordHolder } = body;

    const record = await prisma.leagueRecord.create({
      data: {
        type,
        title,
        value,
        yearSet: yearSet ? parseInt(yearSet) : null,
        recordHolder,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, type, title, value, yearSet, recordHolder } = body;

    const record = await prisma.leagueRecord.update({
      where: { id },
      data: {
        type,
        title,
        value,
        yearSet: yearSet ? parseInt(yearSet) : null,
        recordHolder,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await prisma.leagueRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}