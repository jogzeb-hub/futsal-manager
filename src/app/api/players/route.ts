import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const dateFilter = year
    ? { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year) + 1}-01-01`) }
    : undefined;

  const allPlayerBallonDors = await prisma.ballonDor.findMany();

  const players = await prisma.player.findMany({
    include: {
      matches: {
        include: { match: true },
        ...(dateFilter ? { where: { match: { date: dateFilter } } } : {}),
      },
      injuries: { where: { recoveryDate: null } },
      fines: {
        ...(dateFilter ? { where: { date: dateFilter } } : {}),
      },
      moms: {
        orderBy: { round: "asc" },
        ...(dateFilter ? { where: { OR: [{ date: dateFilter }, { date: null }] } } : {}),
      },
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
      momCount: player.moms.length,
      momDates: player.moms.map((m) => m.date ? m.date.toISOString().split("T")[0] : null).filter(Boolean) as string[],
      totalFines,
      unpaidFines,
      hasInjury: player.injuries.length > 0,
      ballonDorYears: allPlayerBallonDors
        .filter((bd) => bd.playerId === player.id)
        .map((bd) => bd.year)
        .sort((a, b) => b - a),
      injuryDays: player.injuries.length > 0
        ? Math.round((Date.now() - player.injuries[0].injuryDate.getTime()) / (1000 * 60 * 60 * 24))
        : null,
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
