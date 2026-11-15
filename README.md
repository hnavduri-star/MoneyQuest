# MoneyQuest

A mobile-first, installable PWA that teaches children aged 7–15 how money works through a virtual town that grows as they learn.

**Status: Phase 1 complete, plus the Dubai Money Journey.** The child picks a character and travels across Dubai. At every stop the guide explains a concept, and the child answers questions to move on:

| Stop | Place | World | What it teaches |
|---|---|---|---|
| 1 | Al Fahidi & the Gold Souk | Money Basics | what money is, needs vs wants, earning, saving, goals |
| 2 | Business Bay offices | Salary Street | what a salary is, payday via the bank (WPS), gross vs net, pay yourself first, zakat |
| 3 | A family home in Mirdif | Family Budget | family income, fixed vs variable expenses (rent, DEWA, school), budgets, emergency fund |
| 4 | DIFC | Bank Town | deposits, interest, compound growth, loans, how banks earn the spread, Islamic profit-sharing |
| 5 | Dubai Mall | Cash, Cards & ATMs | AED notes and fils, how an ATM talks to your bank, PIN safety, debit vs credit, tap-to-pay |
| 6 | DXB Airport & Deira exchange | Currency Bazaar | currencies, exchange rates, the dirham's dollar peg, money changers, remittances, why rates move |
| 7 | Kite Beach | Lemonade to Empire | revenue, fixed and variable costs, profit and loss, pricing, break-even |

Each stop has 4–6 lessons, a timed mini-game, a quiz and a boss. Every lesson starts with an explanation, and every question explains its answer. After two wrong tries the guide shows the answer and explains it, so no child gets stuck. Answering earns participation XP and coins, keeps an answer-streak going, and counts toward the *Curious Learner* badges and the daily "answer 10 questions" quest. Banks in the lessons are fictional; places are real Dubai landmarks.

Child-safe by design: no ads, no third-party scripts, fonts or trackers, no real money, no open chat, nicknames only. Strict Content-Security-Policy (`'self'` only).

## Quick start

Requires **Node 22.13+**. SQLite is Node's built-in `node:sqlite`, so there is nothing native to compile.

```bash
git clone https://github.com/hnavduri-star/MoneyQuest.git moneyquest
cd moneyquest
npm install
npm run dev          # API on :4100, app on http://localhost:5180 (proxies /api)
npm test             # engine + API tests (vitest)
npm run content:check  # validates every JSON content file
```

Production (one service: Express serves the built app):

```bash
npm run build        # content check + client build (PWA, service worker)
npm start            # http://localhost:4100   (PORT, DB_FILE env vars optional)
```

The SQLite file defaults to `moneyquest/data/moneyquest.db`. On hosts with ephemeral disks, point `DB_FILE` at a persistent volume.

## For families, schools and partners

- **Play before signing up:** "Play now" lets a child pick a guide and answer 3 questions for coins. A grown-up then ticks the consent box, sets the parent PIN, and the coins carry over.
- **Parent mode** (Settings or the players screen, PIN-protected): per child, minutes played per day, stops done, missions to confirm, before/after check results, certificates to print, skill levels, "try this at home" ideas and conversation prompts, a real-life savings goal (shown in the child's Town Bank), and joining a class.
- **Teacher mode** ("I'm a teacher" on the welcome screen): create a class with a name and PIN, share the class code with parents, see a class grid (nicknames only) with stops done and average improvement, and print worksheets with an answer key for every stop. Needs the online version.
- **Learning evidence:** each stop offers a 5-question check before starting and after the boss (the same questions both times). Parent and Teacher mode show the improvement.
- **Realistic prices per city** (`prices` in `content/cities.json`): everyday amounts use `small`, salary-sized steps use `big` (e.g. ×0.25 in pounds and euros, ×0.3 in dollars, ×5 in rupees), and every amount and answer in a step scales together.
- **Documents:** `docs/privacy-and-consent.md`, `docs/partner-policy.md` (child-marketing rules, data sharing, DPA checklist), `docs/pilot-and-pricing.md`, `docs/content-review.md`.
- **Review sheets:** `npm run review:export` writes spreadsheets of every city fact and every English/Arabic text for reviewers; `npm run review:import` applies their corrections.
- **Hosting that keeps data:** `render.yaml` (New → Blueprint) creates a starter instance with a 1 GB disk.

## Game features added after Phase 1

- **14 stops** with a branching journey: after Family Budget, children choose the banking path, the shopping path or the business path (`requires` / `requiresAny` in `worlds/index.json`). New stops: Scam Shield, Smart Shopper, Investment Island, Giving Garden.
- **Question types:** choice, number, sort, **order** (tap the steps in order), **estimate** (slider, close enough counts), **scenario** (story choices, each with its own outcome; choices are saved for Story Mode), plus goal simulations.
- **City passport:** beating a stop's boss stamps the passport for the current city (Trophies → Money passport).
- **Real-life missions** (`content/missions.json`): the child taps "I did it", a grown-up confirms in Parent mode, and coins are paid.
- **Savings goals:** "Save for this" on any shop item; the Town Bank shows progress and celebrates when it's affordable.
- **Family challenge:** a weekly XP target for the whole family; each child claims the reward.
- **One victory screen** after each level instead of a stack of pop-ups; **70 badges** (fewer, more special); coins rebalanced; drawn pets and decorations instead of emoji.

## Cities, partner editions and the newer stops

- **Six cities:** Dubai, Abu Dhabi, London, Paris, Mumbai and New York. The child picks a city in the character creator (and can change it in Settings). The city sets the journey stops and landmarks, the skyline, the currency (money shows in the city's currency by default), notes and coins, central bank, ATM network, taxes, bills, payday, exchange rates and the places in the currency game. Lessons use `{placeholders}` that `content/cities.json` fills; numeric answers such as `"{fxTen}"` resolve per city. Mumbai uses `priceScale: 10`, so amounts read like real rupee prices.
- **Partner editions (`content/editions.json`):** a sponsor bank (e.g. ABC Bank) and/or a school (e.g. Sunrise International School). Their names, colours and marks appear on the welcome screen, town, journey and Town Bank, and the bank's products are named in the **{bank} Junior Club** stop (kids' account, debit card, cheque book, credit card, Islamic savings). Account details for parents sit behind the parent PIN; children only learn how the products work. An edition can limit the cities (ABC Bank: Dubai and Abu Dhabi).
  - Build for a partner: set `VITE_EDITION=abc-bank` (or `sunrise-school`, `abc-sunrise`) as an environment variable on Render, then redeploy.
  - Demo build with an edition dropdown on the welcome screen and in Settings: `VITE_EDITION_PICKER=1`.
  - Add a partner: add a bank or school to `editions.json` and an edition that points at it.
- **Balance the family budget:** a challenge lesson in Family Budget. The plan starts overspent, rent and school fees are locked, and the level only continues once the budget balances with at least 10% saved, then again after a surprise car repair.
- **Café & Restaurant P&L:** estimate café sales (customers × spend × days), sort costs into cost of goods and operating expenses, read a P&L, and turn a loss-making restaurant into a profit with a live P&L simulator.
- **Debt Dungeon:** good vs bad debt, how interest makes debt grow, the minimum-payment trap (simulator compares your payment with paying the minimum), buy-now-pay-later, credit scores, and the avalanche and snowball escape plans. Boss: the Debt Dragon.
- **Goal simulations:** a sim step with `params.target` is a challenge that must be solved before the lesson continues (budget, café, debt). It needs a `concept`, `goalText` and `explain`.

## Earning coins and the Town Bank

- **Every answer pays immediately:** 3 coins for a first-try answer, plus 1 more for each answer in a streak (up to +4), and 1 coin if the guide had to explain it. Replays pay 1. Coins fly up to the wallet, and the level header counts what this level has paid so far.
- **Finishing levels, mini-games, quests, chests and badges** still pay their bonuses on top.
- **Town Bank (Shop → Bank):** children can save coins and earn 5% compound interest every week, up to 200 a week. They can also swap earned coins for gems (120 coins = 1 gem) to unlock special items.
- **Nothing costs real money.** There are no purchases with real money anywhere; the content checker rejects real-money prices.

All amounts live in `content/rewards.json` (`events["question.answered"]`, `bank`, `gemPriceCoins`).

## Look: matte light and dark

Settings → Look offers Light, Dark or Auto (follows the device). The design uses satin buttons, grained matte cards, metallic coins and gems, and a night-time town with lit windows in dark mode. All colours are CSS variables in `client/src/index.css`.

## Preview page (no server)

`npm run build:page` makes `client/dist-page/`: a self-contained build with no service worker and no server calls. Progress stays in the browser. Use it to share a playable preview on any static host.

## Deploy to Render

MoneyQuest is one Node web service: Express serves the API and the built app.

1. Push the code to GitHub.
2. In the Render dashboard, choose **New → Web Service**, connect GitHub, and pick the `MoneyQuest` repository and the `main` branch.
3. Fill in:

   | Setting | Value |
   |---|---|
   | Root Directory | leave empty |
   | Environment variable (optional) | `VITE_EDITION` = `abc-bank` for a sponsor build |
   | Runtime | Node |
   | Build Command | `npm ci --include=dev && npm run build` |
   | Start Command | `npm start` |
   | Health Check Path | `/api/health` |
   | Environment variable | `NODE_VERSION` = `22` |

4. Click **Create Web Service**. The app is live at `https://<name>.onrender.com`. Open it on a phone and use **Add to Home Screen** to install it.

**Where progress is saved.** Children's progress always lives on their own device first. The server holds the family backup, the device links and the leaderboard in a SQLite file:

- **Free plan:** the disk is wiped on every deploy or restart. Devices keep playing, but family backups and device links are lost.
- **Keep backups:** use a paid instance, add a **Disk** (for example mount path `/var/data`, 1 GB), and set `DB_FILE` = `/var/data/moneyquest.db`.

## What's in Phase 1

| Area | What you get |
|---|---|
| First run | A grown-up sets a 4-digit parent PIN (it can also link a second device with the family code + PIN). Works offline: the family links to the server later. |
| Character creator | Language (English / Arabic, full RTL) and currency (AED, SAR, USD, EUR, INR or pretend “Gems ✦”), age tier, nickname (checked for real names, emails and phone numbers), 16 presets in 6 groups (Arab incl. thobe, ghutra, abaya and hijab; Indian; African; East Asian; European; fantasy robot, fox and astronaut) or a full custom builder, 6 companion guides, colour theme. |
| Evolution | The avatar and companion change at levels 10, 18, 34 and 43: star pin, cape, golden glow, crown and sparkles. |
| Town hub | SVG town: home with the avatar and pet, a building per world (empty plot → construction → tiers 1–3 as mastery grows, golden and sparkling at tier 3), shop decorations, and traffic that gets busier as the town grows. Future districts are shown as coming soon. |
| Gamification | XP and levels 1–50 with ranks (Saver, Builder, Trader, Banker, Tycoon, Money Master), coins and gems, daily streak with freeze tokens, 7-day login chest (every reward shown in advance, no randomness), 3 daily quests, weekly challenge, 143 badges in 4 rarities, trophy room, 1–3 stars per level, family leaderboard (top this week and most improved), timed mini-games with combos and power-ups, hints that cost coins (free after a wrong try, or when the child can't afford one), boss battles, mastery meters (Learning → Practising → Mastered) with spaced-repetition reviews that pay bonus coins. |
| Worlds | See the journey table above. Original Phase 1 worlds: **Money Basics**: 5 lessons, Needs vs Wants Rush, quiz, and the Impulse Imp boss. **Bank Town**: 5 lessons plus an optional Islamic banking lesson (profit-sharing), Bank Rush, quiz, and the Lenny the Loan Shark boss. |
| Simulations | Savings goal, Save/Spend/Give jars, simple vs compound growth, loan calculator, bank spread (animated coin flow), profit-sharing (mudarabah), payslip builder, family budget with surprise bills, a working pretend ATM (card → PIN → network → bank check → notes), currency exchange with margins, and a lemonade stand P&L with demand and break-even. |
| Mascot | Speech bubbles, moods, read aloud with the device's own speech engine (opt-in), sounds made with Web Audio (no audio files), haptics, confetti. Failure is always gentle: a hint and another try, nothing lost. |
| Wellbeing | Break reminder (15/20/30/45 min) that never locks the child out, no loot boxes, no pay-to-win, no streak shaming (a missed day simply starts a new streak, and freezes cover gaps automatically). |
| Accessibility | 48px+ tap targets, colour-blind-safe Okabe–Ito palette, state never shown by colour alone, reduced motion (also follows the OS setting), sound, voice and haptics toggles, OpenDyslexic font option, 3 text sizes, screen-reader labels. |
| Offline + sync | All content is bundled and precached (~0.9 MB). Progress autosaves per profile on the device, then syncs to the family account. Last write wins. |
| Profiles | Several children per family. Removing a profile or changing an age tier needs the parent PIN. |

## Project layout

```
moneyquest/
  content/                 ← all game content (JSON). Edit this to add lessons, badges, items…
    worlds/index.json        every world in order (phase, availability, prerequisites, building)
    worlds/<world-id>.json   a world's levels and steps
    badges.json              one-off badges + tiered badge series
    rewards.json             reward rules: XP/coins per event, level curve, chest calendar, power-ups
    quests.json              daily quest pool + weekly challenges
    shop.json                collectibles (outfits, hats, pets, decorations, guide looks)
    characters.json          avatar parts, presets, companions, colour themes
    ranks.json               rank names per level range
    i18n/en.json, ar.json    UI strings
  engine/                  ← pure JS, shared by app and tests (no React, no DOM)
    rewards.js               event-driven reward engine: processEvent(state, event) → { state, effects }
    levels.js streaks.js mastery.js quests.js badges.js town.js progress.js scoring.js text.js
    sims/                    interest, loans, bank, savings, salary, budget, atm, fx, business (unit-tested maths)
    validate.js registry.js  content checks
    test/                    vitest suites
  server/                  ← Express + SQLite (families, devices, profiles, leaderboard)
  client/                  ← React + Vite + Tailwind + Framer Motion PWA
  scripts/                 dev runner, content checker
```

### How the reward engine works

Every action is an **event**, for example `{ type: 'level.completed', worldId, nodeId, stars, mistakes, answers }`. `processEvent` is pure. It:

1. handles the event (updates progress, mastery and the streak, or checks a purchase),
2. applies the matching rules in `rewards.json` (variants, bonuses and stat counters),
3. advances the quests in `quests.json` whose `event`/`where` match,
4. settles level-ups, town buildings and badges until nothing new happens,
5. returns the new state and a list of **effects** (`reward`, `levelUp`, `badge`, `buildingUnlocked`, `questDone`, `streak`, …), which the UI turns into celebrations.

A new mission type plugs in by emitting an event. Rewards, quests and badges that react to it are data, so no engine code changes.

## Adding content

Run `npm run content:check` after any edit. It reports problems with the file and step, for example an unknown bin, a missing correct option, a missing Arabic key or a real-money price.

### Text, languages and age tiers

Any text can be a string, `{ "en": "…", "ar": "…" }`, or age-tiered: `{ "7-9": { "en": … }, "default": { "en": … } }`. Numbers can be age-tiered the same way (`"answer": { "7-9": 4, "default": 6 }`). Write money as `[[120]]` and it shows in the child's chosen currency. Add `"ages": ["10-12", "13-15"]` to a step or level to hide it from younger children.

To add a language: create `content/i18n/<code>.json` with every key from `en.json`, add `<code>` text to content, and add it to `LANGUAGES` in `client/src/content.js` (with `dir: 'rtl'` if needed).

### A new lesson (or a whole world)

Add a node to `content/worlds/<world>.json` → `nodes`:

```json
{
  "id": "my-lesson", "kind": "lesson", "icon": "💡",
  "title": { "en": "My lesson", "ar": "درسي" },
  "steps": [
    { "type": "story", "art": "coins", "mascot": "happy", "text": { "en": "…", "ar": "…" } },
    { "type": "choice", "concept": "needs-wants", "prompt": { "en": "…" },
      "options": [{ "text": { "en": "Right" }, "correct": true }, { "text": { "en": "Wrong" } }],
      "hint": { "en": "…" }, "explain": { "en": "…" } },
    { "type": "number", "concept": "savings-goal", "money": true, "prompt": { "en": "… [[20]] …" }, "answer": 4, "tolerance": 0 },
    { "type": "sort", "concept": "needs-wants", "prompt": { "en": "…" },
      "bins": [{ "id": "need", "emoji": "🏠", "label": { "en": "Need" } }, { "id": "want", "emoji": "🎈", "label": { "en": "Want" } }],
      "items": [{ "emoji": "💧", "text": { "en": "Water" }, "bin": "need" }] },
    { "type": "sim", "sim": "compound", "params": { "principal": 100, "rate": 6, "years": 20 }, "text": { "en": "…" } }
  ]
}
```

- `kind`: `lesson`, `quiz`, `boss` (add a `boss` object with `name`, `intro`, `taunt`, `color`) or `minigame` (`"game": "sort"` with `config.bins`, `config.items`, `config.seconds` and `config.stars` thresholds).
- A lesson must start with a `story` step (the explanation), and every `choice` and `number` question needs an `explain`. The content checker enforces both. Number answers can show a fixed unit with `"unitText": { "en": "AED", "ar": "درهم" }`.
- Every question needs a `concept`, named in the world's `"concepts"` map. That drives mastery meters, spaced review and building upgrades.
- `"optional": true` lets a level never block completion (as with the Islamic banking lesson, `"module": "islamic-banking"`, which parents can hide in Settings).
- Levels unlock in order. A world's building is built when its required levels are done, reaches tier 2 at 60% average mastery and tier 3 when every concept is mastered.

**New world:** create `content/worlds/<id>.json`, then set `"available": true` for it in `worlds/index.json` (with a `location`, a `landmark` emoji and `requires` to place it on the journey). The app picks up every JSON file in that folder automatically. The world gets 3 automatic badges (finish, all stars, master). A `building` type without its own art uses a generic building with the world icon.

New **step art**, **sims** or **mini-game types** are React components. Register them in `client/src/components/Illustration.jsx`, `client/src/sims/index.jsx` or `client/src/pages/Play.jsx`, and add the id to `engine/registry.js` so the content checker knows about them.

### A new badge

One-off, in `badges.json` → `badges`:

```json
{ "id": "night-owl", "icon": "🦉", "rarity": "rare", "category": "special",
  "name": { "en": "Review Hero", "ar": "بطل المراجعة" }, "desc": { "en": "Do 3 reviews", "ar": "…" },
  "criteria": { "stat": "reviewsDone", "gte": 3 } }
```

Or a tiered series (one badge per tier, `{n}` and `"$n"` are replaced):

```json
{ "id": "hints", "icon": "💡", "category": "skill", "criteria": { "stat": "hintsUsed", "gte": "$n" },
  "name": { "en": "Hint Taker {n}" }, "desc": { "en": "Use {n} hints" },
  "tiers": [{ "n": 5, "rarity": "common" }, { "n": 25, "rarity": "rare" }] }
```

Criteria types: `stat` (any counter in `rewards.json` `stats`), `level`, `streak`, `badges`, `owned` (+ `type`), `mastered`, `nodeDone`, `worldComplete`, `worldPerfect`, `masteredWorld`, `allOf`, `anyOf`. Rarity rewards are set in `rewards.json` → `badgeRewards`.

### A new character, outfit or companion

- **Preset:** add to `characters.json` → `presets`, combining existing part ids (`species`, `skin` index, `hair`, `hairColor` index, `outfit`, `headwear`, `accessory`, `outfitColor`, `headwearColor`).
- **New part** (for example a hairstyle): add `{ id, name }` to its list in `characters.json`, then draw it in `client/src/components/Avatar.jsx` (each part is a small SVG case).
- **Companion:** add to `characters.json` → `companions` (name, colour, voice pitch and rate) and a `case` in `client/src/components/Companion.jsx`.
- **Collectible:** add to `shop.json` with a coin or gem `price`, and optionally `unlock: { level }` or `unlock: { badge }`. Pets and decorations use an emoji `art`. Outfits, hats and guide looks map to SVG in `Avatar.jsx` and `Companion.jsx`.

### Quests and rewards

`quests.json` entries count matching events: `{ "event": "level.completed", "where": { "kind": "minigame" }, "target": 1 }`, or sum a field with `"measure": "stars"`. Quests that share a `group` never appear on the same day. All XP, coin and gem amounts live in `rewards.json`.

## API (all first-party, under `/api`)

| Method | Path | Notes |
|---|---|---|
| POST | `/families` | `{ pin }` → `{ familyId, code, token }` |
| POST | `/families/join` | `{ code, pin }` → device token (rate-limited) |
| GET | `/family` | profiles for this family |
| PUT | `/profiles/:id` | upsert `{ nickname, ageTier, meta, state, summary, updatedAt }`; `409` returns the newer server copy |
| DELETE | `/profiles/:id` | header `x-parent-pin` |
| GET | `/leaderboard` | family only: nickname, avatar look, weekly XP, improvement |

Tokens are stored hashed (SHA-256), PINs with scrypt. Profile state is capped at 400 KB.

## Tests

`npm test` runs the full suite (engine + API). The engine suites cover the interest, loan, bank and savings maths, the XP curve and ranks, streaks and freezes, mastery and spacing, quests, the shop, hints, badges, town tiers, world unlocking, age tiers and content validation. The API suite covers auth, sync conflicts, family isolation, nickname rules, PIN rate limiting, the leaderboard and size limits.

## Roadmap (each phase waits for go-ahead)

- **Phase 2 (remaining):** P&L Factory, Parent Mode dashboard. (Salary Street and Family Budget are in the journey.)
- **Phase 3 (remaining):** deeper Lemonade to Empire (stock, staff, demand shifts), moving exchange rates in Currency Bazaar, Supply & Demand, Giving Garden.
- **Phase 4:** Investment Island, Debt Dungeon, Insurance Shield, Inflation Lab (with stock-market, inflation and insurance-event engines).
- **Phase 5:** Startup Lab, Scam Shield, Government City, Career Compass, Smart Shopper, Big Goals Quest.
- **Phase 6:** Story Mode (state already records `choices`), Multiplayer Market Day, Teacher Mode, Money Master capstone, seasonal events.
