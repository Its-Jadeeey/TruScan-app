// TruScan/FrontEnd/Service/scanHelpers.js
// Input validation per scan type, "is this flagged?", and the auto-fill logic
// that maps a scan result to the Report form's Type + Category.

const EMAIL_RE   = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,24}/i;
const URL_SCHEME = /^(?:https?:\/\/|www\.)[^\s/$.?#][^\s]*$/i;
const BARE_URL   = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?::\d{2,5})?(?:[/?#]\S*)?$/i;
const IP_URL     = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?(?:[/?#]\S*)?$/;

export function looksLikeLink(text) {
  const t = (text || '').trim();
  if (!t || /\s/.test(t)) return false;
  return URL_SCHEME.test(t) || BARE_URL.test(t) || IP_URL.test(t);
}

export function looksLikeEmail(text) {
  return EMAIL_RE.test(text || '');
}

// kind: 'message' | 'email' | 'link'   ->   { ok, en, fil }
export function validateInput(kind, text) {
  const t = (text || '').trim();
  if (!t) {
    return { ok: false, en: 'Paste something to scan first.', fil: 'Maglagay muna ng susuriin.' };
  }
  if (kind === 'link' && !looksLikeLink(t)) {
    return {
      ok: false,
      en: 'That does not look like a link. Paste only the URL (for example https://example.com or bit.ly/abc123). For a text, use the Message tab.',
      fil: 'Hindi ito mukhang link. Ilagay lamang ang URL (hal. https://example.com o bit.ly/abc123). Para sa teksto, gamitin ang tab na Mensahe.',
    };
  }
  if (kind === 'email' && !looksLikeEmail(t)) {
    return {
      ok: false,
      en: 'That does not look like an email. Include the sender or recipient address (it must contain "@", like name@example.com).',
      fil: 'Hindi ito mukhang email. Isama ang email address ng nagpadala o tatanggap (dapat may "@", hal. name@example.com).',
    };
  }
  if (t.length < 5) {
    return { ok: false, en: 'Text is too short to analyze.', fil: 'Masyadong maikli para masuri.' };
  }
  return { ok: true };
}

// Anything the model did not call "safe" is worth reporting.
export function isFlagged(result) {
  if (!result) return false;
  const p = String(result.prediction || '').toLowerCase();
  const r = String(result.risk_level || '').toLowerCase();
  return p !== 'safe' || r === 'high' || r === 'medium';
}

export function reportTypeFromTab(tab) {
  return { message: 'sms', email: 'email', link: 'url' }[tab] || 'sms';
}

export function channelFromTab(tab) {
  return { message: 'sms', email: 'email', link: 'link' }[tab] || 'sms';
}

// Keys match CATEGORIES in reportScreen.js. First match wins.
const CATEGORY_RULES = [
  ['simswap',       /sim\s*swap|sim\s*card.{0,30}(block|deactivat|expire)|palit.{0,15}sim/i],
  ['government',    /\b(sss|pag-?ibig|philhealth|bir|nbi|dswd|lto|ltfrb|dole|gsis|dfa|comelec|ayuda|4ps|barangay)\b|\.gov\.ph/i],
  ['delivery',      /\b(lbc|j&t|jnt|flash express|ninja\s*van|entrego|parcel|package|courier|delivery|redelivery|tracking|shipment|customs)\b/i],
  ['job',           /\b(hiring|job offer|work from home|wfh|part[- ]?time|daily income|per day|commission|recruit|trabaho|online job|task)\b/i],
  ['lottery',       /\b(you (?:have )?won|nanalo|panalo|winner|raffle|prize|premyo|jackpot|claim|lucky|bonus|spins?)\b/i],
  ['investment',    /\b(invest|investment|crypto|bitcoin|forex|trading|profit|returns?|dividends?|paluwagan|double your)\b/i],
  ['loan',          /\b(loan|utang|lending|pautang|credit line|cash loan|interest rate)\b/i],
  ['romance',       /\b(my love|darling|sweetheart|soulmate|lonely|i love you|relationship)\b/i],
  ['travel',        /\b(hotel|booking|flight|airline|ticket|accommodation|resort|reservation)\b/i],
  ['charity',       /\b(donat\w*|charity|fundrais\w*|relief fund|tulong|biktima)\b/i],
  ['shopping',      /\b(lazada|shopee|tiktok shop|order|purchase|seller|refund|cash on delivery|voucher|discount)\b/i],
  ['financial',     /\b(gcash|g-?cash|maya|paymaya|bpi|bdo|metrobank|unionbank|landbank|security bank|otp|e-?wallet|wallet|bank|account|suspend\w*|deactivat\w*|verify|password|pin)\b/i],
  ['impersonation', /\b(new number|nagpalit.{0,20}number|this is (?:your )?(?:boss|manager|ceo|mom|dad|tita|tito)|nasa hospital|emergency)\b/i],
];

export function inferScamCategory(text, tab) {
  const t = String(text || '');
  for (const [key, re] of CATEGORY_RULES) if (re.test(t)) return key;
  return tab === 'message' ? 'smishing' : 'phishing';
}

// Everything the Report screen needs to pre-fill itself from a scan.
export function buildReportPrefill({ text, tab, result }) {
  return {
    text,
    type: reportTypeFromTab(tab),
    category: inferScamCategory(text, tab),
    channel: channelFromTab(tab),
    prediction: result?.prediction || 'suspicious',
    ml: result
      ? {
          riskLevel: String(result.risk_level || 'medium').toLowerCase(),
          confidence: result.confidence,
          reasons: result.indicators?.top_features || result.indicators?.keywords || [],
        }
      : null,
  };
}

export function goToReport(navigation, args) {
  navigation?.navigate?.('Reports', { prefill: buildReportPrefill(args), nonce: Date.now() });
}

export function goToEducation(navigation, tab = 'types') {
  navigation?.navigate?.('Education', { tab, nonce: Date.now() });
}