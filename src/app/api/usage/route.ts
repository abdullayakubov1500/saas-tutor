import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getUserUsageStatus, incrementUserUsage } from "@/lib/usage";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const url = new URL(request.url);
  const tzOffset = Number(url.searchParams.get("tzOffset") || "0");
  const status = await getUserUsageStatus(
    user.id,
    user.plan,
    Number.isFinite(tzOffset) ? tzOffset : 0
  );

  return NextResponse.json(status);
}

const heartbeatSchema = z.object({
  seconds: z.number().min(1).max(120),
  tzOffset: z.number().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = heartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const status = await incrementUserUsage(
    user.id,
    user.plan,
    parsed.data.seconds,
    parsed.data.tzOffset ?? 0
  );

  return NextResponse.json(status);
}
