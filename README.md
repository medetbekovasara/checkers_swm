# Chaos Checkers

Современная AI-powered платформа для игры в шашки с Chaos mode, AI-соперниками, локальным multiplayer, системой прогресса и онлайн-игрой по ссылке.

---

# О проекте

Chaos Checkers — это переосмысление классических шашек через механику адаптации и динамического gameplay.

Большинство существующих платформ для шашек предлагают только стандартную игру с базовыми правилами. Основная идея Chaos Checkers — сделать gameplay менее предсказуемым и заставить игрока перестраивать стратегию прямо во время партии.

Главная особенность проекта — **Chaos mode**.

Во время матча может произойти chaos event:

* доска переворачивается,
* игроки меняются сторонами,
* игрок, который играл за RED, начинает играть за BLACK,
* вся стратегия игры меняется в реальном времени.

Таким образом игроку приходится:

* адаптироваться,
* быстро принимать решения,
* заново анализировать позицию,
* менять тактику прямо по ходу партии.

Chaos mode превращает шашки не только в игру на просчет ходов, но и в тренировку гибкости мышления.

---

# Реализованный функционал

## Игровые режимы

### Classic

Классические шашки без специальных механик.

### Chaos

Режим со случайными chaos events:

* смена сторон,
* переворот доски,
* адаптивный gameplay.

### Local Multiplayer

Игра вдвоем на одном устройстве.

---

# AI-система

Реализованы AI-соперники с несколькими уровнями сложности:

* Beginner
* Intermediate
* Nightmare

AI:

* автоматически делает ходы,
* использует minimax,
* поддерживает chaos events,
* работает с multi-captures и дамками.

---

# Игровая логика

Реализовано:

* проверка ходов,
* backward captures,
* multi-capture,
* king promotion,
* turn system,
* таймеры,
* win/draw detection.

---

# AI Coach

После окончания партии игрок получает AI-анализ игры:

* стиль игры,
* ошибки,
* missed captures,
* сильные стороны,
* рекомендации по улучшению gameplay.

---

# Профиль и прогресс

В проекте реализованы:

* XP,
* уровни,
* ranking system,
* история матчей,
* статистика игр.

---

# Онлайн-режим

Реализована базовая multiplayer архитектура:

* комнаты,
* игра по ссылке,
* realtime synchronization,
* WebSocket/Supabase Realtime foundation.

---

# Архитектура

## `game-engine/`

Независимая игровая логика:

* правила,
* AI,
* captures,
* chaos mechanics,
* validation.

Game engine изолирован от UI.

---

## `components/`

UI:

* игровая доска,
* HUD,
* leaderboard,
* AI Coach,
* replay/history.

---

## `services/`

Сервисный слой:

* multiplayer,
* ranking,
* replay,
* Supabase,
* AI Coach.

---

## `app/`

Pages, routes и API handlers.

---

# Технологии

* Next.js App Router
* TypeScript
* TailwindCSS
* Framer Motion
* Supabase
* OpenAI API

---

# Переменные окружения

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

---

# Запуск проекта

```bash
npm install
npm run dev
```

---

# Проверка типов

```bash
npm run typecheck
```

---

# Production build

```bash
npm run build
```

# checkers_swm
