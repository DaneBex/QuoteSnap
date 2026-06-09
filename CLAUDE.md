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
src/styles/       # Design token system — SEE STYLE SYSTEM SECTION BELOW
supabase/
  schema.sql                          # run in Supabase SQL editor to set up DB
  functions/generate-estimate/        # Deno Edge Function — calls Claude API
```

## Conventions

- Path alias `@/*` → `src/*` (tsconfig.json). Use it everywhere.
- Env vars: `EXPO_PUBLIC_` prefix for client-accessible vars. Never expose `ANTHROPIC_API_KEY` to the client — it lives only in Supabase Edge Function secrets.
- Supabase RLS policies are the auth boundary. Every table has owner-only policies.
- AI generation goes through `supabase.functions.invoke("generate-estimate")`, not a client-side API call.

## Style System

**Theme**: Warm Slate + Amber — minimalist, professional, contractor-focused.

**Token files** — `src/styles/colors.ts` (source of truth), exported via `src/styles/index.ts`.

**Two ways to apply tokens:**

| Use case | How |
|---|---|
| `className` strings (NativeWind) | `bg-app-accent`, `text-app-text-primary`, `border-app-border` |
| Inline styles / icon `color` props | `import { tokens } from '@/styles'` → `tokens.accent` |

**Rule**: never add raw hex values or ad-hoc `blue-*` / `gray-*` Tailwind classes to components. Use the aliases below.

### Color palette

| Token | Tailwind class | Hex | Role |
|---|---|---|---|
| background | `bg-app-background` | `#fafaf9` | Page backgrounds |
| surface | `bg-app-surface` | `#ffffff` | Cards, inputs |
| surface-alt | `bg-app-surface-alt` | `#f5f5f4` | Secondary surfaces |
| primary | `bg-app-primary` / `text-app-primary` | `#44403c` | Headings, primary actions |
| accent | `bg-app-accent` / `text-app-accent` | `#f59e0b` | CTAs, highlights, active states |
| accent-light | `bg-app-accent-light` | `#fffbeb` | Tinted accent backgrounds |
| text-primary | `text-app-text-primary` | `#1c1917` | Body text |
| text-secondary | `text-app-text-secondary` | `#78716c` | Muted / supporting text |
| text-tertiary | `text-app-text-tertiary` | `#a8a29e` | Placeholder, disabled |
| border | `border-app-border` | `#e7e5e4` | Default borders |
| border-strong | `border-app-border-strong` | `#d6d3d1` | Emphasized borders |
| danger | `bg-app-danger` / `text-app-danger` | `#ef4444` | Errors, destructive actions |
| success | `bg-app-success` / `text-app-success` | `#16a34a` | Success states |

### Status badge classes

Defined in `src/styles/colors.ts` as `statusColors`. Use `statusColors[status].bg` + `statusColors[status].text`.

| Status | bg | text |
|---|---|---|
| draft | `bg-stone-100` | `text-stone-600` |
| sent | `bg-blue-50` | `text-blue-800` |
| accepted | `bg-green-100` | `text-green-800` |

### Typography

Font sizes use Tailwind defaults — no custom scale. Standard hierarchy:
- Page title: `text-2xl font-bold text-app-text-primary`
- Section heading: `text-lg font-semibold text-app-text-primary`
- Body: `text-base text-app-text-primary`
- Caption / label: `text-sm text-app-text-secondary`
- Micro / hint: `text-xs text-app-text-tertiary`

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
