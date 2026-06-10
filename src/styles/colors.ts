// Primitive color values — raw hex, keyed by scale step.
// Use these only when Tailwind classes can't be used (inline styles, icon colors, animated values).
export const primitives = {
  stone: {
    50:  '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
  amber: {
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  red: {
    50:  '#fef2f2',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
  },
  green: {
    100: '#dcfce7',
    600: '#16a34a',
    800: '#166534',
  },
  blue: {
    50:  '#eff6ff',
    800: '#1e40af',
  },
  white: '#ffffff',
} as const;

// Semantic tokens — named by role, not by raw color.
// Prefer Tailwind `app-*` classes in className strings; use these tokens for inline styles and icon props.
export const tokens = {
  background:    primitives.stone[50],
  surface:       primitives.white,
  surfaceAlt:    primitives.stone[100],

  primary:       primitives.stone[700],
  primaryHover:  primitives.stone[800],

  accent:        primitives.amber[500],
  accentHover:   primitives.amber[600],
  accentLight:   primitives.amber[50],

  textPrimary:   primitives.stone[900],
  textSecondary: primitives.stone[500],
  textTertiary:  primitives.stone[400],
  textInverse:   primitives.white,

  border:        primitives.stone[200],
  borderStrong:  primitives.stone[300],

  danger:        primitives.red[500],
  dangerHover:   primitives.red[600],
  dangerLight:   primitives.red[50],

  success:       primitives.green[600],
  successLight:  primitives.green[100],
} as const;

// Status badge Tailwind class pairs — use in getStatusColor() and badge components.
// Keys match the `status` values stored in the estimates table.
export const statusColors = {
  draft:           { bg: 'bg-stone-100',  text: 'text-stone-600'  },
  pricing_needed:  { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  draft_ready:     { bg: 'bg-sky-50',     text: 'text-sky-700'    },
  review_pricing:  { bg: 'bg-sky-100',    text: 'text-sky-700'    },
  needs_details:   { bg: 'bg-orange-100', text: 'text-orange-700' },
  sent:            { bg: 'bg-blue-50',    text: 'text-blue-800'   },
  ready:           { bg: 'bg-green-100',  text: 'text-green-800'  },
} as const;

export type StatusKey = keyof typeof statusColors;
