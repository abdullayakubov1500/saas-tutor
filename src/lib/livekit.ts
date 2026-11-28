import { AccessToken } from "livekit-server-sdk";

export function getLiveKitConfig() {
  const url = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  return {
    url,
    apiKey,
    apiSecret,
    isConfigured: Boolean(url && apiKey && apiSecret),
  };
}

export async function createListeningToken(params: {
  userId: string;
  userName: string;
  roomName: string;
}): Promise<{ token: string; url: string; roomName: string }> {
  const { url, apiKey, apiSecret, isConfigured } = getLiveKitConfig();
  if (!isConfigured || !url || !apiKey || !apiSecret) {
    throw new Error("LiveKit не настроен");
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: `student-${params.userId}`,
    name: params.userName,
    ttl: "1h",
  });

  token.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return {
    token: await token.toJwt(),
    url,
    roomName: params.roomName,
  };
}
