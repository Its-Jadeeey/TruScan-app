// TruScan/FrontEnd/Service/theme.js
// Dark "navy + cyan" theme — matches the TruScan Figma mockups
// (loading screen, dark cards, cyan shield accent).

export const COLORS = {
  // ── Core surfaces ──────────────────────────────────────────────
  background: '#0A1220',   // app background (deep navy)
  surface:    '#131E33',   // cards, inputs, nav bars
  card:       '#182642',   // nested boxes inside cards (message preview, etc.)
  border:     '#22314E',   // subtle 1px borders
  border2:    '#2C3E60',   // slightly stronger borders (input focus, dividers)

  // ── Text ────────────────────────────────────────────────────────
  ink:   '#EAF0FB',   // primary text (near-white)
  muted: '#8C9AB8',   // secondary text / labels
  hint:  '#5C6C8C',   // placeholder text, faint metadata

  // ── Brand ───────────────────────────────────────────────────────
  primary: '#3D6FEB',   // blue accent — buttons, active tab, links

  // ── Risk / status colors ──────────────────────────────────────
  scam:        '#FF6B7A',
  scamBg:      '#331823',
  scamBorder:  '#6B2836',

  suspicious:  '#FFC24B',
  suspBg:      '#332711',
  suspBorder:  '#6B4F1C',

  safe:        '#3DDC97',
  safeBg:      '#0F2E27',
  safeBorder:  '#1E5C48',

  info:        '#5FA8FF',
  infoBg:      '#132540',
  infoBorder:  '#254B7A',
};

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  pill: 999,
};

export const SPACING = {
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 40,
};

// Dark UIs read better with soft glow/elevation rather than a light drop shadow.
export const SHADOW = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
};

// Central helper used by every screen to color scam/suspicious/safe UI.
// Pass the active theme (from getTheme()) as the 2nd arg so risk colors stay
// correct under Light Mode / Simple Mode — defaults to the dark palette.
export function getRiskColors(category, themeColors = COLORS) {
  switch (category) {
    case 'scam':
      return { bg: themeColors.scamBg, border: themeColors.scamBorder, text: themeColors.scam };
    case 'suspicious':
      return { bg: themeColors.suspBg, border: themeColors.suspBorder, text: themeColors.suspicious };
    case 'safe':
      return { bg: themeColors.safeBg, border: themeColors.safeBorder, text: themeColors.safe };
    default:
      return { bg: themeColors.infoBg, border: themeColors.infoBorder, text: themeColors.info };
  }
}

// ── Simple Mode theme ──────────────────────────────────────────────
// A separate purple/indigo palette used app-wide whenever Simple Mode is on
// (sidebar, tab bar, Home screen). Reports/Education/Settings content stays
// the same — only the surrounding chrome and Home screen swap to this.
export const SIMPLE_COLORS = {
  background: '#2E2F72',
  surface:    '#363878',
  card:       '#3E4088',
  border:     '#4A4D99',
  border2:    '#5A5DB0',

  ink:   '#FFFFFF',
  muted: '#B8BAE0',
  hint:  '#8688C0',

  primary: COLORS.primary,   // keep the same blue accent for active states

  navCard: '#1B1D4A',        // the dark "NORMAL MODE" card sitting on the purple bg
};

// Big scan-type buttons on the Simple Mode home screen.
export const SIMPLE_SCAN_BUTTONS = {
  message: { bg: '#22C55E', label: 'SCAN MESSAGE', icon: '💬' },
  email:   { bg: '#2F6FEB', label: 'SCAN EMAIL',    icon: '✉️' },
  link:    { bg: '#F59E0B', label: 'SCAN LINKS',    icon: '🔗' },
};

// The dedicated "Scan Message / Scan Email / Scan Links" input screens use their
// own saturated blue theme, distinct from the purple Simple Mode home/sidebar.
export const SIMPLE_SCAN_THEME = {
  background: '#2554D8',
  card:       '#3E74F5',
  border:     'rgba(255,255,255,0.22)',
  ink:        '#FFFFFF',
  muted:      'rgba(255,255,255,0.78)',
  hint:       'rgba(255,255,255,0.55)',
};

// ── Light Mode theme ───────────────────────────────────────────────
// Used app-wide (shared chrome: nav/drawer/settings) when the person turns
// off dark mode from Settings > App Preferences > Light Mode.
export const LIGHT_COLORS = {
  background: '#F7F4EE',
  surface:    '#FFFFFF',
  card:       '#FAF8F4',
  border:     '#E2DDD4',
  border2:    '#D3CCBF',

  ink:   '#1F2430',
  muted: '#6B7280',
  hint:  '#9CA3AF',

  primary: '#3D6FEB',

  scam:        '#DC2626',
  scamBg:      '#FEE2E2',
  scamBorder:  '#FCA5A5',

  suspicious:  '#D97706',
  suspBg:      '#FEF3C7',
  suspBorder:  '#FCD34D',

  safe:        '#059669',
  safeBg:      '#D1FAE5',
  safeBorder:  '#6EE7B7',

  info:        '#2563EB',
  infoBg:      '#DBEAFE',
  infoBorder:  '#93C5FD',

  navCard: '#111827',
};

// Returns the active palette. Simple Mode (purple) takes priority; otherwise
// picks light or dark. Use this instead of importing COLORS directly in
// screens/nav files that need to react to either setting.
export function getTheme(simpleMode, lightMode) {
  if (simpleMode) return { ...COLORS, ...SIMPLE_COLORS };
  return lightMode ? LIGHT_COLORS : COLORS;
}