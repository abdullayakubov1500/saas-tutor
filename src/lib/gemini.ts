import { GoogleGenAI } from "@google/genai";
import { getLevelTitle } from "@/data/curriculum";
import { synthesizeEdgeRussianSpeech, type TtsVoiceName } from "@/lib/tts";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
export const GEMINI_TTS_MODEL =
  process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function getErrorStatus(err: unknown): number | undefined {
  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = getErrorStatus(err);
      const isTransient = status === 503 || status === 429;
      if (!isTransient || attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
    }
  }
  throw lastError;
}

export function getGeminiHttpError(err: unknown): { status: number; message: string } {
  const code = getErrorStatus(err);
  if (code === 503) {
    return {
      status: 503,
      message:
        "Модель Gemini сейчас испытывает высокую нагрузку (503). Пожалуйста, повторите запрос через несколько секунд.",
    };
  }
  if (code === 429) {
    return {
      status: 429,
      message: "Превышен лимит запросов к Gemini API (429). Подождите немного и попробуйте снова.",
    };
  }
  if (code === 401 || code === 403) {
    return {
      status: code,
      message: "Неверный или неактивный GEMINI_API_KEY.",
    };
  }
  return {
    status: 500,
    message: "Ошибка AI-репетитора. Попробуйте ещё раз.",
  };
}

export function buildTutorSystemPrompt(level: string, mode: string): string {
  const levelLabel = getLevelTitle(level);
  return [
    `Ты — персональный AI-репетитор по русскому языку (Slovo AI).`,
    `Текущий этап ученика: ${levelLabel} (${level}).`,
    `Режим работы: ${mode}.`,
    `Адаптируй сложность лексики, грамматических объяснений и примеров строго под этап «${levelLabel}».`,
    `Отвечай структурированно, дружелюбно и педагогически точно. Выделяй ударения там, где это помогает ученику.`,
  ].join("\n");
}

export async function generateTutorReply(params: {
  level: string;
  mode: "chat" | "grammar" | "quiz" | "listening";
  prompt: string;
  lessonTitle?: string;
}): Promise<{ text: string; isDemo: boolean }> {
  const client = getClient();
  const systemInstruction = buildTutorSystemPrompt(params.level, params.mode);
  const fullPrompt = params.lessonTitle
    ? `Урок: ${params.lessonTitle}\nЗапрос ученика: ${params.prompt}`
    : params.prompt;

  if (!client) {
    return {
      isDemo: true,
      text: `[Демо-режим без GEMINI_API_KEY — модель ${GEMINI_MODEL}]\n\nУровень: ${getLevelTitle(
        params.level
      )}.\nВы спросили: «${params.prompt}».\n\nЧтобы получать живые ответы от ${GEMINI_MODEL}, добавьте GEMINI_API_KEY в файл .env и перезапустите сервер. В рабочем режиме здесь будет подробное объяснение правила, примеры с ударениями и мини-задание.`,
    };
  }

  const response = await callWithRetry(() =>
    client.models.generateContent({
      model: GEMINI_MODEL,
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    })
  );

  return {
    isDemo: false,
    text: response.text ?? "Не удалось получить ответ от модели.",
  };
}

export async function generateProAnalysis(params: {
  level: string;
  type: "pronunciation" | "speaking" | "listening" | "errors";
  textInput?: string;
  audioBase64?: string;
  audioMimeType?: string;
}): Promise<{
  isDemo: boolean;
  summary: string;
  score?: number;
  mistakes?: Array<{ original: string; correction: string; rule: string }>;
  listeningScript?: string;
  listeningQuestion?: string;
}> {
  const client = getClient();

  if (!client) {
    if (params.type === "listening") {
      return {
        isDemo: true,
        summary: `Демо-аудирование (${GEMINI_MODEL}) для уровня «${getLevelTitle(params.level)}».`,
        listeningScript:
          "Доброе утро! Сегодня в Москве прохладная, но солнечная погода. Я собираюсь пойти в библиотеку, чтобы подготовиться к экзамену по русскому языку.",
        listeningQuestion: "Куда собирается пойти диктор и зачем?",
      };
    }

    return {
      isDemo: true,
      score: 86,
      summary: `[Демо-анализ ${GEMINI_MODEL}] Хорошая попытка для уровня «${getLevelTitle(
        params.level
      )}»! Добавьте GEMINI_API_KEY в .env для реального мультимодального анализа речи и ошибок.`,
      mistakes: [
        {
          original: params.textInput || "Пример фразы ученика",
          correction: "Проверьте согласование падежа и место ударения.",
          rule: "В русском языке глагольное управление требует точного выбора предлога и падежного окончания.",
        },
      ],
    };
  }

  const systemInstruction = buildTutorSystemPrompt(params.level, `PRO_${params.type.toUpperCase()}`);

  if (params.type === "listening") {
    const response = await callWithRetry(() =>
      client.models.generateContent({
        model: GEMINI_MODEL,
        contents:
          "Сгенерируй короткий текст для аудирования на русском языке (3-4 предложения, подходящие под уровень ученика) и 1 вопрос на понимание. Верни ответ строго в JSON: {\"listeningScript\": \"...\", \"listeningQuestion\": \"...\", \"summary\": \"...\"}",
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      })
    );
    const parsed = JSON.parse(response.text || "{}");
    return {
      isDemo: false,
      summary: parsed.summary || "Аудирование готово. Нажмите «Озвучить» и ответьте на вопрос.",
      listeningScript: parsed.listeningScript || "",
      listeningQuestion: parsed.listeningQuestion || "",
    };
  }

  const parts: Array<
    | { text: string }
    | { inlineData: { data: string; mimeType: string } }
  > = [
    {
      text:
        params.type === "pronunciation" || params.type === "speaking"
          ? `Проанализируй речь/произношение ученика (текст: "${
              params.textInput || "см. аудио"
            }"). Оцени от 0 до 100, выдели ошибки в ударениях, звуках и грамматике. Верни JSON: {"score": number, "summary": string, "mistakes": [{"original": string, "correction": string, "rule": string}]}`
          : `Сделай подробный разбор ошибок следующего русского текста: "${
              params.textInput || ""
            }". Оцени от 0 до 100. Верни JSON: {"score": number, "summary": string, "mistakes": [{"original": string, "correction": string, "rule": string}]}`,
    },
  ];

  if (params.audioBase64 && params.audioMimeType) {
    parts.push({
      inlineData: {
        data: params.audioBase64,
        mimeType: params.audioMimeType,
      },
    });
  }

  const response = await callWithRetry(() =>
    client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    })
  );

  const parsed = JSON.parse(response.text || "{}");
  return {
    isDemo: false,
    score: typeof parsed.score === "number" ? parsed.score : 85,
    summary: parsed.summary || "Анализ выполнен.",
    mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
  };
}

export type { TtsVoiceName };

/**
 * Генерирует естественную русскую речь (Neural TTS) с выбранным диктором.
 */
export async function synthesizeRussianSpeech(
  text: string,
  voiceName: TtsVoiceName = "Aoede"
): Promise<{ audioBuffer: Buffer; mimeType: string } | null> {
  return synthesizeEdgeRussianSpeech(text, voiceName);
}
