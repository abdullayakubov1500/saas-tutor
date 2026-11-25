import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateTutorReply, getGeminiHttpError } from "@/lib/gemini";
import { getUserUsageStatus, incrementUserUsage } from "@/lib/usage";

const chatSchema = z.object({
  mode: z.enum(["chat", "grammar", "quiz", "listening"]),
  prompt: z.string().min(1, "Введите сообщение"),
  lessonTitle: z.string().optional(),
  tzOffset: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Некорректный запрос" },
        { status: 400 }
      );
    }

    const tzOffset = parsed.data.tzOffset ?? 0;
    const usage = await getUserUsageStatus(user.id, user.plan, tzOffset);
    if (usage.isLimitReached) {
      return NextResponse.json(
        {
          error:
            "Дневной лимит 10 минут на тарифе Free исчерпан. Он обновится в полночь, или перейдите на Pro для безлимита.",
          usage,
        },
        { status: 403 }
      );
    }

    const reply = await generateTutorReply({
      level: user.level,
      mode: parsed.data.mode,
      prompt: parsed.data.prompt,
      lessonTitle: parsed.data.lessonTitle,
    });

    const updatedUsage = await incrementUserUsage(user.id, user.plan, 15, tzOffset);

    return NextResponse.json({
      reply: reply.text,
      isDemo: reply.isDemo,
      usage: updatedUsage,
    });
  } catch (err) {
    console.error("Tutor chat error:", err);
    const { status, message } = getGeminiHttpError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
