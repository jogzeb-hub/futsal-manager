import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const injuries = await prisma.injury.findMany({
    include: { player: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(injuries);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { playerId, description } = await req.json();
  const injury = await prisma.injury.create({
    data: { playerId, description },
    include: { player: true },
  });
  return NextResponse.json(injury, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id, recovered, description } = await req.json();
  const data: { recovered?: boolean; description?: string } = {};
  if (recovered !== undefined) data.recovered = recovered;
  if (description !== undefined) data.description = description;

  const injury = await prisma.injury.update({
    where: { id },
    data,
    include: { player: true },
  });
  return NextResponse.json(injury);
}
