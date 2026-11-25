# Slovo AI — Персональный AI-репетитор по русскому языку

**Live Demo (Vercel):** https://sass-tutor.vercel.app

SaaS-платформа для изучения русского языка на базе **Next.js**, **Tailwind CSS**, **shadcn/ui**, **Neon (Lakebase Postgres + Object Storage)**, **Stripe** и **Google Gemini (`gemini-3.5-flash-lite`)**.

## Возможности
- **4 этапа обучения:** Начальный (A1–A2), Средний (B1–B2), Продвинутый (C1), Эксперт (C2).
- **Тариф Free:** 10 минут практики в день (сброс в полночь `00:00`), 5 бесплатных уроков, квизы, задачи, грамматика и правописание.
- **Тариф Pro (Stripe):** проверка произношения (аудио с сохранением в Neon Object Storage), Speaking, Listening, разбор ошибок и неограниченное время.
- **Светлая и тёмная тема** в фирменной палитре (`#FAFAFA`, `#D0D2CF`, `#575C55`, `#86612F`, `#52311B`) со шрифтами `Great Vibes` и `LINE Seed JP`.

## Локальный запуск
```bash
npm install
npx prisma db push
npm run dev
```
