import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");

  if (year) {
    const winner = await prisma.ballonDor.findUnique({
      where: { year: Number(year) },
      include: { player: true },
    });
    return NextResponse.json(winner);
  }

  const all = await prisma.ballonDor.findMany({
    include: { player: true },
    orderBy: { year: "desc" },
  });
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { year, playerId } = await req.json();
  const winner = await prisma.ballonDor.upsert({
    where: { year },
    update: { playerId },
    create: { year, playerId },
    include: { player: true },
  });
  return NextResponse.json(winner);
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  await prisma.ballonDor.delete({ where: { year } });
  return new NextResponse(null, { status: 204 });
}
