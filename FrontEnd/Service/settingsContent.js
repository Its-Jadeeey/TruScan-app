// TruScan/FrontEnd/Service/settingsContent.js
// Help Center / Privacy / Terms / About text in English ('en') and Tagalog ('tl').
export const SETTINGS_CONTENT = {
  en: {
    faqs: [
      { q: 'How does TruScan detect scams?',
        a: 'TruScan uses a machine learning model (TF-IDF with a linear SVM) to analyze messages for common Filipino scam indicators — urgency phrases, OTP requests, suspicious short links, and more.' },
      { q: 'Is my scanned message stored or shared?',
        a: 'No. A message you scan is only sent to the analysis engine to get a result. It is never saved anywhere unless you choose to submit it as a report to the community database.' },
      { q: 'What should I do if I get a SCAM result?',
        a: "Don't click any links, don't share personal or financial information, and consider blocking the sender. You can also report it from the Reports tab to help protect others." },
      { q: 'Can TruScan scan images or screenshots?',
        a: 'Not yet — TruScan currently analyzes pasted text only (SMS content, email content, or a link). Screenshot scanning may be added in a future update.' },
      { q: 'Why did a safe-looking message get flagged?',
        a: 'The detection engine errs on the side of caution, so borderline messages may be marked suspicious even if they turn out to be fine. If you believe a result is wrong, you can report it for review.' },
    ],
    privacy: `TruScan does not require an account and does not collect your name, phone number, or email address.

Message text you scan (but don't report) is sent only to the analysis server to produce a result and is not stored.

When you choose to submit a report, the message text, the type and category you picked, and your optional remark are saved anonymously in the community database for review by the TruScan administrators. Please remove personal details, such as your own phone number, account numbers, or passwords, before reporting.

To limit abuse, the server briefly counts requests per network address in its memory. This is not saved in the database.

We do not sell or share any data with third parties. Report data is used solely to improve scam detection accuracy and to warn others about active scam patterns.`,
    terms: `By using TruScan, you agree to use the app responsibly and to submit reports in good faith to help protect the community.

TruScan provides scam-likelihood analysis as a helpful guide, not a guarantee. Always use your own judgment before acting on a message, and verify anything financial through official channels.

Submitting false or malicious reports, or attempting to disrupt the service, may result in restricted access.

TruScan is provided "as is" without warranty of any kind. The developers are not liable for losses resulting from scams that were not detected, or from decisions made based on app results.`,
    about: `TruScan v1.1.0

A Mobile Application Intrusion Detection System for Scam and Phishing in the Filipino Context.

Developed as a thesis project. Uses a machine learning model combined with keyword analysis to detect Taglish scam patterns across SMS, email, and links.

Tech stack: React Native, FastAPI + Scikit-learn, Firebase Firestore.`,
  },
  tl: {
    faqs: [
      { q: 'Paano natutuklasan ng TruScan ang panloloko?',
        a: 'Gumagamit ang TruScan ng machine learning model (TF-IDF at linear SVM) para suriin ang mga mensahe para sa karaniwang palatandaan ng panloloko sa Pilipinas — mga salitang nagmamadali, paghingi ng OTP, kahina-hinalang maiikling link, at iba pa.' },
      { q: 'Sine-save o ibinabahagi ba ang mensaheng sinuri ko?',
        a: 'Hindi. Ang mensaheng sinuri mo ay ipinapadala lamang sa makinang nagsusuri para makakuha ng resulta. Hindi ito sine-save kahit saan maliban kung pipiliin mong isumite ito bilang ulat sa database ng komunidad.' },
      { q: 'Ano ang gagawin ko kung PANLOLOKO ang resulta?',
        a: 'Huwag pindutin ang anumang link, huwag magbigay ng personal o pinansyal na impormasyon, at isaalang-alang ang pag-block sa nagpadala. Maaari mo rin itong iulat sa tab ng Ulat para makatulong na protektahan ang iba.' },
      { q: 'Kaya bang suriin ng TruScan ang mga larawan o screenshot?',
        a: 'Hindi pa — sinusuri lamang ng TruScan ang inilagay na teksto (laman ng SMS, laman ng email, o link). Maaaring idagdag ang pagsusuri ng screenshot sa susunod na update.' },
      { q: 'Bakit may mensaheng mukhang ligtas pero namarkahan?',
        a: 'Mas pinipili ng sistema ang mag-ingat, kaya maaaring mamarkahang kahina-hinala ang mga mensaheng hindi tiyak kahit ligtas pala. Kung sa tingin mo ay mali ang resulta, maaari mo itong iulat para suriin.' },
    ],
    privacy: `Hindi nangangailangan ng account ang TruScan at hindi nito kinokolekta ang iyong pangalan, numero ng telepono, o email address.

Ang teksto ng mensaheng sinuri mo (pero hindi iniulat) ay ipinapadala lamang sa server na nagsusuri para makakuha ng resulta at hindi sine-save.

Kapag pinili mong magsumite ng ulat, ang teksto ng mensahe, ang uri at kategoryang pinili mo, at ang opsyonal mong puna ay sine-save nang hindi nagpapakilala sa database ng komunidad para suriin ng mga tagapamahala ng TruScan. Alisin muna ang mga personal na detalye, tulad ng sarili mong numero ng telepono, numero ng account, o password, bago mag-ulat.

Para maiwasan ang pang-aabuso, saglit na binibilang ng server sa memorya nito ang mga kahilingan ayon sa network address. Hindi ito sine-save sa database.

Hindi namin ibinebenta o ibinabahagi ang anumang data sa ibang partido. Ang data ng ulat ay ginagamit lamang para mapabuti ang pagtuklas ng panloloko at para balaan ang iba tungkol sa mga kasalukuyang panloloko.`,
    terms: `Sa paggamit ng TruScan, sumasang-ayon kang gamitin ang app nang responsable at magsumite ng ulat nang may mabuting hangarin para protektahan ang komunidad.

Nagbibigay ang TruScan ng pagsusuri sa posibilidad ng panloloko bilang gabay, hindi bilang garantiya. Gamitin palagi ang sarili mong pagpapasya bago kumilos sa isang mensahe, at patunayan ang anumang may kinalaman sa pera sa opisyal na paraan.

Ang pagsusumite ng huwad o mapaminsalang ulat, o pagtatangkang sirain ang serbisyo, ay maaaring magresulta sa paghihigpit ng access.

Ibinibigay ang TruScan nang "kung ano ito" na walang anumang garantiya. Hindi mananagot ang mga developer sa mga pagkalugi mula sa mga panloloko na hindi natuklasan, o sa mga desisyong ibinase sa resulta ng app.`,
    about: `TruScan v1.1.0

Isang Mobile Application na Intrusion Detection System para sa Panloloko at Phishing sa Konteksto ng mga Pilipino.

Binuo bilang proyektong tesis. Gumagamit ng machine learning model at pagsusuri ng mga keyword para tuklasin ang mga Taglish na panloloko sa SMS, email, at link.

Mga gamit: React Native, FastAPI + Scikit-learn, Firebase Firestore.`,
  },
};