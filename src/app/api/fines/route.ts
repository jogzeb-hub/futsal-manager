import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const fines = await prisma.fine.findMany({
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
