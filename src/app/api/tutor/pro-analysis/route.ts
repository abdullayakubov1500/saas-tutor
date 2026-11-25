import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateProAnalysis, getGeminiHttpError } from "@/lib/gemini";
import { canAccessProFeature } from "@/lib/usage";

const proSchema = z.object({
  type: z.enum(["pronunciation", "speaking", "listening", "errors"]),
  textInput: z.string().optional(),
  audioBase64: z.string().optional(),
  audioMimeType: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    if (!canAccessProFeature(user.plan)) {
      return NextResponse.json(
        {
          error:
            "Проверка произношения, Speaking, Listening и разбор ошибок доступны только на тарифе Pro.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = proSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const result = await generateProAnalysis({
      level: user.level,
      type: parsed.data.type,
      textInput: parsed.data.textInput,
      audioBase64: parsed.data.audioBase64,
      audioMimeType: parsed.data.audioMimeType,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Pro analysis error:", err);
    const { status, message } = getGeminiHttpError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
