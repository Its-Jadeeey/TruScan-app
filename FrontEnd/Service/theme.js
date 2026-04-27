// TruScan/FrontEnd/Service/theme.js
// Shared design tokens — import in every screen for consistency

export const COLORS = {
  background:  '#F5F2EB',
  surface:     '#FFFFFF',
  card:        '#FDFCF8',
  border:      '#E2DDD4',
  border2:     '#CCC8BE',

  ink:         '#1A1814',
  primary:     '#1A7A5E',   // TruScan green
  muted:       '#7A756A',
  hint:        '#B0AB9F',

  // Semantic
  scam:        '#C0392B',
  scamBg:      '#FDECEA',
  scamBorder:  '#F5C0BB',

  suspicious:  '#B5620A',
  suspBg:      '#FEF6E7',
  suspBorder:  '#F8DAAD',

  safe:        '#1A7A5E',
  safeBg:      '#EAF5F0',
  safeBorder:  '#B8DDD1',

  info:        '#1A4F8A',
  infoBg:      '#EBF2FB',
  infoBorder:  '#B8D0F0',
};

export const FONTS = {
  // Use system fonts as fallback — replace with custom fonts via react-native-google-fonts
  display: 'System',
  body:    'System',
  mono:    'Courier New',
};

export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  22,
  pill: 50,
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  14,
  lg:  20,
  xl:  28,
  xxl: 40,
};

// Reusable shadow preset
export const SHADOW = {
  card: {
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Risk level helper
export function getRiskColors(level) {
  switch (level) {
    case 'scam':
      return { text: COLORS.scam, bg: COLORS.scamBg, border: COLORS.scamBorder };
    case 'suspicious':
      return { text: COLORS.suspicious, bg: COLORS.suspBg, border: COLORS.suspBorder };
    case 'safe':
    default:
      return { text: COLORS.safe, bg: COLORS.safeBg, border: COLORS.safeBorder };
  }
}