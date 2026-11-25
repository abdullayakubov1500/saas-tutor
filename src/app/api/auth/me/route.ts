import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}

const updateLevelSchema = z.object({
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateLevelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный уровень" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { level: parsed.data.level },
    select: { id: true, email: true, name: true, plan: true, level: true },
  });

  return NextResponse.json({ user: updated });
}
