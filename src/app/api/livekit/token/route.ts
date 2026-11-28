import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessProFeature } from "@/lib/usage";
import { createListeningToken, getLiveKitConfig } from "@/lib/livekit";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    if (!canAccessProFeature(user.plan)) {
      return NextResponse.json(
        { error: "LiveKit-озвучка доступна только на тарифе Pro", upgradeRequired: true },
        { status: 403 }
      );
    }

    const { isConfigured } = getLiveKitConfig();
    if (!isConfigured) {
      return NextResponse.json(
        {
          error:
            "LiveKit не настроен. Укажите LIVEKIT_URL, LIVEKIT_API_KEY и LIVEKIT_API_SECRET в .env",
          configured: false,
        },
        { status: 503 }
      );
    }

    const roomName = `slovo-listening-${user.id}`;
    const credentials = await createListeningToken({
      userId: user.id,
      userName: user.name,
      roomName,
    });

    return NextResponse.json({ ...credentials, configured: true });
  } catch (err) {
    console.error("LiveKit token error:", err);
    return NextResponse.json({ error: "Ошибка создания LiveKit токена" }, { status: 500 });
  }
}
