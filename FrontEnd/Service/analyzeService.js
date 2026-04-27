// TruScan/FrontEnd/Service/analyzeService.js
// Calls the FastAPI /analyze endpoint.
// Replace API_BASE_URL with your Render deployment URL when live.

import axios from 'axios';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE_URL = 'http://10.0.2.2:8000'; // Android emulator → localhost
// const API_BASE_URL = 'http://localhost:8000';      // iOS simulator
// const API_BASE_URL = 'https://truscan.onrender.com'; // Production

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── LOCAL KEYWORD FALLBACK ───────────────────────────────────────────────────
// Used when the FastAPI backend is not yet available.
// Remove this once the real ML model is deployed.

const PATTERNS = {
  urgency:  ['URGENT','AGAD','NGAYON','24 HOURS','EXPIRE','BILISAN','2 HOURS','48HRS','IMMEDIATELY'],
  financial:['GCASH','MAYA','MPIN','OTP','BANK','TRANSFER','PADALA','PREMYO','WINNER','NANALO','ACCUTED','REWARD'],
  gov:      ['SSS','PHILHEALTH','PAGCOR','BIR','NBI'],
  courier:  ['LBC','J&T','JT','SHOPEE','LAZADA','PACKAGE','PARCEL','CUSTOMS','DELIVERY'],
  sus:      ['CLICK','I-CLICK','LINK','CLAIM','I-CLAIM','VERIFY','FREE','BIT.LY'],
  domains:  ['gcash-winner','gcash-verify','sss-update','lbc-parcel-ph','bdo-verification','pera-agad'],
};

function localAnalyze(text) {
  const upper = text.toUpperCase();
  let score = 0;
  const found = { urgency: [], keywords: [], domains: [] };

  PATTERNS.urgency.forEach(w   => { if (upper.includes(w)) { score += 15; found.urgency.push(w); } });
  PATTERNS.financial.forEach(w => { if (upper.includes(w)) { score += 10; found.keywords.push(w); } });
  PATTERNS.gov.forEach(w       => { if (upper.includes(w)) { score += 8;  found.keywords.push(w); } });
  PATTERNS.courier.forEach(w   => { if (upper.includes(w)) { score += 8;  found.keywords.push(w); } });
  PATTERNS.sus.forEach(w       => { if (upper.includes(w)) { score += 10; found.keywords.push(w); } });
  PATTERNS.domains.forEach(d   => { if (text.toLowerCase().includes(d)) { score += 40; found.domains.push(d); } });

  const confidence = Math.min(score, 100);
  const prediction = confidence >= 45 ? 'scam' : confidence >= 20 ? 'suspicious' : 'safe';

  return {
    prediction,
    confidence,
    risk_level: confidence >= 80 ? 'HIGH' : confidence >= 40 ? 'MEDIUM' : 'LOW',
    indicators: found,
    source: 'local_fallback', // flag so you know this wasn't the real ML model
  };
}

// ─── MAIN ANALYZE FUNCTION ────────────────────────────────────────────────────

/**
 * Analyze text for scam/phishing.
 * Tries the FastAPI backend first; falls back to local keyword engine if offline.
 *
 * @param {string} text - raw SMS, email body, or URL
 * @returns {object} { prediction, confidence, risk_level, indicators, source }
 */
export async function analyzeText(text) {
  if (!text || text.trim().length < 5) {
    return { error: 'Text too short to analyze.' };
  }

  try {
    const response = await client.post('/analyze', {
      text: text.trim(),
      user_id: 'anonymous', // replace with auth.currentUser.uid later
    });
    return { ...response.data, source: 'ml_model' };
  } catch (error) {
    // Network error or backend not yet deployed — use local fallback
    console.warn('[analyzeService] Backend unavailable, using local fallback:', error.message);
    return localAnalyze(text);
  }
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

/**
 * Check if the FastAPI backend is reachable.
 * Call this on app start to show a banner if offline.
 */
export async function checkBackendHealth() {
  try {
    const res = await client.get('/health', { timeout: 3000 });
    return res.status === 200;
  } catch {
    return false;
  }
}