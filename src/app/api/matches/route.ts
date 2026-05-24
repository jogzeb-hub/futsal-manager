import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const matches = await prisma.match.findMany({
    include: {
      mvp: true,
      players: { include: { player: true } },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { date, location, teamA, teamB, teamAScore, teamBScore, mvpId } = await req.json();

  let result = "draw";
  if (teamAScore > teamBScore) result = "A";
  else if (teamBScore > teamAScore) result = "B";

  const match = await prisma.match.create({
    data: {
      date: new Date(date),
      location,
      teamAScore,
      teamBScore,
      result,
      mvpId: mvpId || null,
      players: {
        create: [
          ...teamA.map((id: number) => ({ playerId: id, team: "A" })),
          ...teamB.map((id: number) => ({ playerId: id, team: "B" })),
        ],
      },
    },
    include: { mvp: true, players: { include: { player: true } } },
  });

  return NextResponse.json(match, { status: 201 });
}
