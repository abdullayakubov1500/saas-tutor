import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export type TtsVoiceName = "Aoede" | "Kore" | "Puck" | "Charon";

interface VoicePreset {
  voice: string;
  pitch?: string;
  rate?: string;
}

const VOICE_PRESETS: Record<TtsVoiceName, VoicePreset> = {
  Aoede: { voice: "ru-RU-SvetlanaNeural" },
  Kore: { voice: "ru-RU-SvetlanaNeural", pitch: "+4Hz", rate: "+5%" },
  Charon: { voice: "ru-RU-DmitryNeural" },
  Puck: { voice: "ru-RU-DmitryNeural", pitch: "+6Hz", rate: "+6%" },
};

/**
 * Генерирует естественную русскую речь (MP3) через Edge Neural TTS
 * с разными мужскими и женскими голосами.
 */
export async function synthesizeEdgeRussianSpeech(
  text: string,
  voiceName: TtsVoiceName = "Aoede"
): Promise<{ audioBuffer: Buffer; mimeType: string } | null> {
  if (!text.trim()) return null;

  const preset = VOICE_PRESETS[voiceName] ?? VOICE_PRESETS.Aoede;

  try {
    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(
        preset.voice,
        OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
      );

      const options =
        preset.pitch || preset.rate
          ? { pitch: preset.pitch, rate: preset.rate }
          : undefined;

      const { audioStream } = tts.toStream(text, options);
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }

      const audioBuffer = Buffer.concat(chunks);
      if (audioBuffer.length === 0) return null;

      return {
        audioBuffer,
        mimeType: "audio/mpeg",
      };
    } finally {
      tts.close();
    }
  } catch (err) {
    console.warn("Edge Neural TTS error:", err);
    return null;
  }
}
