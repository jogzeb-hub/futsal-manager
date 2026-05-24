import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const injuries = await prisma.injury.findMany({
    include: { player: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(injuries);
}

export async function POST(req: NextRequest) {
  const { playerId, description } = await req.json();
  const injury = await prisma.injury.create({
    data: { playerId, description },
    include: { player: true },
  });
  return NextResponse.json(injury, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, recovered } = await req.json();
  const injury = await prisma.injury.update({
    where: { id },
    data: { recovered },
    include: { player: true },
  });
  return NextResponse.json(injury);
}
