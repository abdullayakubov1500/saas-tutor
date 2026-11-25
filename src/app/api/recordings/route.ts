import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecordingUrl } from "@/lib/storage";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const recordings = await prisma.speechRecording.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        objectKey: true,
        mimeType: true,
        score: true,
        summary: true,
        createdAt: true,
      },
    });

    const items = await Promise.all(
      recordings.map(async (rec) => ({
        ...rec,
        url: await getRecordingUrl(rec.objectKey),
      }))
    );

    return NextResponse.json({ recordings: items });
  } catch (err) {
    console.error("Recordings list error:", err);
    return NextResponse.json({ error: "Ошибка загрузки записей" }, { status: 500 });
  }
}
