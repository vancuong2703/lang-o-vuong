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

## Current phase
Phase 1 (GĐ1): one home parcel, game rules run locally in `src/state/gameStore.ts` and save to localStorage.
`src/game/data/crops.ts` and `gameStore.ts` are TEMPORARY and will be replaced by Supabase RPC in phase 2.

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
