import { prisma } from "@/lib/prisma";

export const FREE_DAILY_LIMIT_SECONDS = 10 * 60; // 10 минут практики в день
export const FREE_LESSON_LIMIT = 5; // 5 бесплатных уроков

export type PlanType = "FREE" | "PRO";

/**
 * Возвращает ключ текущих суток (YYYY-MM-DD) с учетом смещения часового пояса клиента.
 * Сброс происходит ровно в 00:00 (полночь) по местному времени пользователя.
 */
export function getDateKeyForNow(now = new Date(), tzOffsetMinutes = 0): string {
  const shifted = new Date(now.getTime() - tzOffsetMinutes * 60_000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Сколько секунд осталось до ближайшей полуночи (00:00).
 */
export function getSecondsUntilMidnight(now = new Date(), tzOffsetMinutes = 0): number {
  const shifted = new Date(now.getTime() - tzOffsetMinutes * 60_000);
  const nextMidnight = new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  return Math.max(1, Math.ceil((nextMidnight.getTime() - shifted.getTime()) / 1000));
}

export function calculateRemainingSeconds(plan: string, secondsUsed: number): number | null {
  if (plan === "PRO") return null; // Неограниченное время
  return Math.max(0, FREE_DAILY_LIMIT_SECONDS - secondsUsed);
}

export function canAccessLesson(plan: string, isFreeLesson: boolean): boolean {
  if (plan === "PRO") return true;
  return isFreeLesson;
}

export function canAccessProFeature(plan: string): boolean {
  return plan === "PRO";
}

export async function getUserUsageStatus(
  userId: string,
  plan: string,
  tzOffsetMinutes = 0
) {
  const dateKey = getDateKeyForNow(new Date(), tzOffsetMinutes);
  const secondsUntilReset = getSecondsUntilMidnight(new Date(), tzOffsetMinutes);

  if (plan === "PRO") {
    return {
      plan: "PRO" as PlanType,
      dateKey,
      secondsUsed: 0,
      dailyLimitSeconds: null,
      remainingSeconds: null,
      isLimitReached: false,
      secondsUntilReset,
    };
  }

  const record = await prisma.dailyUsage.findUnique({
    where: { userId_dateKey: { userId, dateKey } },
  });

  const secondsUsed = record?.secondsUsed ?? 0;
  const remainingSeconds = Math.max(0, FREE_DAILY_LIMIT_SECONDS - secondsUsed);

  return {
    plan: "FREE" as PlanType,
    dateKey,
    secondsUsed,
    dailyLimitSeconds: FREE_DAILY_LIMIT_SECONDS,
    remainingSeconds,
    isLimitReached: remainingSeconds <= 0,
    secondsUntilReset,
  };
}

export async function incrementUserUsage(
  userId: string,
  plan: string,
  addSeconds: number,
  tzOffsetMinutes = 0
) {
  if (plan === "PRO") {
    return getUserUsageStatus(userId, plan, tzOffsetMinutes);
  }

  const safeIncrement = Math.max(0, Math.min(120, Math.round(addSeconds)));
  const dateKey = getDateKeyForNow(new Date(), tzOffsetMinutes);

  const existing = await prisma.dailyUsage.findUnique({
    where: { userId_dateKey: { userId, dateKey } },
  });

  const nextSeconds = Math.min(
    FREE_DAILY_LIMIT_SECONDS,
    (existing?.secondsUsed ?? 0) + safeIncrement
  );

  await prisma.dailyUsage.upsert({
    where: { userId_dateKey: { userId, dateKey } },
    update: { secondsUsed: nextSeconds },
    create: { userId, dateKey, secondsUsed: nextSeconds },
  });

  return getUserUsageStatus(userId, plan, tzOffsetMinutes);
}
