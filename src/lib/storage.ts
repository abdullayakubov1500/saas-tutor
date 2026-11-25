import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

const BUCKET_NAME = "uploads";

let cachedFiles: Files | null = null;

export function getUploadsStorage(): Files | null {
  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_ENDPOINT_URL_S3
  ) {
    return null;
  }

  if (!cachedFiles) {
    cachedFiles = new Files({
      adapter: neon({ bucket: BUCKET_NAME }),
    });
  }

  return cachedFiles;
}

export async function uploadSpeechAudio(params: {
  userId: string;
  audioBase64: string;
  mimeType: string;
}): Promise<{ objectKey: string; signedUrl: string } | null> {
  const storage = getUploadsStorage();
  if (!storage) return null;

  const ext = params.mimeType.includes("mp4") ? "m4a" : "webm";
  const objectKey = `recordings/${params.userId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(params.audioBase64, "base64");

  await storage.upload(objectKey, buffer, {
    contentType: params.mimeType,
  });

  const signedUrl = await storage.url(objectKey, { expiresIn: 3600 });
  return { objectKey, signedUrl };
}

export async function getRecordingUrl(objectKey: string): Promise<string | null> {
  const storage = getUploadsStorage();
  if (!storage) return null;
  return storage.url(objectKey, { expiresIn: 3600 });
}

export async function uploadListeningAudio(params: {
  userId: string;
  audioBuffer: Buffer;
  mimeType: string;
}): Promise<{ objectKey: string; signedUrl: string } | null> {
  const storage = getUploadsStorage();
  if (!storage) return null;

  const ext = params.mimeType.includes("mpeg") ? "mp3" : "wav";
  const objectKey = `listening/${params.userId}/${Date.now()}.${ext}`;

  await storage.upload(objectKey, params.audioBuffer, {
    contentType: params.mimeType,
  });

  const signedUrl = await storage.url(objectKey, { expiresIn: 3600 });
  return { objectKey, signedUrl };
}
