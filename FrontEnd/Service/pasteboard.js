//// TruScan/FrontEnd/Service/pasteboard.js
// Auto-scan Pasteboard: when the app is opened / comes back to the foreground
// (or the screen gains focus) and the setting is ON, look at the clipboard and
// suggest scanning it. It only SUGGESTS (the user taps "Scan it"); nothing is
// sent to the server until they do.
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { looksLikeLink, looksLikeEmail } from './ScanHelpers';

const MIN_LEN = 8;
const MAX_LEN = 5000;

// Which scan tab fits this text best.
export function tabForText(text) {
  const t = (text || '').trim();
  if (looksLikeLink(t)) return 'link';
  if (looksLikeEmail(t)) return 'email';
  return 'message';
}

// enabled      : the Settings toggle (autoScanPasteboard)
// currentText  : what is already in the scan box (don't suggest what is already there)
export function usePasteboardSuggestion(enabled, currentText = '') {
  const [suggestion, setSuggestion] = useState(null);   // { text, tab } | null
  const lastHandled = useRef('');                       // dismissed or accepted text
  const currentRef  = useRef(currentText);
  currentRef.current = currentText;

  const check = useCallback(async () => {
    if (!enabled) { setSuggestion(null); return; }
    try {
      // hasStringAsync does not trigger the iOS "pasted from" prompt; getStringAsync does.
      if (!(await Clipboard.hasStringAsync())) return;
      const raw  = await Clipboard.getStringAsync();
      const text = (raw || '').trim();
      if (text.length < MIN_LEN || text.length > MAX_LEN) return;
      if (text === lastHandled.current) return;
      if (text === (currentRef.current || '').trim()) return;
      setSuggestion({ text, tab: tabForText(text) });
    } catch {
      // clipboard unavailable: stay silent
    }
  }, [enabled]);

  // Screen gains focus
  useFocusEffect(useCallback(() => { check(); }, [check]));

  // App returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') check(); });
    return () => sub.remove();
  }, [check]);

  // Setting switched off -> hide
  useEffect(() => { if (!enabled) setSuggestion(null); }, [enabled]);

  const dismiss = useCallback(() => {
    if (suggestion) lastHandled.current = suggestion.text;
    setSuggestion(null);
  }, [suggestion]);

  // Returns the suggestion so the caller can fill the box and scan.
  const accept = useCallback(() => {
    const s = suggestion;
    if (s) lastHandled.current = s.text;
    setSuggestion(null);
    return s;
  }, [suggestion]);

  return { suggestion, dismiss, accept };
}