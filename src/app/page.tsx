import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Mic, Sparkles, Volume2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LEVELS } from "@/data/curriculum";
import { Navbar } from "@/components/navbar";
import { PricingCards } from "@/components/pricing-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const instant = false;

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar user={user} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-muted/50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-6">
            <Badge variant="pro" className="px-3.5 py-1 text-xs">
              AI-репетитор на базе gemini-3.5-flash-lite
            </Badge>
            <h1 className="font-display text-5xl sm:text-7xl text-foreground leading-tight">
              Изучайте русский язык с персональным AI-наставником
            </h1>
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
              От первых приветствий до академической риторики. Грамматика, правописание, квизы,
              проверка произношения, Speaking и Listening в одном элегантном пространстве.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href={user ? "/learn" : "/auth"}>
                <Button size="lg" className="gap-2">
                  {user ? "Перейти к занятиям" : "Начать 10 минут бесплатно"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">
                  Сравнить Free и Pro
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 4 Stages of Language Learning */}
        <section className="py-16 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <h2 className="font-display text-4xl sm:text-5xl">Четыре этапа мастерства</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              AI-репетитор автоматически адаптирует лексику, правила и задания под ваш текущий этап.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map((lvl, idx) => (
              <Card key={lvl.id} className="border-border hover:border-[#86612F]/60 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Этап {idx + 1}</Badge>
                    <span className="text-xs font-semibold text-[#86612F]">{lvl.cefr}</span>
                  </div>
                  <CardTitle className="mt-2 text-3xl">{lvl.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{lvl.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="border-y border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <BookOpen className="h-6 w-6 text-[#86612F]" />
              <h3 className="text-2xl">5 уроков бесплатно</h3>
              <p className="text-sm text-muted-foreground">
                Базовые темы, грамматика, правописание и квизы с ежедневным сбросом 10 минут в полночь.
              </p>
            </div>
            <div className="space-y-2">
              <Mic className="h-6 w-6 text-[#86612F]" />
              <h3 className="text-2xl">Speaking & Произношение</h3>
              <p className="text-sm text-muted-foreground">
                Запись голоса и мультимодальный разбор ударений и артикуляции в тарифе Pro.
              </p>
            </div>
            <div className="space-y-2">
              <Volume2 className="h-6 w-6 text-[#86612F]" />
              <h3 className="text-2xl">Listening</h3>
              <p className="text-sm text-muted-foreground">
                Живые диалоги для восприятия русской речи на слух с проверкой понимания.
              </p>
            </div>
            <div className="space-y-2">
              <CheckCircle2 className="h-6 w-6 text-[#86612F]" />
              <h3 className="text-2xl">Разбор ошибок</h3>
              <p className="text-sm text-muted-foreground">
                Детальный анализ каждого предложения с объяснением правил и примерами.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <h2 className="font-display text-4xl sm:text-5xl">Тарифные планы</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Начните бесплатно и переходите на Pro через Stripe в любой момент.
            </p>
          </div>
          <PricingCards currentPlan={user?.plan} isAuthenticated={Boolean(user)} />
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#86612F]" /> Slovo AI — Персональный AI-репетитор по русскому языку
          </span>
          <span>Powered by Next.js, shadcn/ui, Stripe & gemini-3.5-flash-lite</span>
        </div>
      </footer>
    </div>
  );
}
