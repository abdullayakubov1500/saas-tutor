"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Crown, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PricingCardsProps {
  currentPlan?: string | null;
  isAuthenticated?: boolean;
}

export function PricingCards({ currentPlan, isAuthenticated }: PricingCardsProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCheckout() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось перейти к оплате");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Ошибка соединения со Stripe");
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось открыть управление подпиской");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Ошибка соединения со Stripe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="mx-auto max-w-2xl rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* FREE PLAN */}
        <Card className="flex flex-col justify-between border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Базовый старт</Badge>
              <span className="text-2xl font-bold text-foreground">\$0 / мес</span>
            </div>
            <CardTitle className="mt-3 text-4xl">Free</CardTitle>
            <CardDescription>
              Ежедневная база для знакомства с русским языком и закрепления правил.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "10 минут практики в день (сброс в полночь 00:00)",
              "5 бесплатных уроков по базовым темам",
              "Интерактивные квизы и практические задачи",
              "Проверка грамматики и правописания",
              "Выбор этапа: Начальный, Средний, Продвинутый, Эксперт",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#86612F]" />
                <span>{item}</span>
              </div>
            ))}
            {[
              "Проверка произношения (аудио)",
              "Speaking и Listening тренажёры",
              "Подробный разбор ошибок",
            ].map((locked) => (
              <div key={locked} className="flex items-start gap-2.5 text-muted-foreground opacity-70">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{locked}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            {isAuthenticated ? (
              <Link href="/learn" className="w-full">
                <Button variant="outline" className="w-full">
                  {currentPlan === "FREE" ? "Текущий тариф — Перейти к урокам" : "Перейти к урокам"}
                </Button>
              </Link>
            ) : (
              <Link href="/auth" className="w-full">
                <Button variant="outline" className="w-full">
                  Начать бесплатно
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>

        {/* PRO PLAN */}
        <Card className="relative flex flex-col justify-between border-2 border-[#86612F] shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="pro" className="gap-1">
                <Crown className="h-3.5 w-3.5" /> Полный доступ
              </Badge>
              <span className="text-2xl font-bold text-foreground">\$19 / мес</span>
            </div>
            <CardTitle className="mt-3 text-4xl">Pro</CardTitle>
            <CardDescription>
              Безлимитный AI-репетитор на базе Gemini 3.5 Flash Lite с голосом и разбором ошибок.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "Неограниченное время использования без дневных лимитов",
              "Все уроки всех 4 уровней (Начальный → Эксперт)",
              "Проверка произношения и ударений (аудиоанализ)",
              "Speaking — разговорная практика с AI-репетитором",
              "Listening — аудирование с озвучкой и вопросами",
              "Подробный разбор ошибок с правилами и примерами",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#86612F]" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            {!isAuthenticated ? (
              <Link href="/auth?redirect=/pricing" className="w-full">
                <Button className="w-full">Войти и подключить Pro</Button>
              </Link>
            ) : currentPlan === "PRO" ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={handlePortal}
                disabled={loading}
              >
                {loading ? "Открытие Stripe..." : "Управлять подпиской (Stripe)"}
              </Button>
            ) : (
              <Button className="w-full" onClick={handleCheckout} disabled={loading}>
                {loading ? "Переход в Stripe..." : "Перейти на Pro через Stripe"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
