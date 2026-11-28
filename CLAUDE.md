# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install: `npm install` (postinstall runs `prisma generate`)
- Dev server: `npm run dev`
- Production build: `npm run build` (runs `prisma generate` then `next build`)
- Lint: `npm run lint` (ESLint flat config in `eslint.config.mjs`, Next core-web-vitals + TypeScript)
- Database schema sync: `npx prisma db push` (datasource is Postgres on Neon, not SQLite; `prisma/dev.db` is a stale leftover)
- Tests: there is no `test` script. Run the unit tests with Node's runner: `node --test src/lib/usage.test.ts`
  - `src/lib/audio.test.ts` currently fails with `ERR_MODULE_NOT_FOUND` because it imports `./audio` without an extension. Add `.ts` to the import or fix the runner before relying on it.

Environment variables are read from `.env.local` (Next.js) and `.env`. Required names are listed in `.env.example`: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, the `STRIPE_*` keys, and `NEXT_PUBLIC_APP_URL`. `AWS_*` and `AWS_ENDPOINT_URL_S3` enable speech-recording storage; without them uploads are skipped. `GEMINI_API_KEY` missing means the tutor returns demo replies (`isDemo: true`).

## Architecture

This is a Russian-language AI tutor SaaS ("Слово AI") built on Next.js 16 App Router. `AGENTS.md` warns that this Next.js version has breaking changes; read the relevant guide in `node_modules/next/dist/docs/` before writing framework code.

**Request and auth flow.** There is no middleware. Pages and API routes call `getCurrentUser()` in `src/lib/auth.ts`, which verifies an HS256 JWT (`jose`) stored in the httpOnly cookie `slovo_session`. Pages that need a user redirect to `/auth`; API routes return 401. `/learn` is the main app page and is server-rendered with usage status, then hands off to one large client component, `src/components/tutor/practice-workspace.tsx`.

**Plan gating.** `src/lib/usage.ts` holds the business rules: Free users get 600 seconds of practice per day and 5 free lessons (`isFree` in `src/data/curriculum.ts`); Pro users are unlimited. Daily usage is stored in `DailyUsage`, keyed by a date string shifted by the client's timezone offset, so the reset happens at the user's local midnight. The tutor chat route charges a fixed 15 seconds per call and returns 403 once the limit is hit.

**Billing.** The `User.plan` field is the source of truth for access. It is set to PRO by the Stripe webhook (`src/app/api/stripe/webhook/route.ts`). `syncUserStripeSubscription` in `src/lib/stripe.ts` is a fallback that `/learn` and `/api/stripe/sync` call when the user returns from Checkout or has a Stripe customer ID but is still FREE.

**AI layer.** `src/lib/gemini.ts` wraps `@google/genai`. It exposes tutor replies for the modes `chat | grammar | quiz | listening` (`/api/tutor/chat`) and pronunciation or speaking analysis (`/api/tutor/pro-analysis`, Pro only). Errors go through `getGeminiHttpError`. Text-to-speech is in `src/lib/tts.ts` and uses Microsoft Edge neural voices through `msedge-tts`, not Gemini. The `TtsVoiceName` labels (Aoede, Kore, Puck, Charon) are a legacy naming scheme that maps to the ru-RU Svetlana and Dmitry voices.

**Data.** Prisma schema is `prisma/schema.prisma`, with models User, DailyUsage, LessonProgress and SpeechRecording. `src/lib/prisma.ts` keeps a single client across hot reloads. The curriculum (levels, lessons, quizzes) is static TypeScript in `src/data/curriculum.ts`; only progress is stored in the database. Speech recordings are uploaded to Neon Object Storage through `files-sdk` in `src/lib/storage.ts`, with keys under `recordings/<userId>/`.

**Config.** `next.config.ts` enables `cacheComponents` and `partialPrefetching`, and routes CSS through the Tailwind v4 Turbopack loader. Theme tokens are CSS variables in `src/app/globals.css`, with the brand palette `#FAFAFA`, `#D0D2CF`, `#575C55`, `#86612F`, `#52311B`. `neon.ts` and `.neon` are Neon CLI configuration. `.neon` is gitignored.

## Notes

- The `brag-output-*/` folders are generated video output from the `/brag` skill, not app code.
