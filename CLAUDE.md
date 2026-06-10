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

## Production Checklist

**Supabase OAuth redirect URLs** — When deploying to production, add the production domain to Supabase:
Authentication → URL Configuration → Redirect URLs → add `https://<your-production-domain>/auth/callback`
Currently whitelisted for dev: `http://localhost:8081/auth/callback`

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

## Planned Improvements (Phases 2–6)

These phases refine the app toward its core promise: *walk the job, talk into your phone, generate a professional estimate, send it before you leave the driveway.*

### Phase 2 — Improve Estimate Generation Behavior

**Goal:** Stop presenting vague/incomplete estimates as ready-to-send.

- Detect low-quality generation signals: `$0` total, many TBD line items, no measurements, long missing-questions list.
- When detected, show a **"More details needed"** state instead of "Estimate Ready." Offer two paths: **Answer Questions** or **Create Draft Anyway**.
- Update the AI prompt in `supabase/functions/generate-estimate/` so it:
  - Separates **customer-facing fields** (summary, scope, line items, total, short message, terms) from **internal contractor notes** (questions, assumptions, risk flags, upsells, pricing notes).
  - Uses confident language for the customer side and cautious/detailed language internally.
  - Does not invent $0 line items or "scope TBD" placeholders — lists missing info separately instead.

### Phase 3 — Make Clarifying Questions Actionable

**Goal:** Turn the "Questions to Clarify" section into a workflow tool.

- Rename section to **"Clarify with Customer"** or **"Questions Before Pricing"**.
- Add action buttons:
  - **Copy Questions** — copies to clipboard.
  - **Text Customer** — opens `sms:` prefilled with a friendly contractor message + questions (uses customer phone from job).
  - **Email Customer** — opens `mailto:` prefilled (uses customer email from job).
  - **Add Answers** — lets contractor type answers; triggers re-generation with those answers added.
- Questions remain internal by default (not shown in customer preview).

### Phase 4 — Improve Estimate Editor UX

**Goal:** Make line item editing clean and usable on mobile.

- Fix line item card layout: item name full-width and wrapping, qty/unit/price on a separate row, total clearly visible.
- Add a dropdown/suggestions for common contractor **unit options**: each, hrs, day, sq ft, linear ft, allowance, fixed, room, section. Custom entry still allowed.
- Change **materials checklist** items from plain text cards to actual checkboxes (internal use — helps contractor avoid forgetting items).
- Keep **assumptions** editable in the editor; shorten them in the customer preview to 3–4 clean standard lines (e.g. "Final pricing subject to site verification. Hidden damage not included unless stated.").

### Phase 5 — Improve Customer-Facing Estimate Preview

**Goal:** Make the preview feel like something a real contractor would send.

- Shorten the customer message — confident but protected, 2–3 sentences max. Remove overly cautious or repetitive caveats.
- Customer preview shows only: contractor info, prepared-for, job type, date, summary, scope, pricing, short terms, signature lines. No internal flags, no AI notes, no long missing-question lists.
- Improve PDF/print hierarchy: title → customer info → summary → scope → pricing → terms → signatures.

### Phase 6 — Dashboard Improvements

**Goal:** Make the dashboard answer "what should I do next?"

- Add a **"Needs Attention"** section above Recent — shows estimates with $0 totals, unresolved questions, or unsent drafts.
- Keep the **Recent Estimates** section below.
- Add quick action buttons: **New Estimate**, **Drafts**. Keep it minimal — do not overcrowd.
- Each section should have one obvious action per item.
