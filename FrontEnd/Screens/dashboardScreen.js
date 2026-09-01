// TruScan/FrontEnd/Screens/dashboardScreen.js
// Education screen — LEARN / SCAM TYPES / TIPS segmented tabs, each a card list.
// Re-themes to light or dark based on Light Mode.

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../Context/AppContext';
import { getTheme, RADIUS, SPACING, SHADOW } from '../Service/theme';

// ─── CONTENT ──────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'learn',  label: 'Learn' },
  { key: 'types',  label: 'Scam Types' },
  { key: 'tips',   label: 'Tips' },
];

const LEARN_ITEMS = [
  {
    icon: '🎣',
    title: 'What is Phishing?',
    sub: 'Learn how phishing scams steal your personal information.',
    body: [
      'Phishing is when scammers pretend to be a trusted company — a bank, GCash, or a government agency — to trick you into giving up passwords, OTPs, or personal details.',
      'It usually arrives as an email, message, or fake website that looks almost identical to the real one.',
      'The goal is to get you to click a link, log in on a fake page, or reply with sensitive info.',
      "Red flag: urgent language like 'your account will be suspended' or 'verify now'.",
      'If in doubt, go directly to the official app or website instead of clicking a link.',
    ],
  },
  {
    icon: '🎭',
    title: 'Common Scam Techniques',
    sub: 'Learn the most common tricks used by scammers.',
    body: [
      'Urgency and fear — pressuring you to act fast before you can think it through.',
      'Impersonation — pretending to be a bank, courier, government office, or even a relative.',
      'Too-good-to-be-true offers — huge prizes, guaranteed income, or unrealistic discounts.',
      'Spoofed numbers and emails — caller ID or sender name made to look official.',
      'Requests for OTP, passwords, or upfront fees — legitimate organizations never ask for these.',
    ],
  },
  {
    icon: '🛡️',
    title: 'Protect Yourself',
    sub: 'Simple steps to keep you and your loved ones safe online.',
    body: [
      'Never share your OTP, PIN, or password with anyone — even someone claiming to be from your bank.',
      'Verify unfamiliar links or numbers before clicking or calling back.',
      'Turn on two-factor authentication on your banking and eWallet apps.',
      'Talk to family, especially elders, about common scam tactics.',
      "When unsure, pause and verify through the app's official channels before doing anything.",
    ],
  },
  {
    icon: '💬',
    title: 'What is Smishing?',
    sub: 'Learn how scammers use fake SMS messages to steal your data and money.',
    body: [
      'Smishing = SMS + phishing — scam attempts sent through text messages.',
      'Often impersonates banks, GCash/Maya, couriers, or government agencies.',
      'Usually includes a shortened or unfamiliar link paired with urgent wording.',
      "Example: 'Your parcel is on hold, pay ₱50 courier fee here: bit.ly/xxxx'.",
      'Never click links from unknown senders — open the official app instead.',
    ],
  },
  {
    icon: '🎯',
    title: 'How Scammers Target You',
    sub: 'Discover the tactics scammers use to find and manipulate their victims.',
    body: [
      'Scammers often buy leaked contact lists or scrape numbers and emails from data breaches.',
      'They time attacks around payday, holidays, delivery season, or tax season.',
      'Vulnerable groups — the elderly, first-time investors, job seekers — are frequently targeted.',
      'Public social media activity can give scammers details that make their story sound convincing.',
      'Being cautious with what you share publicly meaningfully reduces your risk.',
    ],
  },
];

const SCAM_TYPE_ITEMS = [
  {
    icon: '💳',
    title: 'Financial & eWallet Scams',
    sub: 'Fake payment requests from GCash, Maya, and bank accounts.',
    body: [
      "Fake messages claim an issue with your GCash, Maya, or bank account and ask you to 'verify'.",
      'They may ask for your MPIN, OTP, or card details on a fake look-alike page.',
      'Some pose as buyers or sellers asking for advance GCash payment, then disappear.',
      'Real banks and eWallets will never ask for your OTP or MPIN over chat, call, or text.',
      'Always check your transactions directly inside the official app.',
    ],
  },
  {
    icon: '📦',
    title: 'Delivery Courier Scams',
    sub: 'Fake parcel notifications used to steal your personal and payment details.',
    body: [
      "A fake SMS or email claims your 'parcel is on hold' and asks for a small redelivery fee.",
      'The message usually includes a suspicious link to pay or reschedule delivery.',
      'Legitimate couriers rarely ask for payment through a random link.',
      "If you're not expecting a package, treat the message as suspicious by default.",
      "Verify directly through the courier's official app or hotline, not the link in the text.",
    ],
  },
  {
    icon: '💼',
    title: 'Job Task Scams',
    sub: 'Too-good-to-be-true online jobs designed to scam job seekers.',
    body: [
      "Offers easy income for simple 'tasks' like liking videos or rating products.",
      "Usually starts free, then asks you to 'top up' money to unlock bigger earnings.",
      'Any job that asks YOU to pay money upfront is a major red flag.',
      'Often recruited through Telegram, Facebook groups, or unsolicited text messages.',
      'Legitimate employers never require payment from you to start earning.',
    ],
  },
  {
    icon: '💲',
    title: 'Investment Scams',
    sub: 'Promises of high returns used to trick you into fake investment schemes.',
    body: [
      'Promises of guaranteed high returns with little to no risk are a classic red flag.',
      "Often uses fake testimonials, screenshots of 'earnings', or countdown pressure to rush you.",
      'May be disguised as a crypto, forex, or trading platform.',
      'Check whether the company is registered with the SEC before investing anything.',
      "If it sounds too good to be true, it almost always is.",
    ],
  },
  {
    icon: '💌',
    title: 'Romance Scams',
    sub: 'Fake online relationships used to emotionally manipulate and steal from victims.',
    body: [
      'A scammer builds an online relationship over weeks or months to gain your trust.',
      'Eventually they invent an emergency — a medical bill, travel costs, customs fees — to ask for money.',
      'They often avoid video calls or make excuses for never meeting in person.',
      'A reverse image search of their photos often reveals stolen pictures.',
      "Never send money to someone you haven't met in person, no matter how convincing the story.",
    ],
  },
];

const TIP_ITEMS = [
  {
    icon: '🔒',
    title: 'Never Share Your OTP',
    sub: 'Your OTP is yours alone. No bank, government, or delivery company will ever ask for it.',
    body: [
      'Your OTP (One-Time PIN) is meant only for you — never for banks, couriers, or "agents".',
      'Anyone asking for your OTP is trying to access your account, not help you.',
      'Banks and eWallets already have your account info — they never need you to read out your OTP.',
      'If someone asks for it, hang up immediately and report the number.',
    ],
  },
  {
    icon: '⚠️',
    title: "Don't Click Unknown Links",
    sub: 'Avoid tapping links from unknown numbers or emails — verify first before clicking.',
    body: [
      'Shortened links (bit.ly, tinyurl, etc.) hide the real destination — treat them with extra caution.',
      'Long-press a link to preview the actual URL before tapping, if your device supports it.',
      'When in doubt, search for the official website yourself instead of clicking a shared link.',
      'Fake login pages often look identical to the real one — check the URL spelling carefully.',
    ],
  },
  {
    icon: '✅',
    title: 'Double Check Before You Pay',
    sub: "Always verify the receiver's details before sending money via GCash, Maya, or bank transfer.",
    body: [
      "Confirm the recipient's registered name matches who you actually intend to pay.",
      'Be wary of sellers who insist on GCash/bank transfer only, with no other proof of legitimacy.',
      'For larger transactions, call the person directly to confirm before sending.',
      'Keep transaction receipts or screenshots in case you need to dispute a payment later.',
    ],
  },
  {
    icon: '📞',
    title: 'Hang Up on Suspicious Callers',
    sub: 'If a caller pressures you for personal info or money, hang up and call the official number.',
    body: [
      "Scammers create urgency — 'your account will be closed in 10 minutes' — to stop you from thinking clearly.",
      "It's always okay to hang up and call back using the number on the official website or app.",
      'Never give personal information to someone who called YOU unexpectedly.',
      'Legitimate agencies are always fine with you verifying and calling back later.',
    ],
  },
  {
    icon: '🔄',
    title: 'Keep Your Apps Updated',
    sub: 'Always update your banking and eWallet apps to stay protected from the latest threats.',
    body: [
      'App updates often include security patches that close vulnerabilities scammers exploit.',
      'Only download banking or eWallet apps from official app stores — never from links in messages.',
      "Turn on automatic updates so you're always protected against the newest threats.",
      "Delete apps you no longer use to reduce what's exposed on your device.",
    ],
  },
];

const CONTENT = { learn: LEARN_ITEMS, types: SCAM_TYPE_ITEMS, tips: TIP_ITEMS };

// ─── CARD ─────────────────────────────────────────────────────────────────────

function EduCard({ item, expanded, onToggle, fontSize, styles }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.8}>
      <View style={styles.cardIconWrap}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { fontSize: fontSize.base }]}>{item.title}</Text>
        <Text
          style={[styles.cardSub, { fontSize: fontSize.xs }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {item.sub}
        </Text>

        {expanded && item.body && (
          <View style={styles.bodyList}>
            {item.body.map((line, i) => (
              <View key={i} style={styles.bodyRow}>
                <Text style={[styles.bodyBullet, { fontSize: fontSize.xs }]}>•</Text>
                <Text style={[styles.bodyText, { fontSize: fontSize.xs }]}>{line}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.chevron}>{expanded ? '⌄' : '›'}</Text>
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }) {
  const { fontSize, simpleMode, lightMode } = useApp();
  const COLORS = getTheme(simpleMode, lightMode);
  const styles = makeStyles(COLORS);

  const [activeTab, setActiveTab] = useState('learn');
  const [expanded, setExpanded]   = useState(null);

  const changeTab = (key) => {
    setActiveTab(key);
    setExpanded(null);
  };

  const items = CONTENT[activeTab];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation?.canGoBack?.() && (
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={10}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { fontSize: fontSize.sm }]}>EDUCATION</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Segmented tabs */}
        <View style={styles.tabRow}>
          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => changeTab(t.key)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.tabLabel,
                  { fontSize: fontSize.xs, color: active ? '#FFFFFF' : COLORS.muted },
                ]}>
                  {t.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Card list */}
        {items.map((item, i) => (
          <EduCard
            key={`${activeTab}-${i}`}
            item={item}
            expanded={expanded === i}
            onToggle={() => setExpanded(expanded === i ? null : i)}
            fontSize={fontSize}
            styles={styles}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const makeStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backArrow:   { color: COLORS.ink, fontSize: 20, fontWeight: '700' },
  headerTitle: { color: COLORS.ink, fontWeight: '800', letterSpacing: 1 },

  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  tabRow: {
    flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg,
  },
  tabBtn: {
    flex: 1, paddingVertical: 9, borderRadius: RADIUS.pill,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabLabel:     { fontWeight: '700', letterSpacing: 0.3 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.card,
  },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.infoBg,
    borderWidth: 1.5, borderColor: COLORS.infoBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIcon:  { fontSize: 19 },
  cardTitle: { color: COLORS.ink, fontWeight: '700', marginBottom: 3 },
  cardSub:   { color: COLORS.muted, lineHeight: 16 },
  chevron:   { color: COLORS.muted, fontSize: 18, fontWeight: '600', marginLeft: 4, marginTop: 2 },

  bodyList: { marginTop: SPACING.sm, gap: 6 },
  bodyRow:  { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  bodyBullet: { color: COLORS.primary, lineHeight: 18 },
  bodyText:   { color: COLORS.muted, lineHeight: 18, flex: 1 },
});