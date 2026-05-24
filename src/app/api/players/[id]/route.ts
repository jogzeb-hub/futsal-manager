import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, nickname } = await req.json();
  const player = await prisma.player.update({
    where: { id: Number(id) },
    data: { name, nickname },
  });
  return NextResponse.json(player);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.matchPlayer.deleteMany({ where: { playerId: Number(id) } });
  await prisma.fine.deleteMany({ where: { playerId: Number(id) } });
  await prisma.injury.deleteMany({ where: { playerId: Number(id) } });
  await prisma.match.updateMany({ where: { mvpId: Number(id) }, data: { mvpId: null } });
  await prisma.player.delete({ where: { id: Number(id) } });
  return new NextResponse(null, { status: 204 });
}
