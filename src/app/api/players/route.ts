import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const players = await prisma.player.findMany({
    include: {
      matches: { include: { match: true } },
      injuries: true,
      fines: true,
      mvpAwards: true,
    },
    orderBy: { name: "asc" },
  });

  const playersWithStats = players.map((player) => {
    const totalMatches = player.matches.length;
    const wins = player.matches.filter((mp) => {
      const match = mp.match;
      return (
        (mp.team === "A" && match.result === "A") ||
        (mp.team === "B" && match.result === "B")
      );
    }).length;
    const draws = player.matches.filter(
      (mp) => mp.match.result === "draw"
    ).length;
    const losses = totalMatches - wins - draws;
    const totalFines = player.fines.reduce((sum, f) => sum + f.amount, 0);
    const unpaidFines = player.fines
      .filter((f) => !f.paid)
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      id: player.id,
      name: player.name,
      nickname: player.nickname,
      totalMatches,
      wins,
      draws,
      losses,
      mvpCount: player.mvpAwards.length,
      totalFines,
      unpaidFines,
      hasInjury: player.injuries.some((i) => !i.recovered),
      createdAt: player.createdAt,
    };
  });

  return NextResponse.json(playersWithStats);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { name, nickname } = await req.json();
  if (!name) return NextResponse.json({ error: "이름 필수" }, { status: 400 });

  const player = await prisma.player.create({ data: { name, nickname } });
  return NextResponse.json(player, { status: 201 });
}
