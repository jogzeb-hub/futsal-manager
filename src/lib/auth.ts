import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token || token !== ADMIN_SECRET) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
  }
  return null;
}
