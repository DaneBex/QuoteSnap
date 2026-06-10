# QuoteSnap

Mobile-first contractor estimate app built with Expo SDK 56, Expo Router, NativeWind v4, Supabase, and a Supabase Edge Function that calls Claude. Web is the primary dev target; the same codebase is intended to ship to iOS/Android via EAS.

## Structure

```text
src/app/                    # Expo Router routes; route groups are (auth) and (app)
src/components/
  estimate-wizard/          # New-estimate flow, Step1..Step7 + WizardShell
  estimate-editor/          # Editing saved estimates
  preview/                  # Customer-facing estimate preview
  dashboard/                # Dashboard cards and empty state
  ui/ and layout/           # Shared primitives and page chrome
src/stores/wizardStore.ts   # Zustand state for the new-estimate flow
src/lib/supabase.ts         # Supabase client and auth storage adapter
src/lib/utils.ts            # Status and formatting helpers
src/styles/                 # Design tokens; colors.ts is the source of truth
src/types/estimate.ts       # Core estimate payload and saved-estimate types
supabase/schema.sql         # Full DB schema + RLS policies + migration additions
supabase/functions/generate-estimate/
                            # Deno Edge Function that prompts Claude and returns JSON
```

## Commands

```bash
npm install --legacy-peer-deps
npm run web
npm run start
```

There is no test or lint script yet. Verify changes manually in web mode unless you add new tooling.

## Conventions

- Use the `@/*` alias for imports from `src/*`.
- `src/app/index.tsx` redirects straight to `/(app)/dashboard`; auth gating lives in route layouts and Supabase session state.
- The estimate creation flow is a Zustand-backed wizard: job type -> customer -> photos -> notes -> generating -> review -> optional clarifying questions. The current `StepIndicator` only covers steps 1-6; step 7 is a follow-up flow.
- Keep AI generation server-side. Client code should call `supabase.functions.invoke("generate-estimate")`; never call Anthropic directly from the app.
- Treat estimate data as two layers: customer-facing (`jobSummary`, `scopeOfWork`, `lineItems`, `customerMessage`) and internal-only (`missingQuestions`, `optionalQuestions`, `assumptions`, `materialsChecklist`, `optionalUpsells`).
- Estimate status is derived behavior, not just a DB field. Reuse helpers in `src/lib/utils.ts`, especially when subtotal, missing questions, or `prices_confirmed` change.
- Use design tokens from `src/styles/colors.ts`. Do not introduce raw hex values or ad-hoc Tailwind color classes in components.

## Quirks

- Always install with `--legacy-peer-deps`. `lucide-react-native` currently causes peer dependency conflicts.
- Expo Router auto-detects `src/app/`. Do not try to move routes to the repo root or add custom root config for it.
- NativeWind v4 here uses `jsxImportSource: "nativewind"` in `babel.config.js`. Do not add the `nativewind/babel` plugin.
- `src/lib/supabase.ts` uses `localStorage` on web and `expo-secure-store` on native. Preserve that split when touching auth/session code.
- The app needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set locally or it will fail at runtime. `ANTHROPIC_API_KEY` belongs only in Supabase Edge Function secrets.
- Supabase is the security boundary. Preserve RLS assumptions and owner-scoped queries/policies when changing schema or data access.
- The web auth callback route is `/auth/callback`; production deploys must whitelist that exact URL in Supabase Auth settings.

## Working Notes

- Prefer updating this file only when a real Claude mistake exposed missing context.
- If you hit a bad assumption that this file did not prevent, suggest a small `CLAUDE.md` correction in your final message.
