# AGENTS.md — rules for AI assistants

## Project
"Làng Ô Vuông (Patchwork Valley)": a low-poly 3D multiplayer farming web game.
Read `docs/GDD.md` (game design) and `docs/ROADMAP.md` (architecture, database, phases) before big tasks.
The developer is a student and a beginner at backend/Git: keep changes small and explain simply.

## Stack (versions from package.json)
- React 19, Vite, TypeScript (strict)
- three 0.186, @react-three/fiber 9, @react-three/drei 10
- zustand 5, Tailwind CSS 4 (via @tailwindcss/vite), Vitest 5
- Planned: Supabase (Auth, Postgres, Realtime), Vercel
- Do NOT add other libraries without asking first.

## Commands
- `npm run dev` — dev server (add `-- --host` to test on phone)
- `npm run build` — type-check + production build
- `npm run lint` — oxlint
- `npm run test` — unit tests (Vitest, files `src/**/*.test.ts`)

- `npx supabase db push` — apply new migrations to the linked project
- `npx supabase gen types typescript --linked > src/types/database.types.ts` — regenerate DB types (run in Git Bash; never edit that file by hand)

## Current phase
Phase 2 (GĐ2) done: Supabase auth (guest + Google), RPCs `start_game`, `get_my_state`, `plant`, `harvest`, `sell`.
- SQL lives in `supabase/migrations/`; helpers in schema `private`; every RPC follows the 9-step pattern (ROADMAP 2.8).
- Client: `src/services/api.ts` (RPC wrappers), `src/state/gameStore.ts` (copy of server state), `src/state/catalogStore.ts` (crop config from DB).
Phase 3 (GĐ3) done: `get_world` + `buy_parcel` RPCs; `src/state/worldStore.ts` holds all parcels/players/other plots.
- Map rendering: `src/game/world/Chunk.tsx` (one per 8x8 parcels, InstancedMesh for tiles/rails/soil/crops),
  crop shapes are merged geometries in `src/game/crops/cropGeometry.ts`.
- Land rules for UI hints: `src/logic/land.ts` (server `buy_parcel` is authoritative).
- Admin/dev SQL: write a .sql file and run `npx supabase db query --linked -f file.sql`.

Phase 4 (GĐ4) done:
- Upgrades: table `upgrade_levels` (single source for house limit, barn capacity, tool area, fertility), RPC `upgrade`;
  tool areas in `src/logic/toolArea.ts` + `private.tool_area_ok`.
- Realtime: statement-level triggers on plots/parcels -> `realtime.send` to private topic `chunk:<cx>:<cy>`;
  client `src/services/realtime.ts` + `src/state/realtimeSync.ts` (3x3 chunks around the camera), presence on `village`.
- Leaderboards: security-invoker views `leaderboard_level|land|weekly`; "Làng" panel.
- Daily login / quests / orders: RPCs `claim_daily_login`, `get_daily_quests`, `claim_quest`, `get_orders`,
  `fulfill_order`, `skip_order`. Quest progress comes from TRIGGERS on `coin_ledger` and `player_stats` (do not
  call progress from RPCs). Cron job `cleanup-coin-ledger` keeps 30 days of ledger.

Setting & visuals (GDD 1.2a, 6.7, 10.1): landlord family in an old Vietnamese village. Wording: "điền trang", "mảnh ruộng";
land titles in `src/logic/titles.ts`. Fixed roads `src/game/world/Roads.tsx`; buildings/trees are merged vertex-color
geometries (`src/game/shapes.ts`, `src/game/structures/houseGeometry.ts`, `src/game/world/Trees.tsx`).
Shadows only on devices with a fine pointer (desktop); never add textures.

## Golden rules
1. The server decides everything about money, items, time and ownership. The client never writes tables directly; it only calls RPC functions (see ROADMAP 2.8).
2. Never put secret keys / service_role keys in frontend code or Git. `.env.local` is never committed.
3. Pure calculation code goes in `src/logic/` (no React, no Three, no Supabase) and must have tests.
4. `game/` (3D) and `ui/` (HTML) never call Supabase directly; they use `state/` and `services/`.
5. Game balance numbers live in the database config tables, not hard-coded (GĐ1 temp data file is the only exception).
6. Never edit an applied migration; create a new one.
7. No `any` in TypeScript. Do not rename/move files unless asked.
8. UI text is Vietnamese. Variable names, function names and comments are English.

## How to answer
- Only do the requested task; do not touch unrelated files.
- For changes touching 3+ files, give a 3-5 bullet plan first and wait for OK.
- At the end: list changed files, explain each change in 2-3 simple sentences, and suggest a Conventional Commit message (e.g. `feat: add plot selection`).
