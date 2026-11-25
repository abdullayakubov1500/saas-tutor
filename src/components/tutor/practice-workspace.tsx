"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Crown,
  Lock,
  Mic,
  Send,
  Sparkles,
  Square,
  Volume2,
  XCircle,
} from "lucide-react";
import { LESSONS, LEVELS, type Lesson, type LevelId } from "@/data/curriculum";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface UsageState {
  plan: "FREE" | "PRO";
  secondsUsed: number;
  dailyLimitSeconds: number | null;
  remainingSeconds: number | null;
  isLimitReached: boolean;
  secondsUntilReset: number;
}

interface PracticeWorkspaceProps {
  initialUser: {
    id: string;
    name: string;
    email: string;
    plan: string;
    level: string;
  };
  initialUsage: UsageState;
}

function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs}ч ${String(mins).padStart(2, "0")}м`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function PracticeWorkspace({ initialUser, initialUsage }: PracticeWorkspaceProps) {
  const [level, setLevel] = React.useState<LevelId>(
    (initialUser.level as LevelId) || "BEGINNER"
  );
  const [usage, setUsage] = React.useState<UsageState>(initialUsage);
  const [selectedLesson, setSelectedLesson] = React.useState<Lesson>(
    LESSONS.find((l) => l.level === initialUser.level) || LESSONS[0]
  );

  // Chat & Grammar state
  const [chatInput, setChatInput] = React.useState("");
  const [chatReply, setChatReply] = React.useState<string | null>(null);
  const [grammarInput, setGrammarInput] = React.useState("");
  const [grammarReply, setGrammarReply] = React.useState<string | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = React.useState<Record<number, number>>({});

  // Pro features state
  const [proText, setProText] = React.useState("");
  const [voiceName, setVoiceName] = React.useState<"Aoede" | "Kore" | "Puck" | "Charon">("Aoede");
  const [playbackSpeed, setPlaybackSpeed] = React.useState<0.75 | 1 | 1.15>(1);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [proResult, setProResult] = React.useState<{
    score?: number;
    summary: string;
    mistakes?: Array<{ original: string; correction: string; rule: string }>;
    listeningScript?: string;
    listeningQuestion?: string;
    listeningAudioUrl?: string | null;
  } | null>(null);
  const [recording, setRecording] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const isPro = usage.plan === "PRO";

  // Sync usage with local timezone offset and tick midnight countdown
  React.useEffect(() => {
    const tzOffset = new Date().getTimezoneOffset();
    fetch(`/api/usage?tzOffset=${tzOffset}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUsage(data);
      })
      .catch(() => {});

    const interval = setInterval(() => {
      setUsage((prev) => ({
        ...prev,
        secondsUntilReset: Math.max(0, prev.secondsUntilReset - 1),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Active practice heartbeat (every 30s on Free)
  React.useEffect(() => {
    if (isPro || usage.isLimitReached) return;
    const tzOffset = new Date().getTimezoneOffset();
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seconds: 30, tzOffset }),
        });
        if (res.ok) {
          const updated = await res.json();
          setUsage(updated);
        }
      } catch {
        // ignore network hiccup
      }
    }, 30_000);
    return () => clearInterval(timer);
  }, [isPro, usage.isLimitReached]);

  async function handleLevelChange(nextLevel: LevelId) {
    setLevel(nextLevel);
    const firstInLevel = LESSONS.find((l) => l.level === nextLevel);
    if (firstInLevel) {
      setSelectedLesson(firstInLevel);
      setQuizAnswers({});
      setChatReply(null);
      setGrammarReply(null);
    }
    await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: nextLevel }),
    });
  }

  async function askTutor(mode: "chat" | "grammar", prompt: string) {
    if (!prompt.trim()) return;
    setAiError(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt,
          lessonTitle: selectedLesson.title,
          tzOffset: new Date().getTimezoneOffset(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Ошибка запроса к AI");
        if (data.usage) setUsage(data.usage);
        return;
      }
      if (data.usage) setUsage(data.usage);
      if (mode === "chat") setChatReply(data.reply);
      if (mode === "grammar") setGrammarReply(data.reply);
    } catch {
      setAiError("Ошибка соединения с сервером");
    } finally {
      setAiLoading(false);
    }
  }

  async function runProAnalysis(
    type: "pronunciation" | "speaking" | "listening" | "errors",
    audioBase64?: string,
    audioMimeType?: string
  ) {
    setAiError(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/tutor/pro-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          textInput: proText,
          audioBase64,
          audioMimeType,
          voiceName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Ошибка Pro-анализа");
        return;
      }
      setProResult(data);
    } catch {
      setAiError("Ошибка соединения");
    } finally {
      setAiLoading(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = String(reader.result || "").split(",")[1];
          if (base64) {
            runProAnalysis("pronunciation", base64, "audio/webm");
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setAiError("Не удалось получить доступ к микрофону браузера.");
    }
  }

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, proResult?.listeningAudioUrl]);

  function speakRussian(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ru-RU";
    utter.rate = playbackSpeed;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith("ru") && /natural|google|yandex|neural/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("ru"));
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
  }

  const lessonLocked = !isPro && !selectedLesson.isFree;
  const freeRemainingPct =
    usage.dailyLimitSeconds && usage.remainingSeconds !== null
      ? Math.round((usage.remainingSeconds / usage.dailyLimitSeconds) * 100)
      : 100;

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-6">
      {/* Top Bar: Level Stages & Usage Timer */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl">Этап изучения языка</CardTitle>
            <CardDescription>
              Выберите ваш уровень — AI-репетитор адаптирует сложность и программу.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <Button
                key={l.id}
                variant={level === l.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleLevelChange(l.id)}
              >
                {l.title} ({l.cefr})
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className={usage.isLimitReached ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#86612F]" />
                {isPro ? "Тариф Pro" : "Дневной лимит Free"}
              </span>
              <Badge variant={isPro ? "pro" : "secondary"}>
                {isPro ? "Безлимит" : "10 мин / день"}
              </Badge>
            </div>
            <div className="text-2xl font-bold pt-1">
              {isPro
                ? "Неограниченно"
                : `${formatDuration(usage.remainingSeconds ?? 0)} осталось`}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!isPro && (
              <>
                <Progress value={freeRemainingPct} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Сброс в полночь (00:00)</span>
                  <span>через {formatDuration(usage.secondsUntilReset)}</span>
                </div>
              </>
            )}
            {!isPro && (
              <Link href="/pricing" className="block pt-1">
                <Button size="sm" className="w-full gap-1.5">
                  <Crown className="h-3.5 w-3.5" /> Открыть Pro (Безлимит)
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {aiError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {aiError}
        </div>
      )}

      {/* Main Split: Lessons List + Practice Area */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-3xl px-1">Программа уроков</h2>
          <div className="space-y-2.5">
            {LESSONS.map((lesson) => {
              const active = selectedLesson.slug === lesson.slug;
              const locked = !isPro && !lesson.isFree;
              return (
                <button
                  key={lesson.slug}
                  type="button"
                  onClick={() => {
                    setSelectedLesson(lesson);
                    setQuizAnswers({});
                    setChatReply(null);
                    setGrammarReply(null);
                  }}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                    active
                      ? "border-[#86612F] bg-card shadow-sm"
                      : "border-border bg-card/60 hover:bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="outline" className="text-[11px]">
                      {lesson.category}
                    </Badge>
                    {lesson.isFree ? (
                      <Badge variant="secondary" className="text-[11px]">
                        Бесплатно
                      </Badge>
                    ) : (
                      <Badge variant="pro" className="text-[11px] gap-1">
                        {locked && <Lock className="h-3 w-3" />} Pro
                      </Badge>
                    )}
                  </div>
                  <div className="font-medium text-sm text-foreground">{lesson.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {lesson.summary}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-3xl sm:text-4xl">{selectedLesson.title}</CardTitle>
                  <CardDescription className="mt-1">{selectedLesson.summary}</CardDescription>
                </div>
                <Badge variant={selectedLesson.isFree ? "secondary" : "pro"}>
                  {selectedLesson.isFree ? "5 бесплатных уроков" : "Урок Pro"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {lessonLocked ? (
                <div className="rounded-xl border border-[#86612F]/40 bg-muted/40 p-8 text-center space-y-4">
                  <Crown className="mx-auto h-10 w-10 text-[#86612F]" />
                  <h3 className="text-3xl">Этот урок доступен на тарифе Pro</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    На тарифе Free открыты 5 базовых уроков, квизы, грамматика и правописание.
                    Подключите Pro, чтобы открыть все уровни, Speaking, Listening и проверку произношения.
                  </p>
                  <Link href="/pricing">
                    <Button className="gap-2">
                      <Sparkles className="h-4 w-4" /> Перейти на Pro
                    </Button>
                  </Link>
                </div>
              ) : (
                <Tabs defaultValue="lesson">
                  <TabsList className="w-full">
                    <TabsTrigger value="lesson">Урок и задача</TabsTrigger>
                    <TabsTrigger value="grammar">Грамматика</TabsTrigger>
                    <TabsTrigger value="quiz">Квиз</TabsTrigger>
                    <TabsTrigger value="speaking">
                      Speaking & Произношение {!isPro && <Lock className="h-3 w-3 ml-1" />}
                    </TabsTrigger>
                    <TabsTrigger value="listening">
                      Listening {!isPro && <Lock className="h-3 w-3 ml-1" />}
                    </TabsTrigger>
                    <TabsTrigger value="errors">
                      Разбор ошибок {!isPro && <Lock className="h-3 w-3 ml-1" />}
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1: Lesson & Task */}
                  <TabsContent value="lesson" className="space-y-4">
                    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#86612F]">
                        Правило урока
                      </div>
                      <p className="text-sm leading-relaxed">{selectedLesson.grammarRule}</p>
                    </div>

                    <div className="rounded-xl border border-border p-4 space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Практическая задача
                      </div>
                      <p className="text-sm font-medium">{selectedLesson.taskPrompt}</p>
                      <Textarea
                        placeholder="Напишите ваш ответ на русском языке для проверки AI-репетитором..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <Button
                        disabled={aiLoading || usage.isLimitReached}
                        onClick={() => askTutor("chat", chatInput)}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {aiLoading ? "Проверка..." : "Отправить репетитору"}
                      </Button>
                      {chatReply && (
                        <div className="rounded-xl border border-[#86612F]/30 bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                          {chatReply}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 2: Grammar & Spelling */}
                  <TabsContent value="grammar" className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Введите любую фразу или текст на русском языке — AI проверит грамматику и правописание.
                    </p>
                    <Textarea
                      placeholder="Например: Я пошол в магазин за молоко и хлеб..."
                      value={grammarInput}
                      onChange={(e) => setGrammarInput(e.target.value)}
                    />
                    <Button
                      disabled={aiLoading || usage.isLimitReached}
                      onClick={() =>
                        askTutor(
                          "grammar",
                          `Проверь грамматику и правописание, объясни правила: ${grammarInput}`
                        )
                      }
                    >
                      {aiLoading ? "Анализ..." : "Проверить грамматику и орфографию"}
                    </Button>
                    {grammarReply && (
                      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                        {grammarReply}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 3: Quiz */}
                  <TabsContent value="quiz" className="space-y-4">
                    {selectedLesson.quiz.map((q, qIdx) => {
                      const chosen = quizAnswers[qIdx];
                      return (
                        <div key={q.question} className="rounded-xl border border-border p-4 space-y-3">
                          <div className="font-medium text-sm">
                            {qIdx + 1}. {q.question}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {q.options.map((opt, optIdx) => {
                              const isChosen = chosen === optIdx;
                              const isCorrect = optIdx === q.correctIndex;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))
                                  }
                                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                                    isChosen
                                      ? isCorrect
                                        ? "border-green-600 bg-green-600/10"
                                        : "border-destructive bg-destructive/10"
                                      : "border-border hover:bg-muted"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {chosen !== undefined && (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
                              {chosen === q.correctIndex ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                              )}
                              <span>{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </TabsContent>

                  {/* TAB 4: Speaking & Pronunciation (PRO) */}
                  <TabsContent value="speaking" className="space-y-4">
                    {!isPro ? (
                      <ProUpgradeNotice feature="Проверка произношения и Speaking" />
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Запишите ваш голос или введите фразу, которую вы произнесли, чтобы Gemini 3.5 Flash Lite оценил произношение и ударения.
                        </p>
                        <Textarea
                          placeholder="Что вы хотите произнести? Например: Здравствуйте, рад познакомиться!"
                          value={proText}
                          onChange={(e) => setProText(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant={recording ? "destructive" : "default"}
                            onClick={toggleRecording}
                            className="gap-2"
                          >
                            {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            {recording ? "Остановить запись" : "Записать голос"}
                          </Button>
                          <Button
                            variant="outline"
                            disabled={aiLoading || !proText.trim()}
                            onClick={() => runProAnalysis("speaking")}
                          >
                            Оценить текстовый ответ Speaking
                          </Button>
                        </div>
                        <ProResultBox result={proResult} />
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 5: Listening (PRO) */}
                  <TabsContent value="listening" className="space-y-4">
                    {!isPro ? (
                      <ProUpgradeNotice feature="Listening (Аудирование)" />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Диктор:</span>
                            <select
                              value={voiceName}
                              onChange={(e) =>
                                setVoiceName(e.target.value as "Aoede" | "Kore" | "Puck" | "Charon")
                              }
                              className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground"
                            >
                              <option value="Aoede">Алина (мягкий женский)</option>
                              <option value="Kore">Елена (чёткий женский)</option>
                              <option value="Charon">Дмитрий (спокойный мужской)</option>
                              <option value="Puck">Артём (живой мужской)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted-foreground">Скорость:</span>
                            {([0.75, 1, 1.15] as const).map((spd) => (
                              <Button
                                key={spd}
                                type="button"
                                size="sm"
                                variant={playbackSpeed === spd ? "default" : "outline"}
                                onClick={() => setPlaybackSpeed(spd)}
                              >
                                {spd}x
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Button
                          disabled={aiLoading}
                          onClick={() => runProAnalysis("listening")}
                          className="gap-2"
                        >
                          <Volume2 className="h-4 w-4" />
                          {aiLoading ? "Генерация..." : "Сгенерировать аудио-задание"}
                        </Button>
                        {proResult?.listeningScript && (
                          <div className="rounded-xl border border-border p-4 space-y-3">
                            {proResult.listeningAudioUrl ? (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-[#86612F]">
                                  Нейросетевая озвучка (Gemini TTS)
                                </div>
                                <audio
                                  ref={audioRef}
                                  controls
                                  src={proResult.listeningAudioUrl}
                                  className="w-full"
                                />
                              </div>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => speakRussian(proResult.listeningScript!)}
                                className="gap-2"
                              >
                                <Volume2 className="h-4 w-4" /> Озвучить на русском
                              </Button>
                            )}
                            <p className="text-sm font-medium">
                              Вопрос: {proResult.listeningQuestion}
                            </p>
                            <details className="text-xs text-muted-foreground">
                              <summary className="cursor-pointer">Показать текст скрипта</summary>
                              <p className="mt-2 text-sm text-foreground">
                                {proResult.listeningScript}
                              </p>
                            </details>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 6: Detailed Error Analysis (PRO) */}
                  <TabsContent value="errors" className="space-y-4">
                    {!isPro ? (
                      <ProUpgradeNotice feature="Подробный разбор ошибок" />
                    ) : (
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Вставьте текст или сочинение для глубокого разбора ошибок..."
                          value={proText}
                          onChange={(e) => setProText(e.target.value)}
                        />
                        <Button
                          disabled={aiLoading || !proText.trim()}
                          onClick={() => runProAnalysis("errors")}
                        >
                          {aiLoading ? "Разбор..." : "Сделать подробный разбор ошибок"}
                        </Button>
                        <ProResultBox result={proResult} />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProUpgradeNotice({ feature }: { feature: string }) {
  return (
    <div className="rounded-xl border border-[#86612F]/40 bg-muted/40 p-6 text-center space-y-3">
      <Crown className="mx-auto h-8 w-8 text-[#86612F]" />
      <h4 className="font-display text-3xl">{feature} — функция Pro</h4>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Оформите подписку Pro через Stripe, чтобы разблокировать проверку произношения, Speaking,
        Listening, разбор ошибок и безлимитное время практики.
      </p>
      <Link href="/pricing">
        <Button size="sm">Перейти на Pro</Button>
      </Link>
    </div>
  );
}

function ProResultBox({
  result,
}: {
  result: {
    score?: number;
    summary: string;
    mistakes?: Array<{ original: string; correction: string; rule: string }>;
  } | null;
}) {
  if (!result) return null;
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">Результат AI-анализа</span>
        {typeof result.score === "number" && (
          <Badge variant="pro">Оценка: {result.score} / 100</Badge>
        )}
      </div>
      <p className="text-sm">{result.summary}</p>
      {result.mistakes && result.mistakes.length > 0 && (
        <div className="space-y-2 pt-2">
          {result.mistakes.map((m, idx) => (
            <div key={idx} className="rounded-lg border border-border bg-card p-3 text-xs space-y-1">
              <div>
                <span className="text-destructive line-through mr-2">{m.original}</span>
                <span className="text-green-600 font-semibold">{m.correction}</span>
              </div>
              <div className="text-muted-foreground">{m.rule}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
