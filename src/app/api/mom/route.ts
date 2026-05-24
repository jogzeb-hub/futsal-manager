import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");

  const where = year
    ? {
        OR: [
          { date: { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year) + 1}-01-01`) } },
          { date: null },
        ],
      }
    : {};

  const moms = await prisma.mOM.findMany({
    where,
    include: { player: true },
    orderBy: { round: "asc" },
  });
  return NextResponse.json(moms);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { round, date, playerId } = await req.json();
  const mom = await prisma.mOM.create({
    data: {
      round,
      date: date ? new Date(date) : null,
      playerId,
    },
    include: { player: true },
  });
  return NextResponse.json(mom, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { id, round, date, playerId } = body;
  const data: Record<string, unknown> = {};
  if (round !== undefined) data.round = round;
  if (playerId !== undefined) data.playerId = playerId;
  if ("date" in body) data.date = date ? new Date(date) : null;

  const mom = await prisma.mOM.update({
    where: { id },
    data,
    include: { player: true },
  });
  return NextResponse.json(mom);
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await req.json();
  await prisma.mOM.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
