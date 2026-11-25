import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUploadsStorage } from "@/lib/storage";

export async function GET() {
  const postgresOk = await prisma
    .$queryRaw`SELECT 1 AS ok`
    .then(() => true)
    .catch(() => false);

  const storage = getUploadsStorage();
  const storageOk = storage
    ? await storage
        .list({ prefix: "recordings/" })
        .then(() => true)
        .catch(() => false)
    : false;

  const status = postgresOk && storageOk ? 200 : 503;

  return NextResponse.json(
    {
      ok: postgresOk && storageOk,
      postgres: postgresOk ? "connected" : "error",
      objectStorage: storageOk ? "connected" : "error",
      branch: process.env.NEON_BRANCH ?? null,
    },
    { status }
  );
}
