import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const where = year
    ? { injuryDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year) + 1}-01-01`) } }
    : {};

  const injuries = await prisma.injury.findMany({
    where,
    include: { player: true },
    orderBy: { injuryDate: "desc" },
  });
  return NextResponse.json(injuries);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { playerId, description, injuryDate, recoveryDate } = await req.json();
  const injury = await prisma.injury.create({
    data: {
      playerId,
      description,
      injuryDate: injuryDate ? new Date(injuryDate) : new Date(),
      recoveryDate: recoveryDate ? new Date(recoveryDate) : null,
    },
    include: { player: true },
  });
  return NextResponse.json(injury, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { id, description, injuryDate, recoveryDate } = body;
  const data: Record<string, unknown> = {};
  if (description !== undefined) data.description = description;
  if (injuryDate !== undefined) data.injuryDate = new Date(injuryDate);
  if ("recoveryDate" in body) data.recoveryDate = recoveryDate ? new Date(recoveryDate) : null;

  const injury = await prisma.injury.update({
    where: { id },
    data,
    include: { player: true },
  });
  return NextResponse.json(injury);
}
