export interface ThemePreset {
  readonly key: string
  readonly label: string
  readonly description: string
  readonly colors: {
    readonly primary: string
    readonly background: string
    readonly surface: string
    readonly text: string
    readonly light: string
    readonly white: string
    readonly border: string
  }
}

export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    key: 'default',
    label: 'Classic Yellow',
    description: 'The original S4M theme',
    colors: {
      primary: '#FFE400',
      background: '#0E0E0E',
      surface: '#1A1A1A',
      text: '#555555',
      light: '#F5F4F0',
      white: '#FFFFFF',
      border: '#C0BFB8',
    },
  },
  {
    key: 'porsche',
    label: 'Porsche Red',
    description: 'Guards Red accent',
    colors: {
      primary: '#E00000',
      background: '#0E0E0E',
      surface: '#1A1A1A',
      text: '#555555',
      light: '#F5F4F0',
      white: '#FFFFFF',
      border: '#C0BFB8',
    },
  },
  {
    key: 'ferrari',
    label: 'Ferrari Crimson',
    description: 'Rosso Corsa',
    colors: {
      primary: '#DC143C',
      background: '#0E0E0E',
      surface: '#1A1A1A',
      text: '#555555',
      light: '#FFF8F8',
      white: '#FFFFFF',
      border: '#E0D5D5',
    },
  },
  {
    key: 'ocean',
    label: 'Ocean Blue',
    description: 'Cool blue accent',
    colors: {
      primary: '#00A3FF',
      background: '#0A1929',
      surface: '#132F4C',
      text: '#556677',
      light: '#F0F7FF',
      white: '#FFFFFF',
      border: '#B8CCE0',
    },
  },
  {
    key: 'emerald',
    label: 'Emerald',
    description: 'Green accent',
    colors: {
      primary: '#10B981',
      background: '#0E1A14',
      surface: '#142B22',
      text: '#557755',
      light: '#F0FFF5',
      white: '#FFFFFF',
      border: '#B8E0C8',
    },
  },
  {
    key: 'purple',
    label: 'Royal Purple',
    description: 'Deep violet accent',
    colors: {
      primary: '#8B5CF6',
      background: '#0E0A1A',
      surface: '#1A1233',
      text: '#665588',
      light: '#F5F0FF',
      white: '#FFFFFF',
      border: '#C8B8E0',
    },
  },
  {
    key: 'orange',
    label: 'Sunset Orange',
    description: 'Warm orange accent',
    colors: {
      primary: '#F97316',
      background: '#1A0E05',
      surface: '#2B1A0A',
      text: '#886644',
      light: '#FFF7F0',
      white: '#FFFFFF',
      border: '#E0CCB8',
    },
  },
  {
    key: 'pink',
    label: 'Hot Pink',
    description: 'Electric pink accent',
    colors: {
      primary: '#EC4899',
      background: '#1A0A14',
      surface: '#2B1222',
      text: '#885566',
      light: '#FFF0F7',
      white: '#FFFFFF',
      border: '#E0B8CC',
    },
  },
  {
    key: 'cyan',
    label: 'Neon Cyan',
    description: 'Bright cyan accent',
    colors: {
      primary: '#06B6D4',
      background: '#051A1E',
      surface: '#0A2B33',
      text: '#558888',
      light: '#F0FCFF',
      white: '#FFFFFF',
      border: '#B8DEE0',
    },
  },
  {
    key: 'gold',
    label: 'Championship Gold',
    description: 'Luxury gold accent',
    colors: {
      primary: '#D4A017',
      background: '#1A1508',
      surface: '#2B2410',
      text: '#887755',
      light: '#FFFBF0',
      white: '#FFFFFF',
      border: '#E0D5B8',
    },
  },
] as const

/* ── Custom hex helpers ─────────────────────────────────── */

export function isCustomHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) return { h: 0, s: 0, l }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return { h: h * 360, s, l }
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0
  if (hNorm < 60) { r = c; g = x; b = 0 }
  else if (hNorm < 120) { r = x; g = c; b = 0 }
  else if (hNorm < 180) { r = 0; g = c; b = x }
  else if (hNorm < 240) { r = 0; g = x; b = c }
  else if (hNorm < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function deriveThemeFromHex(hex: string): ThemePreset['colors'] {
  const { h, s } = hexToHsl(hex)
  const sat = Math.min(s, 0.5)
  return {
    primary: hex,
    background: hslToHex(h, sat * 0.4, 0.06),
    surface: hslToHex(h, sat * 0.5, 0.12),
    text: hslToHex(h, sat * 0.35, 0.38),
    light: hslToHex(h, sat * 0.6, 0.97),
    white: '#FFFFFF',
    border: hslToHex(h, sat * 0.4, 0.82),
  }
}

/* ── Public API ─────────────────────────────────────────── */

export function getThemeByKey(key: string): ThemePreset {
  if (isCustomHex(key)) {
    return {
      key,
      label: 'Custom',
      description: key,
      colors: deriveThemeFromHex(key),
    }
  }
  return THEME_PRESETS.find(t => t.key === key) ?? THEME_PRESETS[0]
}

export function getThemeVariables(key: string): Record<string, string> {
  const theme = getThemeByKey(key)
  return {
    '--yellow': theme.colors.primary,
    '--black': theme.colors.background,
    '--charcoal': theme.colors.surface,
    '--gray': theme.colors.text,
    '--light': theme.colors.light,
    '--white': theme.colors.white,
    '--border': theme.colors.border,
  }
}
