# QuoteSnap

Mobile-first contractor estimate app. Expo SDK 56 + Expo Router 56.x + NativeWind v4 + Supabase + Claude AI via Supabase Edge Function.

**Strategy**: Web app first to validate, then App Store via EAS Build — no rewrite needed.

## Commands

```bash
npm run web          # start dev server (web)
npm run start        # start Expo dev server (all platforms)
npm install --legacy-peer-deps   # ALWAYS use this flag — lucide-react-native has peer conflicts
```

## Structure

```
src/app/          # Expo Router routes — auto-detected, do NOT move to project root
src/components/   # UI primitives, layout, wizard steps, editor, preview
src/lib/          # supabase.ts (client), utils.ts
src/stores/       # wizardStore.ts (Zustand — 6-step wizard state)
src/hooks/        # useVoiceInput.ts (Web Speech API)
src/types/        # estimate.ts, database.ts
supabase/
  schema.sql                          # run in Supabase SQL editor to set up DB
  functions/generate-estimate/        # Deno Edge Function — calls Claude API
```

## Conventions

- Path alias `@/*` → `src/*` (tsconfig.json). Use it everywhere.
- Env vars: `EXPO_PUBLIC_` prefix for client-accessible vars. Never expose `ANTHROPIC_API_KEY` to the client — it lives only in Supabase Edge Function secrets.
- Supabase RLS policies are the auth boundary. Every table has owner-only policies.
- AI generation goes through `supabase.functions.invoke("generate-estimate")`, not a client-side API call.

## Quirks

**NativeWind babel config** — Do NOT add `"nativewind/babel"` as a plugin. NativeWind v4 with Expo only needs `jsxImportSource` in the preset:
```js
presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]]
```
Adding the plugin causes `.plugins is not a valid Plugin property` error.

**Expo Router root** — Expo Router 56.x auto-detects `src/app/` and logs "Using src/app as the root directory." Do not set `root` in the expo-router plugin config — it's not supported and causes bundle failures.

**Web output mode** — `app.json` uses `"output": "single"` (SPA). Do not change to `"static"` — static mode requires SSR packages (`expo-font/build/server`) that aren't installed.

**typedRoutes** — Set to `false` in `app.json` experiments. Enabling it causes `expo-router/internal/routing` module-not-found errors.

**Package installs** — Always pass `-- --legacy-peer-deps` to `npx expo install` commands and use `--legacy-peer-deps` with `npm install`. Never resolve conflicts by downgrading expo or react-native; update the conflicting package instead.

**Supabase setup required before running** — App will show a blank screen without `.env.local` filled in. Copy `.env.example` to `.env.local` and add Supabase URL + anon key.
