import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.injury.delete({ where: { id: Number(id) } });
  return new NextResponse(null, { status: 204 });
}
