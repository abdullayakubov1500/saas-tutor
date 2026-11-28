# Hyperframes Composition Brief: Слово AI

## Objective
Создать короткое промо-видео (24 с) для продукта «Слово AI» с русской озвучкой.

## Output
- Composition directory: `brag-output-2026-11-28-153441/composition/`
- Rendered video: `brag-output-2026-11-28-153441/brag.mp4`
- Format: landscape — 1920x1080, 30 fps
- Duration: 24 s

## Source Material
- Project root: D:\work\Students\wed1500\24\sass-tutor
- Primary files read: README.md, src/app/page.tsx, src/app/globals.css, src/lib/tts.ts, src/data/curriculum.ts
- Product name: Слово AI
- Tagline / strongest claim: «Изучайте русский язык с персональным AI-наставником»
- Key UI or visual moment to recreate: экран практики с подсвеченной ошибкой и карточкой «Разбор ошибок»
- Copy that must appear verbatim:
  - «Шесть падежей»
  - «Один наставник»
  - «Слово AI»
  - «Персональный AI-репетитор по русскому языку»
  - «Начальный A1–A2», «Средний B1–B2», «Продвинутый C1», «Эксперт C2»
  - «5 уроков бесплатно», «Speaking & Произношение», «Listening»
  - «Начать 10 минут бесплатно»

## Creative Direction
- Tone preset: default
- Creative direction: тёплый, чистый, учебный; без корпоративного языка
- Interpretation: средний темп, крупные заголовки, переходы кроссфейд и мягкий сдвиг
- Angle: русский язык знает шесть падежей, и здесь есть наставник
- Hook: «Шесть падежей. Один наставник.» (0–3.6 с)
- Outro / punchline: «Начать 10 минут бесплатно» (21.2–24 с)
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: #FAFAFA
- Text: #52311B
- Accent: #86612F
- Muted: #575C55
- Border: #D0D2CF
- Display font: Georgia, serif (Cyrillic fallback, потому что Great Vibes кириллицу не поддерживает)
- Body font: LINE Seed JP с fallback system-ui
- Visual references from the project: бордер-hover `#86612F/60` у карточек этапов, кнопка «Начать 10 минут бесплатно», бейдж «Слово AI»

## Storyboard
Use the storyboard in `brag-output-2026-11-28-153441/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 3.6 s — «Шесть падежей» / «Один наставник»
2. Reveal — 4.8 s — логотип «Слово AI» и подзаголовок
3. Stages — 4.5 s — четыре карточки этапов по одной
4. Working app — 3.9 s — ошибка в предложении и разбор
5. Features — 4.8 s — три плитки по одной
6. Outro — 2.8 s — кнопка «Начать 10 минут бесплатно»

## Audio
- Audio role: warm bed + русская озвучка
- Audio arc: музыка тихая под речью, мягкие звуки на карточках, финальный затухающий хвост
- Music: happy-beats-business-moves-vol-9-by-ende-dot-app.mp3, громкость 0.18 (под речью 0.12–0.15, в паузах 0.35)
- Music treatment: старт с 0, затухание 1.2 с в конце
- Music cue guidance: Music cue guidance: unavailable; continue without beat/cue sync.
- Audio-reactive treatment: subtle; свечение фона и карточки этапов дышат от RMS музыки; без визуализаторов
- Audio-coupled moments:
  - Scene 1 — drop на вторую строку
  - Scene 2 — bong_001 на логотип
  - Scene 3 — drop_001 на каждую из четырёх карточек
  - Scene 4 — click_001 на клик «Разобрать»
  - Scene 5 — drop_002 на каждую плитку
  - Scene 6 — bong_001 на кнопку
- SFX selection guidance: sparse, все на громкости 0.55–0.7; не звучат во время реплик
- SFX analysis guidance: `D:\...\skills\brag\assets\sfx\sfx-analysis.md`, выбираем низкорисковые файлы (drop, click, bong)
- Exact SFX choice: Hyperframes chooses filenames based on the animation
- Audio files:
  - `assets/music/happy-beats-business-moves-vol-9-by-ende-dot-app.mp3`
  - `assets/voice/line1.wav` … `assets/voice/line6.wav` (озвучка, Windows Irina ru-RU)

## Voiceover
Озвучка генерируется Windows-голосом Microsoft Irina Desktop (ru-RU). Kokoro русского не поддерживает.
Таймлайн реплик:
- line1 0.0 s (3.27 s)
- line2 3.6 s (4.54 s)
- line3 8.4 s (4.02 s)
- line4 12.9 s (2.94 s)
- line5 16.9 s (4.46 s)
- line6 21.2 s (2.36 s)
Музыка опускается до 0.12 на время реплики и возвращается до 0.35 между ними.

## Hyperframes Instructions
Сборка композиции: HTML-файл `composition/index.html`, сцены с `data-start` и `data-duration` по таймлайну выше. Проверка через `npx hyperframes check` до рендера. Рендер в `../brag.mp4`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15–25 seconds (24 s).
- Include the planned music and SFX layer.
- Music can be ducked under narration.
- Run `hyperframes check` before render.
- Keep creation and rendering local.
