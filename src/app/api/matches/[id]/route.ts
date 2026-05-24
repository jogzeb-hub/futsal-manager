import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const { date, location, teamAScore, teamBScore, mvpId } = await req.json();

  let result = "draw";
  if (teamAScore > teamBScore) result = "A";
  else if (teamBScore > teamAScore) result = "B";

  const match = await prisma.match.update({
    where: { id: Number(id) },
    data: {
      date: new Date(date),
      location: location || null,
      teamAScore,
      teamBScore,
      result,
      mvpId: mvpId || null,
    },
    include: { mvp: true, players: { include: { player: true } } },
  });
  return NextResponse.json(match);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.match.delete({ where: { id: Number(id) } });
  return new NextResponse(null, { status: 204 });
}
