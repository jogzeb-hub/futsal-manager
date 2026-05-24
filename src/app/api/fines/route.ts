import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const where = year
    ? { date: { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year) + 1}-01-01`) } }
    : {};

  const fines = await prisma.fine.findMany({
    where,
    include: { player: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(fines);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { playerId, amount, reason } = await req.json();
  const fine = await prisma.fine.create({
    data: { playerId, amount, reason },
    include: { player: true },
  });
  return NextResponse.json(fine, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id, paid } = await req.json();
  const fine = await prisma.fine.update({
    where: { id },
    data: { paid },
    include: { player: true },
  });
  return NextResponse.json(fine);
}
