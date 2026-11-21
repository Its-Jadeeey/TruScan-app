//// TruScan/FrontEnd/Service/scanFeedback.js
// Scan Alerts: a pop-up warning right after a scan finds something suspicious.
// Only shown when the "Scan Alerts" setting is ON. (The result is always shown on screen.)
import { Alert } from 'react-native';
import { isFlagged } from './ScanHelpers';

const COPY = {
  en: {
    scam:       { title: '⚠️ Scam detected',   body: 'This looks like a scam. Do not reply, click links, or send money.' },
    suspicious: { title: '⚡ Suspicious',       body: 'This looks suspicious. Do not share personal information.' },
    report: 'Report it', learn: 'Learn more', ok: 'OK',
  },
  fil: {
    scam:       { title: '⚠️ PANLOLOKO ITO!',   body: 'Mukhang panloloko ito. Huwag tumugon, pindutin ang link, o magpadala ng pera.' },
    suspicious: { title: '⚡ Mag-ingat!',        body: 'Kahina-hinala ito. Huwag magbigay ng personal na impormasyon.' },
    report: 'Iulat', learn: 'Alamin', ok: 'Sige',
  },
};

// enabled: scanAlerts setting; onReport / onLearn: same handlers the on-screen card uses
export function maybeShowScanAlert({ enabled, result, lang = 'en', onReport, onLearn }) {
  if (!enabled || !isFlagged(result)) return;
  const c = COPY[lang] || COPY.en;
  const kind = String(result.prediction).toLowerCase() === 'suspicious' ? 'suspicious' : 'scam';
  Alert.alert(c[kind].title, c[kind].body, [
    { text: c.ok, style: 'cancel' },
    { text: c.learn,  onPress: onLearn },
    { text: c.report, onPress: onReport },
  ]);
}