import test from "node:test";
import assert from "node:assert/strict";

// Pure logic checks mirroring src/lib/usage.ts & src/data/curriculum.ts
const FREE_DAILY_LIMIT_SECONDS = 600;

function getDateKeyForNow(now: Date, tzOffsetMinutes = 0): string {
  const shifted = new Date(now.getTime() - tzOffsetMinutes * 60_000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateRemainingSeconds(plan: string, secondsUsed: number): number | null {
  if (plan === "PRO") return null;
  return Math.max(0, FREE_DAILY_LIMIT_SECONDS - secondsUsed);
}

test("Free plan has 10-minute (600s) daily limit and caps at 0", () => {
  assert.equal(calculateRemainingSeconds("FREE", 0), 600);
  assert.equal(calculateRemainingSeconds("FREE", 180), 420);
  assert.equal(calculateRemainingSeconds("FREE", 600), 0);
  assert.equal(calculateRemainingSeconds("FREE", 750), 0);
});

test("Pro plan has unlimited practice time (null limit)", () => {
  assert.equal(calculateRemainingSeconds("PRO", 9999), null);
});

test("Daily key resets at midnight", () => {
  const beforeMidnight = new Date("2026-11-25T23:59:50.000Z");
  const afterMidnight = new Date("2026-11-26T00:00:05.000Z");
  assert.equal(getDateKeyForNow(beforeMidnight, 0), "2026-11-25");
  assert.equal(getDateKeyForNow(afterMidnight, 0), "2026-11-26");
  assert.notEqual(
    getDateKeyForNow(beforeMidnight, 0),
    getDateKeyForNow(afterMidnight, 0)
  );
});
