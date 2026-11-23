/**
 * BioVibe — Proaktif Yapay Zekâ Sağlık ve Yaşam Asistanı
 * Demo & MVP ön yüz prototipi (tek dosya: React + Tailwind CSS + Lucide)
 *
 * Modüller:
 *  2.1 Ulusal Sağlık Sistemi Entegrasyonu (E-Nabız & küresel sağlık API mantığı — simülasyon)
 *  2.2 Akıllı Fail-Safe Analiz Modu (kayıt yok / geçmişle eşleşmeyen anomali)
 *  2.3 Empatik Yapay Zekâ Sohbeti + 3-3-3 Nefes Egzersizi
 *  2.4 Kademeli Talimat ve 112 Acil Durum Eskalasyonu
 *  3   Demo Simülasyon Kontrol Paneli (4 senaryo + E-Nabız anahtarı)
 *
 * Not: Tüm biyometrik veriler, sağlık kayıtları, kişi ve kurum adları KURGUSALDIR.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, BatteryMedium, Bed, Bell, Bluetooth, Brain,
  CalendarPlus, CheckCircle2, ChevronDown, ChevronUp, Clock, Database, Droplets,
  FlaskConical, Footprints, GlassWater, Globe, Heart, HeartPulse, Hospital, Info,
  Loader2, Lock, MapPin, Maximize2, MessageCircle, Moon, Navigation, Phone,
  PhoneCall, PhoneOff, Pill, RotateCcw, Send, ShieldAlert, ShieldCheck, Siren,
  Smile, Sparkles, Square, Sun, Stethoscope, Thermometer, User, Waves, Wind, X, XCircle, Zap,
} from 'lucide-react'
import logo from './assets/logo.png'

/* ════════════════════════════════════════════════════════════════════
   1) SABİTLER & KURGUSAL VERİLER
   ════════════════════════════════════════════════════════════════════ */

// Sunum sırasında yanlışlıkla gerçek acil çağrı yapılmasın diye true.
// Gerçek üründe false yapıldığında buton doğrudan tel:112 bağlantısını açar.
const DEMO_MODE = true

const REGIONS = {
  TR: { flag: '🇹🇷', country: 'Türkiye', system: 'E-Nabız', provider: 'T.C. Sağlık Bakanlığı', auth: 'e-Devlet OAuth 2.0', privacy: 'KVKK', emergency: '112', appointment: 'MHRS' },
  DE: { flag: '🇩🇪', country: 'Almanya', system: 'ePA', provider: 'gematik Telematik Altyapısı', auth: 'gematik IDP', privacy: 'GDPR', emergency: '112', appointment: '116117 Randevu' },
  GB: { flag: '🇬🇧', country: 'Birleşik Krallık', system: 'NHS App', provider: 'NHS England · GP Connect', auth: 'NHS login', privacy: 'UK GDPR', emergency: '999', appointment: 'NHS App' },
  US: { flag: '🇺🇸', country: 'ABD', system: 'FHIR Kaydı', provider: 'HL7 FHIR · Blue Button 2.0', auth: 'SMART on FHIR', privacy: 'HIPAA', emergency: '911', appointment: 'Hasta Portalı' },
}

const PROFILE = {
  name: 'İrem Kaya',
  firstName: 'İrem',
  age: 21,
  gender: 'Kadın',
  blood: 'A Rh(+)',
  body: '168 cm · 59 kg',
  device: 'BioVibe Band S2',
  emergencyContact: { name: 'Ayşe Kaya (Annesi)', phone: '0532 *** ** 47' },
}

const MEDICAL_RECORD = {
  chronic: [
    { name: 'Hafif Aritmi (Ventriküler Erken Vuru)', code: 'ICD-10 I49.3', since: '2023' },
    { name: 'Panik Bozukluk', code: 'ICD-10 F41.0', since: '2024' },
  ],
  meds: [
    { name: 'Sertralin 50 mg', dose: 'Günde 1 kez, sabah', doctor: 'Dr. Selin Arslan · Psikiyatri' },
    { name: 'Propranolol 10 mg', dose: 'Gerektiğinde (çarpıntı/atak sırasında)', doctor: 'Dr. Murat Demir · Kardiyoloji' },
  ],
  allergies: ['Penisilin'],
  lastVisit: '12.09.2026 · Kardiyoloji (24 saatlik Holter: benign VES)',
}

const FACILITIES = [
  { name: 'Bölge Eğitim ve Araştırma Hastanesi', type: 'Acil Servis · Kardiyoloji', dist: '2,4 km', eta: '7 dk' },
  { name: 'İlçe Devlet Hastanesi', type: 'Göğüs Hastalıkları · Psikiyatri', dist: '3,8 km', eta: '11 dk' },
  { name: 'Aile Sağlığı Merkezi (ASM)', type: 'Birinci basamak', dist: '0,9 km', eta: '3 dk' },
]

const SCENARIOS = {
  normal: { key: 'normal', label: 'Normal Durum', short: 'Normal', risk: 'normal', icon: Smile, desc: 'Nabız 65-75 · SpO₂ %98 · Stres düşük' },
  sleep: { key: 'sleep', label: 'Uyku Anomalisi', short: 'Uyku', risk: 'medium', icon: Moon, desc: 'Uyku modunda 118 BPM · SpO₂ düşüşü' },
  panic: { key: 'panic', label: 'Panik Atak', short: 'Panik', risk: 'high', icon: Wind, desc: '130+ BPM · yüksek stres & terleme' },
  critical: { key: 'critical', label: 'Kritik Anomali', short: 'Kritik', risk: 'critical', icon: Siren, desc: '165+ BPM ya da bradikardi + düşük SpO₂' },
}

const BASE_TARGETS = {
  normal: { bpm: 71, spo2: 98, stress: 18, eda: 2.1, hrv: 62, temp: 36.6 },
  sleep: { bpm: 118, spo2: 91, stress: 46, eda: 4.8, hrv: 24, temp: 36.9 },
  panic: { bpm: 136, spo2: 97, stress: 88, eda: 11.5, hrv: 18, temp: 37.0 },
  tachy: { bpm: 172, spo2: 89, stress: 94, eda: 13.2, hrv: 9, temp: 37.2 },
  brady: { bpm: 34, spo2: 84, stress: 71, eda: 6.1, hrv: 12, temp: 36.1 },
}

// Tailwind sınıfları derleme anında taranır; bu yüzden dinamik değil, sabit eşleme.
const RISK = {
  normal: { label: 'Düşük', text: 'text-brand-700', soft: 'bg-brand-50', border: 'border-brand-200', solid: 'bg-emerald-500', stroke: '#7d45ad', hero: 'from-brand-500 via-brand-600 to-brand-900' },
  medium: { label: 'Orta', text: 'text-amber-700', soft: 'bg-amber-50', border: 'border-amber-200', solid: 'bg-amber-500', stroke: '#f59e0b', hero: 'from-brand-950 via-brand-900 to-brand-800' },
  high: { label: 'Yüksek', text: 'text-orange-700', soft: 'bg-orange-50', border: 'border-orange-200', solid: 'bg-orange-500', stroke: '#f97316', hero: 'from-orange-500 via-amber-500 to-yellow-500' },
  critical: { label: 'Kritik', text: 'text-red-700', soft: 'bg-red-50', border: 'border-red-300', solid: 'bg-red-600', stroke: '#ef4444', hero: 'from-red-600 via-rose-600 to-red-700' },
}

const BREATH_PHASES = {
  prep: { label: 'Hazır ol', hint: 'Rahat bir pozisyon al', next: 'inhale', secs: 1, scale: 0.55, color: 'from-brand-100 to-brand-300' },
  inhale: { label: 'Nefes Al', hint: 'Burnundan yavaşça', next: 'hold', secs: 3, scale: 1, color: 'from-brand-300 to-brand-500' },
  hold: { label: 'Tut', hint: 'Omuzların gevşek kalsın', next: 'exhale', secs: 3, scale: 1, color: 'from-brand-500 to-brand-900' },
  exhale: { label: 'Nefes Ver', hint: 'Ağzından yavaşça', next: 'inhale', secs: 3, scale: 0.55, color: 'from-emerald-300 to-brand-400' },
}

/* ════════════════════════════════════════════════════════════════════
   2) YARDIMCI FONKSİYONLAR
   ════════════════════════════════════════════════════════════════════ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const fmtTime = (d) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const fmtHM = (d) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
const fmtDur = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
let _id = 0
const uid = () => `${Date.now()}-${++_id}`

/** Senaryo + nefes egzersizi ilerlemesine göre sensörlerin yöneldiği hedef değerler */
function getTargets(scenario, variant, cycles) {
  if (scenario === 'critical') return BASE_TARGETS[variant]
  const t = { ...BASE_TARGETS[scenario] }
  if (scenario === 'panic') {
    t.bpm = Math.max(90, t.bpm - cycles * 7)
    t.stress = Math.max(38, t.stress - cycles * 8)
    t.eda = Math.max(4, t.eda - cycles * 1.2)
    t.hrv = Math.min(45, t.hrv + cycles * 4)
  }
  if (scenario === 'sleep') {
    t.bpm = Math.max(78, t.bpm - cycles * 6)
    t.spo2 = Math.min(96, t.spo2 + cycles * 0.8)
    t.stress = Math.max(25, t.stress - cycles * 4)
  }
  return t
}

function rhythmLabel(scenario, variant, bpm) {
  if (scenario === 'sleep') return 'Düzensiz ritim (olası erken vurular)'
  if (scenario === 'critical') return variant === 'brady' ? 'Ciddi bradikardi' : 'Ciddi taşikardi'
  if (bpm > 100) return 'Sinüs taşikardisi'
  if (bpm < 50) return 'Bradikardi'
  return 'Normal sinüs ritmi'
}

/** Senaryo × kayıt durumu → AI değerlendirme ve kademeli talimatlar */
function buildGuidance({ scenario, hasRecord, region, variant }) {
  const sys = region.system
  if (scenario === 'normal') return null

  if (scenario === 'critical') {
    return {
      mode: 'emergency',
      title: 'Kritik Eşik · Acil Eskalasyon',
      summary: variant === 'brady'
        ? 'Tehlikeli bradikardi ile birlikte düşük oksijen satürasyonu. Bekleme yapılmadan acil yardım çağrılmalı.'
        : 'Hayati risk eşiğini aşan taşikardi ve oksijen düşüşü. Bekleme yapılmadan acil yardım çağrılmalı.',
      level: 'Kritik / Hayati Risk',
      actions: [
        { icon: Bed, text: 'Hemen otur ya da sırt üstü uzan; ayağa kalkma.' },
        { icon: PhoneCall, text: `${region.emergency} Acil Yardım hattını ara (tek dokunuş).` },
        { icon: User, text: 'Yanında biri varsa haber ver, kapıyı açık bırak.' },
        { icon: ShieldAlert, text: 'Ekip gelince Acil Durum Tıbbi Özet Kartı’nı göster.' },
      ],
    }
  }

  if (scenario === 'sleep') {
    if (hasRecord) {
      return {
        mode: 'hybrid',
        title: 'Kişiselleştirilmiş Yönlendirme + Fail-Safe Ek Analiz',
        summary: `${sys} kaydındaki aritmi geçmişi ritim düzensizliğiyle eşleşti. SpO₂ düşüşü ise kayıtlı geçmişle eşleşmediği için Fail-Safe analizle ayrıca değerlendirildi.`,
        level: 'Orta Düzey Sapma',
        matches: [
          { ok: true, text: 'Ritim düzensizliği ↔ Hafif Aritmi (VES) geçmişi' },
          { ok: false, text: 'SpO₂ %91 düşüşü ↔ kayıtlı karşılığı yok → Fail-Safe' },
        ],
        actions: [
          { icon: Bed, text: 'Yatakta yavaşça doğrul ve otur.' },
          { icon: GlassWater, text: 'Bir bardak su iç.' },
          { icon: Wind, text: '3-3-3 nefes egzersizi ile 15 dk birlikte izleyelim.' },
          { icon: Stethoscope, text: 'Dr. Murat Demir (Kardiyoloji) ile kontrol randevusu öneriliyor.' },
          { icon: Hospital, text: 'Oksijen düşüşü için Göğüs Hastalıkları · Uyku Polikliniği önerisi.' },
        ],
        branches: ['Kardiyoloji (takip)', 'Göğüs Hastalıkları · Uyku Polikliniği'],
        urgency: '15 dk içinde normale dönmezse bugün içinde değerlendirme',
      }
    }
    return {
      mode: 'failsafe',
      title: 'Fail-Safe Analiz Modu',
      summary: `${sys} kaydı bulunamadı; sistem kilitlenmeden sensör verisini kendi içinde analiz etti.`,
      level: 'Orta Düzey Sapma',
      possibilities: [
        { name: 'Uyku ilişkili solunum bozukluğu (olası apne)', p: 46 },
        { name: 'Paroksismal ritim düzensizliği', p: 34 },
        { name: 'Gece (nokturnal) panik atağı', p: 20 },
      ],
      actions: [
        { icon: Bed, text: 'Yavaşça doğrul ve otur.' },
        { icon: GlassWater, text: 'Bir bardak su iç, ortamı havalandır.' },
        { icon: Wind, text: '3-3-3 nefes egzersizi yap.' },
      ],
      branches: ['Kardiyoloji', 'Göğüs Hastalıkları · Uyku Polikliniği'],
      urgency: '24-48 saat içinde poliklinik başvurusu',
      facilities: true,
    }
  }

  // panic
  if (hasRecord) {
    return {
      mode: 'personal',
      title: 'Kişiselleştirilmiş Yönlendirme',
      summary: `Belirtiler ${sys} kaydındaki Panik Bozukluk geçmişi ve önceki ataklarla uyumlu.`,
      level: 'Yüksek Stres / Atak',
      matches: [
        { ok: true, text: 'Ani nabız + terleme + stres ↔ Panik Bozukluk (F41.0)' },
        { ok: true, text: 'Çarpıntı ↔ Hafif Aritmi geçmişi (kardiyolog takibinde)' },
      ],
      actions: [
        { icon: Wind, text: '3-3-3 nefes egzersizi (otomatik başlatıldı).' },
        { icon: Bed, text: 'Güvenli bir yere otur, omuzlarını gevşet.' },
        { icon: GlassWater, text: 'Küçük yudumlarla su iç.' },
        { icon: Pill, text: 'Propranolol 10 mg “gerektiğinde” reçeteli — doktorunun talimatına göre.' },
        { icon: Clock, text: 'Bugünkü Sertralin 50 mg dozu kontrol ediliyor.' },
      ],
      branches: ['Psikiyatri (Dr. Selin Arslan) · takip'],
      urgency: 'Belirtiler 20 dk içinde azalmazsa acil değerlendirme',
    }
  }
  return {
    mode: 'failsafe',
    title: 'Fail-Safe Analiz Modu',
    summary: `${sys} kaydı bulunamadı; sensör verisi kendi içinde analiz edildi.`,
    level: 'Yüksek Stres / Atak',
    possibilities: [
      { name: 'Panik atak', p: 58 },
      { name: 'Supraventriküler taşikardi (SVT)', p: 24 },
      { name: 'Metabolik nedenler (hipoglisemi, tiroid)', p: 18 },
    ],
    actions: [
      { icon: Wind, text: '3-3-3 nefes egzersizi (otomatik başlatıldı).' },
      { icon: Bed, text: 'Güvenli bir yere otur.' },
      { icon: GlassWater, text: 'Su iç; son öğününü hatırla.' },
    ],
    branches: ['Psikiyatri', 'Kardiyoloji (ritim kontrolü)'],
    urgency: 'Göğüs ağrısı / bayılma hissi olursa hemen 112',
    facilities: true,
  }
}

/* ════════════════════════════════════════════════════════════════════
   3) ANA UYGULAMA
   ════════════════════════════════════════════════════════════════════ */

export default function App() {
  // ── Demo kontrol durumu
  const [scenario, setScenario] = useState('normal')
  const [hasRecord, setHasRecord] = useState(true)
  const [regionKey, setRegionKey] = useState('TR')
  const [variant, setVariant] = useState('tachy')
  const [panelOpen, setPanelOpen] = useState(true)
  const region = REGIONS[regionKey]

  // ── Sensör verileri
  const [vitals, setVitals] = useState(BASE_TARGETS.normal)
  const [history, setHistory] = useState(() => Array.from({ length: 60 }, () => ({ bpm: 70 + Math.random() * 3, spo2: 98 })))
  const vitalsRef = useRef(vitals)
  vitalsRef.current = vitals

  // ── Akış durumu
  const [query, setQuery] = useState({ status: 'idle', step: -1 }) // idle | querying | found | notfound
  const [flowStage, setFlowStage] = useState(0)
  const [anomalyStart, setAnomalyStart] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [events, setEvents] = useState([])

  // ── AI sohbet
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [unread, setUnread] = useState(0)

  // ── Nefes egzersizi
  const [breath, setBreath] = useState({ active: false, phase: 'prep', remaining: 1, cycles: 0 })

  // ── Modallar & bildirimler
  const [call, setCall] = useState(null) // null | { phase: 'dialing'|'connected', startedAt }
  const [cardFull, setCardFull] = useState(false)
  const [toast, setToast] = useState(null)
  const [medTaken, setMedTaken] = useState(null)

  // ── Zamanlayıcı yönetimi (senaryo değişince hepsi temizlenir)
  const timers = useRef([])
  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }, [])
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const chatOpenRef = useRef(chatOpen)
  chatOpenRef.current = chatOpen

  const log = useCallback((text, level = 'info') => {
    setEvents((e) => [{ id: uid(), t: new Date(), text, level }, ...e].slice(0, 40))
  }, [])

  const notify = useCallback((text, tone = 'info') => {
    setToast({ id: uid(), text, tone })
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(id)
  }, [toast])

  const pushMsg = useCallback((msg) => {
    setMessages((m) => [...m, { id: uid(), time: new Date(), ...msg }])
    if (!chatOpenRef.current && msg.from === 'ai') setUnread((u) => u + 1)
  }, [])

  /** AI mesajını "yazıyor…" göstergesiyle zamanlanmış biçimde gönderir */
  const sayAt = useCallback((ms, text, extra = {}) => {
    later(() => setTyping(true), Math.max(0, ms - 900))
    later(() => {
      setTyping(false)
      pushMsg({ from: 'ai', text, ...extra })
      extra.onShow && extra.onShow()
    }, ms)
  }, [later, pushMsg])

  // ── Nefes egzersizi kontrolleri
  const startBreathing = useCallback(() => {
    setBreath({ active: true, phase: 'prep', remaining: 1, cycles: 0 })
  }, [])
  const stopBreathing = useCallback(() => {
    setBreath((b) => ({ ...b, active: false }))
  }, [])

  /* ─────────────────────── SENARYO MOTORU ─────────────────────── */
  const runScenario = useCallback((key, opts = {}) => {
    const rec = opts.record ?? hasRecord
    const reg = REGIONS[opts.region ?? regionKey]
    const vr = opts.variant ?? variant
    const sys = reg.system
    const fn = PROFILE.firstName

    clearTimers()
    setBreath({ active: false, phase: 'prep', remaining: 1, cycles: 0 })
    setTyping(false)
    setCall(null)
    setCardFull(false)
    setMedTaken(null)
    setScenario(key)
    setQuery({ status: 'idle', step: -1 })
    setFlowStage(0)
    setUnread(0)
    setMessages([{ id: uid(), from: 'system', text: `${SCENARIOS[key].label} simülasyonu başlatıldı · ${sys}: ${rec ? 'Kayıt Aktif' : 'Kayıt Yok'}`, time: new Date() }])

    if (key === 'normal') {
      setAnomalyStart(null)
      setChatOpen(false)
      log('Sensörler normal aralıkta · sürekli izleme aktif', 'ok')
      sayAt(500, `Merhaba ${fn} ☀️ Tüm değerlerin normal aralıkta. Dün gece 7 saat 12 dakika uyudun, uyku skorun 84. Bugün su hedefinin yarısına geldin 💧`)
      if (rec) sayAt(1700, 'Küçük bir hatırlatma: Sertralin 50 mg dozun her sabah 09:00’da. Bir şey hissedersen buradayım.')
      return
    }

    setAnomalyStart(Date.now())
    const Q = key === 'critical' ? 800 : key === 'panic' ? 1800 : 1500 // sorgu başlangıcı
    const I = key === 'critical' ? 300 : 650 // sorgu adım aralığı
    const nSteps = rec ? 5 : 3
    const done = Q + nSteps * I

    // 1) Anomali tespiti
    later(() => {
      setFlowStage(1)
      const v = getTargets(key, vr, 0)
      log(`Anomali algılandı: ${Math.round(v.bpm)} BPM · SpO₂ %${Math.round(v.spo2)} · Stres ${Math.round(v.stress)}`, key === 'critical' ? 'critical' : 'warn')
    }, key === 'critical' ? 400 : 900)

    // 2) Ulusal sağlık veritabanı sorgusu (adım adım)
    later(() => {
      setFlowStage(2)
      setQuery({ status: 'querying', step: 0 })
      log(`${sys} sorgusu başlatıldı (${reg.auth})`, 'info')
    }, Q)
    for (let i = 1; i < nSteps; i++) later(() => setQuery({ status: 'querying', step: i }), Q + i * I)
    later(() => {
      if (rec) {
        setQuery({ status: 'found', step: 5 })
        log(`${sys}: 2 kronik tanı, 2 reçeteli ilaç, 1 alerji bulundu`, 'ok')
        if (key === 'sleep') log('SpO₂ düşüşü kayıtlı geçmişle eşleşmedi → Fail-Safe ek analiz', 'warn')
      } else {
        setQuery({ status: 'notfound', step: 2 })
        log(`${sys}: kayıt bulunamadı → Fail-Safe Mod devrede`, 'warn')
      }
      setFlowStage(3)
    }, done)
    later(() => setFlowStage(4), done + 700)
    later(() => {
      setFlowStage(5)
      if (key === 'critical') log(`Kritik eşik: ${reg.emergency} yönlendirmesi + Acil Durum Kartı oluşturuldu`, 'critical')
      else log(key === 'panic' ? 'Kademeli talimat: nefes + takip (yüksek)' : 'Kademeli talimat: dinlenme + poliklinik (orta)', 'info')
    }, done + 1500)

    /* ─── Uyku halinde anomali ─── */
    if (key === 'sleep') {
      later(() => { setChatOpen(true); setUnread(0); log('AI asistan kullanıcıyı nazikçe uyandırdı', 'info') }, 900)
      sayAt(1400, `${fn}, uyandırdığım için kusura bakma 🌙 Uykunda nabzın birden 118 BPM’e yükseldi ve kandaki oksijen %91’e düştü.`)
      sayAt(3100, 'Önce şunu bil: şu an yanındayım ve durumu birlikte takip ediyoruz. Yatakta yavaşça doğrulup oturabilir misin?')
      if (rec) {
        sayAt(done + 900, `${sys} kayıtlarına baktım. Hafif aritmi geçmişin var ve bu ritim düzensizliği Eylül’deki Holter kaydınla benzer görünüyor.`)
        sayAt(done + 2700, 'Ancak oksijen düşüşü kayıtlı geçmişinle eşleşmiyor; bu kısmı Fail-Safe analizle ayrıca değerlendirdim ve Uyku Polikliniği önerisi ekledim.')
        sayAt(done + 4600, 'Şimdilik önerim: bir bardak su iç, birlikte 3-3-3 nefes egzersizi yapalım ve 15 dakika değerlerini izleyelim. Normale dönmezse kardiyoloğun Dr. Murat Demir’den kontrol randevusu alalım.', {
          actions: [{ label: 'Nefes egzersizine başla', action: 'breath', icon: 'wind' }, { label: 'Randevu öner', action: 'appointment', icon: 'calendar' }],
        })
      } else {
        sayAt(done + 900, `${sys}’da sana ait bir kayıt bulamadım — sorun değil, sistem kilitlenmez. Fail-Safe analiz moduna geçtim ve sensör verilerini kendi içimde değerlendirdim.`)
        sayAt(done + 2800, 'Uyku sırasında nabız artışıyla birlikte oksijen düşüşü, uykuda solunum sorunları ya da ritim düzensizliğiyle ilişkili olabilir. Bu bir tanı değil ama kontrol ettirmeye değer.')
        sayAt(done + 4700, 'Sana en uygun branşlar: Kardiyoloji ve Göğüs Hastalıkları (Uyku Polikliniği). En yakın sağlık kuruluşlarını panelde listeledim.', {
          actions: [{ label: 'Nefes egzersizine başla', action: 'breath', icon: 'wind' }, { label: 'En yakın kuruluşlar', action: 'facilities', icon: 'map' }],
        })
      }
    }

    /* ─── Panik atak ─── */
    if (key === 'panic') {
      later(() => { setChatOpen(true); setUnread(0); log('AI Kriz Asistanı sohbeti otomatik açıldı', 'warn') }, 600)
      sayAt(1000, `${fn}, nabzın birkaç saniye içinde 134 BPM’e çıktı ve stres seviyen çok yükseldi. Şu an güvendesin, seninleyim. 💙`)
      sayAt(2500, 'Birlikte nefes alalım. Ekrandaki halkayı takip et: 3 saniye nefes al, 3 saniye tut, 3 saniye ver.', {
        onShow: () => { startBreathing(); log('3-3-3 Nefes Egzersizi başlatıldı', 'info') },
      })
      if (rec) {
        sayAt(done + 1600, `Kayıtlarında Panik Bozukluk geçmişin görünüyor; yaşadığın belirtiler önceki ataklarınla uyumlu. Bu his geçecek — daha önce de geçti.`)
        sayAt(done + 3800, 'Kardiyoloğun Dr. Murat Demir, çarpıntı anları için “gerektiğinde” Propranolol 10 mg yazmış. Daha önce bu durum için önerildiyse doktorunun talimatına göre kullanabilirsin. Bu arada, bugünkü Sertralin dozunu aldın mı?', {
          actions: [{ label: 'Evet, aldım', action: 'med_yes', icon: 'pill' }, { label: 'Henüz almadım', action: 'med_no', icon: 'clock' }],
        })
      } else {
        sayAt(done + 1600, `${sys}’da kayıt bulunamadı; Fail-Safe modda sensör verilerini analiz ettim. Ani nabız artışı, terleme ve yüksek stres birlikte panik atakla uyumlu görünüyor — yine de ritim bozukluğu ayırt edilmeli.`)
        sayAt(done + 3800, 'Atak geçtikten sonra Psikiyatri ve kontrol amaçlı Kardiyoloji polikliniğine başvurmanı öneririm. Göğüs ağrısı, bayılma hissi ya da nefes darlığı artarsa hemen söyle — 112’yi birlikte ararız.', {
          actions: [{ label: 'En yakın kuruluşlar', action: 'facilities', icon: 'map' }, { label: 'Göğsümde ağrı var', action: 'chestpain', icon: 'alert' }],
        })
      }
    }

    /* ─── Kritik anomali ─── */
    if (key === 'critical') {
      later(() => { setChatOpen(true); setUnread(0) }, 500)
      const vt = BASE_TARGETS[vr]
      sayAt(1100, `${fn}, beni dinle. Nabzın ${vt.bpm} BPM ve oksijenin %${vt.spo2}. Bu, hemen tıbbi yardım gerektiren bir durum.`)
      sayAt(2700, 'Panik yapmana gerek yok, ne yapacağımızı biliyoruz. Lütfen şimdi otur ya da sırt üstü uzan.')
      sayAt(4300, `Şimdi ${reg.emergency}’yi arayalım — kırmızı butona dokunman yeterli. Konumun ve tıbbi özet kartın ekiple paylaşılacak.`, {
        actions: [{ label: `${reg.emergency}’yi Ara`, action: 'call', icon: 'phone', danger: true }],
      })
      later(() => {
        log(`Acil durum kişisi bilgilendirildi: ${PROFILE.emergencyContact.name}`, 'critical')
        notify(`Acil durum kişisi bilgilendirildi · ${PROFILE.emergencyContact.name} (simülasyon)`, 'critical')
      }, 5200)
      sayAt(6400, 'Kapıyı açık bırakabiliyorsan bırak, yanında biri varsa ona haber ver. Ekip geldiğinde ekrandaki Acil Durum Kartını göster. Ben buradayım, seni bırakmıyorum.')
    }
  }, [hasRecord, regionKey, variant, later, log, notify, sayAt, startBreathing])

  // İlk açılış
  const booted = useRef(false)
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    runScenario('normal')
    return () => clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ─────────────────────── SENSÖR SİMÜLASYONU ─────────────────────── */
  const breathCyclesRef = useRef(0)
  breathCyclesRef.current = breath.cycles
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
      setVitals((v) => {
        const t = getTargets(scenario, variant, breathCyclesRef.current)
        const k = scenario === 'critical' ? 0.35 : 0.2
        const irregular = scenario === 'sleep'
        const n = (amp) => (Math.random() - 0.5) * amp
        const next = {
          bpm: clamp(v.bpm + (t.bpm - v.bpm) * k + n(irregular ? 12 : 2.5), 28, 210),
          spo2: clamp(v.spo2 + (t.spo2 - v.spo2) * k + n(0.6), 75, 100),
          stress: clamp(v.stress + (t.stress - v.stress) * k + n(3), 0, 100),
          eda: clamp(v.eda + (t.eda - v.eda) * k + n(0.3), 0.5, 20),
          hrv: clamp(v.hrv + (t.hrv - v.hrv) * k + n(2), 5, 120),
          temp: clamp(v.temp + (t.temp - v.temp) * k + n(0.04), 35, 40),
        }
        setHistory((h) => [...h.slice(1), { bpm: next.bpm, spo2: next.spo2 }])
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [scenario, variant])

  /* ─────────────────────── NEFES ZAMANLAYICISI ─────────────────────── */
  useEffect(() => {
    if (!breath.active) return
    const id = setTimeout(() => {
      setBreath((b) => {
        if (!b.active) return b
        if (b.remaining > 1) return { ...b, remaining: b.remaining - 1 }
        const next = BREATH_PHASES[b.phase].next
        const cycles = b.phase === 'exhale' ? b.cycles + 1 : b.cycles
        return { ...b, phase: next, remaining: BREATH_PHASES[next].secs, cycles }
      })
    }, 1000)
    return () => clearTimeout(id)
  }, [breath])

  // Nefes turları ilerledikçe empatik geri bildirim
  useEffect(() => {
    if (!breath.active || breath.cycles === 0) return
    const bpm = Math.round(vitalsRef.current.bpm)
    if (breath.cycles === 1) log('Nefes egzersizi: 1. tur tamamlandı', 'ok')
    if (breath.cycles === 2) sayAt(400, `Çok iyi gidiyorsun 🌿 Nabzın şu an ${bpm} BPM ve düşmeye başladı. Devam edelim.`)
    if (breath.cycles === 4) sayAt(400, `Harika… nabzın ${bpm} BPM’e indi, stres seviyen de azalıyor. Omuzlarını bırak, çeneni gevşet.`)
    if (breath.cycles === 6) {
      sayAt(400, `6 turu tamamladın, gerçekten başardın 💙 Nabzın ${bpm} BPM. İstersen biraz daha devam edebilir ya da dinlenebiliriz. Şimdi nasıl hissediyorsun?`, {
        actions: [{ label: 'Daha iyiyim', action: 'better', icon: 'smile' }, { label: 'Hâlâ kötüyüm', action: 'worse', icon: 'alert' }],
      })
      log('Nefes egzersizi: 6 tur · nabız düşüşü kaydedildi', 'ok')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breath.cycles])

  /* ─────────────────────── ETKİLEŞİMLER ─────────────────────── */
  const guidanceRef = useRef(null)
  const facilitiesRef = useRef(null)

  const placeCall = useCallback(() => {
    log(`${region.emergency} araması başlatıldı${DEMO_MODE ? ' (demo simülasyonu)' : ''}`, 'critical')
    if (!DEMO_MODE) {
      window.location.href = `tel:${region.emergency}`
      return
    }
    setCall({ phase: 'dialing', startedAt: Date.now() })
    later(() => setCall((c) => (c ? { ...c, phase: 'connected', connectedAt: Date.now() } : c)), 2600)
  }, [region.emergency, later, log])

  const scrollTo = (ref) => {
    setChatOpen((o) => (window.innerWidth < 1024 ? false : o))
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
  }

  const handleAction = useCallback((action) => {
    const fn = PROFILE.firstName
    switch (action) {
      case 'breath':
        pushMsg({ from: 'user', text: 'Nefes egzersizine başlayalım.' })
        startBreathing()
        log('3-3-3 Nefes Egzersizi başlatıldı (kullanıcı)', 'info')
        sayAt(900, 'Harika, başlıyoruz. Sadece halkayı takip et, gerisini ben izliyorum. 🌬️')
        break
      case 'appointment':
        pushMsg({ from: 'user', text: 'Randevu öner.' })
        sayAt(1000, `${region.appointment} üzerinden Dr. Murat Demir (Kardiyoloji) için en yakın uygun tarih: Perşembe 10:40. Onaylarsan randevuyu oluşturabilirim (simülasyon).`, {
          actions: [{ label: 'Onayla', action: 'appointment_ok', icon: 'calendar' }],
        })
        break
      case 'appointment_ok':
        pushMsg({ from: 'user', text: 'Onaylıyorum.' })
        log(`${region.appointment} randevusu oluşturuldu (simülasyon)`, 'ok')
        notify(`${region.appointment}: Perşembe 10:40 · Kardiyoloji randevusu oluşturuldu (simülasyon)`, 'ok')
        sayAt(900, 'Randevun oluşturuldu ✅ Bir gün önce sana hatırlatacağım. Bu gece değerlerini izlemeye devam ediyorum.')
        break
      case 'facilities':
        pushMsg({ from: 'user', text: 'En yakın sağlık kuruluşlarını göster.' })
        sayAt(700, 'Panelde, bulunduğun konuma göre en yakın 3 sağlık kuruluşunu ve uygun branşları gösteriyorum.')
        later(() => scrollTo(facilitiesRef), 900)
        break
      case 'med_yes':
        setMedTaken(true)
        pushMsg({ from: 'user', text: 'Evet, aldım.' })
        log('İlaç uyumu: Sertralin sabah dozu alındı', 'ok')
        sayAt(900, 'Çok güzel, düzenli kullanman çok önemli 👏 Şimdi sadece nefesine odaklanalım.')
        break
      case 'med_no':
        setMedTaken(false)
        pushMsg({ from: 'user', text: 'Henüz almadım.' })
        log('İlaç uyumu: Sertralin dozu atlanmış · hatırlatıcı kuruldu', 'warn')
        sayAt(900, 'Sorun değil. Atak geçtikten ve kendini sakin hissettikten sonra doktorunun önerdiği şekilde almayı unutma — 30 dakika sonra sana hatırlatacağım ⏰')
        break
      case 'better':
        pushMsg({ from: 'user', text: 'Daha iyiyim.' })
        stopBreathing()
        sayAt(900, `Bunu duyduğuma çok sevindim ${fn} 💙 Değerlerini izlemeye devam ediyorum. Bu atağı not ettim; bir sonraki doktor kontrolünde paylaşabilmen için raporuna ekleyeceğim.`)
        log('Kullanıcı iyileşme bildirdi · atak raporu oluşturuldu', 'ok')
        break
      case 'worse':
      case 'chestpain':
        pushMsg({ from: 'user', text: action === 'chestpain' ? 'Göğsümde ağrı var.' : 'Hâlâ kötü hissediyorum.' })
        log('Kullanıcı belirtilerin arttığını bildirdi → eskalasyon önerisi', 'critical')
        sayAt(900, `Bunu söylediğin için teşekkürler, bu önemli. Göğüs ağrısı ya da kötüleşme varsa beklemeyelim: ${region.emergency}’yi aramanı istiyorum. Ben seninleyim.`, {
          actions: [{ label: `${region.emergency}’yi Ara`, action: 'call', icon: 'phone', danger: true }],
        })
        break
      case 'call':
        placeCall()
        break
      default:
        break
    }
  }, [later, log, notify, placeCall, pushMsg, region.appointment, region.emergency, sayAt, startBreathing, stopBreathing])

  /** Serbest metin — kural tabanlı empatik yanıt motoru (gerçek üründe LLM ile değiştirilebilir) */
  const handleSend = useCallback((text) => {
    const t = text.toLocaleLowerCase('tr-TR')
    if (/nefes|egzersiz|sakinleş/.test(t)) return handleAction('breath')
    if (/göğüs|ağrı|bayıl|nefes alam|kötüleş/.test(t)) return handleAction('chestpain')
    pushMsg({ from: 'user', text })
    if (/112|911|999|acil|ambulans/.test(t)) {
      sayAt(900, `Hemen acil yardımı arayabiliriz. Butona dokunduğunda konumun ve tıbbi özet kartın paylaşılacak.`, {
        actions: [{ label: `${region.emergency}’yi Ara`, action: 'call', icon: 'phone', danger: true }],
      })
    } else if (/iyi|geçti|düzel|rahatla/.test(t)) {
      sayAt(900, 'Bunu duyduğuma çok sevindim 💙 Değerlerin de bunu destekliyor. Ben arka planda izlemeye devam edeceğim.')
    } else if (/doktor|randevu|hastane|poliklinik/.test(t)) {
      sayAt(900, hasRecord
        ? `Kayıtlarına göre seni en iyi tanıyan doktorun Dr. Murat Demir (Kardiyoloji). ${region.appointment} üzerinden randevu önerebilirim.`
        : 'Durumuna göre Kardiyoloji ve gerekirse Psikiyatri / Göğüs Hastalıkları polikliniklerini öneriyorum. En yakın kuruluşları panelde görebilirsin.', {
        actions: [{ label: hasRecord ? 'Randevu öner' : 'En yakın kuruluşlar', action: hasRecord ? 'appointment' : 'facilities', icon: hasRecord ? 'calendar' : 'map' }],
      })
    } else if (/ilaç|aldım|hap/.test(t)) {
      sayAt(900, hasRecord
        ? 'Kayıtlarında Sertralin 50 mg (sabah) ve gerektiğinde Propranolol 10 mg görünüyor. Dozlar konusunda her zaman doktorunun talimatını esas al.'
        : 'Kayıtlı bir reçeten görünmüyor. Kullandığın bir ilaç varsa profiline ekleyebilirsin; acil durumda ekipler için çok faydalı olur.')
    } else if (/korku|kork|panik|endişe|stres/.test(t)) {
      sayAt(900, 'Hissettiğin şey çok gerçek ve anlaşılır. Ama şu an güvendesin. Benimle birlikte yavaşça nefes almayı dener misin?', {
        actions: [{ label: 'Nefes egzersizine başla', action: 'breath', icon: 'wind' }],
      })
    } else {
      sayAt(1000, 'Seni duyuyorum. Şu an kendini 1 ile 10 arasında nasıl hissediyorsun? Ne olursa olsun, değerlerini izliyorum ve yanındayım.')
    }
  }, [handleAction, hasRecord, pushMsg, region.appointment, region.emergency, sayAt])

  /* ─────────────────────── TÜRETİLMİŞ DEĞERLER ─────────────────────── */
  const risk = SCENARIOS[scenario].risk
  const R = RISK[risk]
  const isCritical = scenario === 'critical'
  const sleeping = scenario === 'sleep'
  const queryDone = query.status === 'found' || query.status === 'notfound'
  const guidance = useMemo(
    () => (queryDone ? buildGuidance({ scenario, hasRecord, region, variant }) : null),
    [queryDone, scenario, hasRecord, region, variant],
  )
  const anomalyMs = anomalyStart ? now - anomalyStart : 0

  // Footer yüksekliğini ölç (sabit yasal uyarı her ekranda görünür kalsın)
  const footerRef = useRef(null)
  useEffect(() => {
    const el = footerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--footer-h', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const openChat = () => { setChatOpen(true); setUnread(0) }

  const chatProps = {
    messages, typing, onSend: handleSend, onAction: handleAction, scenario, breath,
    onStopBreath: stopBreathing, onClose: () => setChatOpen(false), region,
  }

  return (
    <div className={`min-h-screen bg-[#fbf8fe] text-slate-800 antialiased ${isCritical ? 'bv-critical-bg' : ''}`} style={{ paddingBottom: 'calc(var(--footer-h, 56px) + 16px)' }}>
      <GlobalStyles />
      {isCritical && <div className="pointer-events-none fixed inset-0 z-30 bv-vignette" aria-hidden />}

      <Header region={region} query={query} hasRecord={hasRecord} sleeping={sleeping} risk={risk} />

      <main className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6">
        <DemoPanel
          open={panelOpen} setOpen={setPanelOpen} scenario={scenario}
          onScenario={(k) => runScenario(k)}
          hasRecord={hasRecord}
          onRecord={(v) => { setHasRecord(v); if (scenario !== 'normal') runScenario(scenario, { record: v }); else runScenario('normal', { record: v }) }}
          regionKey={regionKey}
          onRegion={(k) => { setRegionKey(k); runScenario(scenario, { region: k }) }}
          variant={variant}
          onVariant={(v) => { setVariant(v); if (scenario === 'critical') runScenario('critical', { variant: v }) }}
          onReset={() => runScenario('normal')}
          region={region}
        />

        {isCritical && <CriticalBanner region={region} onCall={placeCall} anomalyMs={anomalyMs} />}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ───────────── SOL: GÖSTERGE PANELİ ───────────── */}
          <div className="min-w-0 space-y-5">
            <StatusHero scenario={scenario} R={R} anomalyMs={anomalyMs} vitals={vitals} variant={variant} region={region} />

            {breath.active && (
              <BreathingCard breath={breath} onStop={stopBreathing} vitals={vitals} startBpm={getTargets(scenario, variant, 0).bpm} />
            )}

            {isCritical && (
              <EmergencyCard
                vitals={vitals} hasRecord={hasRecord} region={region} anomalyStart={anomalyStart}
                anomalyMs={anomalyMs} variant={variant} history={history} queryDone={queryDone}
                onCall={placeCall} onExpand={() => setCardFull(true)}
              />
            )}

            <div className="grid gap-5 xl:grid-cols-5">
              <EcgCard className="xl:col-span-3" vitals={vitals} scenario={scenario} variant={variant} R={R} history={history} />
              <VitalsGrid className="xl:col-span-2" vitals={vitals} sleeping={sleeping} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <IntegrationCard region={region} query={query} hasRecord={hasRecord} scenario={scenario} />
              <div ref={guidanceRef} className="min-w-0">
                <GuidanceCard guidance={guidance} scenario={scenario} query={query} region={region} medTaken={medTaken}
                  facilitiesRef={facilitiesRef} onBreath={() => handleAction('breath')} onToast={notify} onCall={placeCall} />
              </div>
            </div>

            <Pipeline stage={flowStage} scenario={scenario} hasRecord={hasRecord} region={region} query={query} />

            <div className="grid gap-5 md:grid-cols-2">
              <DailySummary hasRecord={hasRecord} scenario={scenario} />
              <EventLog events={events} />
            </div>
          </div>

          {/* ───────────── SAĞ: AI ASİSTAN (masaüstü) ───────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-[84px] space-y-5">
              {chatOpen ? (
                <div className="bv-pop h-[calc(100vh-84px-var(--footer-h,56px)-20px)] min-h-[520px]">
                  <ChatPanel {...chatProps} />
                </div>
              ) : (
                <>
                  <ChatCollapsed onOpen={openChat} unread={unread} lastMsg={messages.filter((m) => m.from === 'ai').slice(-1)[0]} />
                  <ProfileCard hasRecord={hasRecord} region={region} />
                </>
              )}
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-2xl border border-brand-100 bg-white/70 p-4 text-center text-xs text-slate-500">
          BioVibe © 2026 · <span className="font-display text-brand-800">Programlamada Yeni Eğilimler</span> dersi final projesi · Doğuş Üniversitesi, Bilgisayar Programcılığı
          <br className="hidden sm:block" />
          <span className="sm:ml-0 ml-1">Tüm sağlık kayıtları, kişi ve kurum adları kurgusaldır; veriler tarayıcıda simüle edilir.</span>
        </section>
      </main>

      {/* ───────────── MOBİL / TABLET: AI ASİSTAN ───────────── */}
      {!chatOpen && (
        <button
          onClick={openChat}
          className={`lg:hidden fixed right-4 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-brand-900/20 transition active:scale-95 ${isCritical ? 'bg-red-600' : 'bg-gradient-to-r from-brand-600 to-brand-900'}`}
          style={{ bottom: 'calc(var(--footer-h, 56px) + 14px)' }}
          aria-label="AI asistanı aç"
        >
          <MessageCircle className="h-5 w-5" /> AI Asistan
          {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs text-brand-700">{unread}</span>}
        </button>
      )}
      {chatOpen && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-label="AI asistan">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setChatOpen(false)} />
          <div className="bv-sheet absolute inset-x-0 top-[8vh] sm:inset-x-6 sm:top-[6vh]" style={{ bottom: 'var(--footer-h, 56px)' }}>
            <ChatPanel {...chatProps} mobile onCall={placeCall} isCritical={isCritical} />
          </div>
        </div>
      )}

      {call && <CallModal call={call} now={now} region={region} onEnd={() => { setCall(null); log('Arama sonlandırıldı', 'info') }} />}
      {cardFull && (
        <FullCardModal onClose={() => setCardFull(false)}>
          <EmergencyCard large vitals={vitals} hasRecord={hasRecord} region={region} anomalyStart={anomalyStart}
            anomalyMs={anomalyMs} variant={variant} history={history} queryDone={queryDone} onCall={placeCall} />
        </FullCardModal>
      )}
      {toast && <Toast toast={toast} />}

      {/* ───────────── SABİT YASAL UYARI ───────────── */}
      <footer ref={footerRef} className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-800 bg-brand-900/95 backdrop-blur">
        <p className="mx-auto max-w-7xl px-4 py-2.5 text-center text-[11.5px] leading-snug text-brand-100 sm:text-xs">
          <span className="font-bold text-brand-200">⚠️ Yasal Uyarı:</span> BioVibe bir tıbbi tanı veya tedavi cihazı değildir; yalnızca karar destek, erken farkındalık ve yönlendirme asistanıdır.
        </p>
      </footer>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   4) BİLEŞENLER
   ════════════════════════════════════════════════════════════════════ */

function GlobalStyles() {
  return (
    <style>{`
      @keyframes bv-hb { 0%,100%{transform:scale(1)} 15%{transform:scale(1.22)} 30%{transform:scale(.96)} 45%{transform:scale(1.1)} }
      .bv-hb { animation: bv-hb var(--d,1s) ease-in-out infinite; transform-origin:center }
      @keyframes bv-pop { from{opacity:0; transform:translateY(10px) scale(.98)} to{opacity:1; transform:none} }
      .bv-pop { animation: bv-pop .35s cubic-bezier(.2,.8,.2,1) both }
      @keyframes bv-sheet { from{transform:translateY(40px); opacity:0} to{transform:none; opacity:1} }
      .bv-sheet { animation: bv-sheet .32s cubic-bezier(.2,.8,.2,1) both }
      @keyframes bv-vig { 0%,100%{box-shadow: inset 0 0 0 0 rgba(239,68,68,0)} 50%{box-shadow: inset 0 0 90px 10px rgba(239,68,68,.35)} }
      .bv-vignette { animation: bv-vig 1.6s ease-in-out infinite }
      .bv-critical-bg { background: linear-gradient(#fff5f5, #f8fafc 420px) }
      @keyframes bv-dot { 0%,80%,100%{transform:translateY(0); opacity:.4} 40%{transform:translateY(-4px); opacity:1} }
      .bv-dot { animation: bv-dot 1.2s infinite }
      @keyframes bv-scan { from{transform:translateX(-100%)} to{transform:translateX(250%)} }
      .bv-scan { animation: bv-scan 1.3s linear infinite }
      @keyframes bv-ring { 0%{transform:scale(.9); opacity:.7} 100%{transform:scale(1.6); opacity:0} }
      .bv-ring { animation: bv-ring 1.4s ease-out infinite }
      .bv-grid { background-image: linear-gradient(rgba(148,163,184,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.14) 1px, transparent 1px); background-size: 20px 20px; }
      .bv-grid-dark { background-image: linear-gradient(rgba(148,163,184,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.10) 1px, transparent 1px); background-size: 20px 20px; }
      .bv-scroll::-webkit-scrollbar{width:6px} .bv-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:9px}
      @media (prefers-reduced-motion: reduce){ .bv-hb,.bv-vignette,.bv-ring,.bv-scan{animation:none} }
    `}</style>
  )
}

function Card({ className = '', children, ...rest }) {
  return <section className={`rounded-2xl border border-brand-100 bg-white shadow-sm shadow-brand-900/[0.04] ${className}`} {...rest}>{children}</section>
}

function CardTitle({ icon: Icon, title, sub, right, iconClass = 'bg-brand-50 text-brand-600', dark = false }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${iconClass}`}><Icon className="h-[18px] w-[18px]" /></span>
        <div className="min-w-0">
          <h3 className={`font-display text-[16.5px] leading-snug ${dark ? 'text-white' : 'text-brand-950'}`}>{title}</h3>
          {sub && <p className={`text-xs ${dark ? 'text-brand-200/80' : 'text-slate-500'}`}>{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

/* ─────────────────────── ÜST BAR ─────────────────────── */
function Header({ region, query, hasRecord, sleeping, risk }) {
  const R = RISK[risk]
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="BioVibe logosu" className="h-11 w-11 rounded-2xl shadow-lg shadow-brand-900/30 ring-1 ring-brand-900/10" />
          <div className="leading-tight">
            <p className="font-display text-[22px] leading-none text-brand-900">Bio<span className="text-brand-600">Vibe</span></p>
            <p className="mt-1 hidden text-[11px] font-medium tracking-wide text-brand-700/70 sm:block">Proaktif Yapay Zekâ Sağlık Asistanı</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {query.status === 'querying' ? (
            <span className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 sm:text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> <span className="hidden xs:inline sm:inline">{region.system}</span> sorgulanıyor…
            </span>
          ) : (
            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${hasRecord ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {hasRecord ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
              <span>{region.system}</span><span className="hidden sm:inline">· {hasRecord ? 'Bağlı' : 'Kayıt Yok'}</span>
            </span>
          )}
          {sleeping && (
            <span className="hidden items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 sm:flex">
              <Moon className="h-3.5 w-3.5" /> Uyku Modu
            </span>
          )}
          <span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold md:flex ${R.border} ${R.soft} ${R.text}`}>
            <span className={`h-2 w-2 rounded-full ${R.solid} ${risk !== 'normal' ? 'animate-pulse' : ''}`} /> Risk: {R.label}
          </span>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 md:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-800 text-[11px] font-bold text-white">İK</span>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-slate-700">{PROFILE.name}</p>
              <p className="flex items-center gap-1 text-[10px] text-slate-500"><Bluetooth className="h-3 w-3" />{PROFILE.device} · <BatteryMedium className="h-3 w-3" />%82</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ─────────────────────── DEMO KONTROL PANELİ ─────────────────────── */
function DemoPanel({ open, setOpen, scenario, onScenario, hasRecord, onRecord, regionKey, onRegion, variant, onVariant, onReset, region }) {
  const btnStyles = {
    normal: { on: 'bg-brand-600 text-white border-brand-600 shadow-brand-600/30', off: 'hover:border-brand-300 hover:bg-brand-50/70', ic: 'text-brand-600' },
    sleep: { on: 'bg-brand-900 text-white border-brand-900 shadow-brand-900/30', off: 'hover:border-brand-300 hover:bg-brand-50/70', ic: 'text-brand-700' },
    panic: { on: 'bg-orange-500 text-white border-orange-500 shadow-orange-500/25', off: 'hover:border-orange-300 hover:bg-orange-50/60', ic: 'text-orange-500' },
    critical: { on: 'bg-red-600 text-white border-red-600 shadow-red-600/25', off: 'hover:border-red-300 hover:bg-red-50/60', ic: 'text-red-600' },
  }
  return (
    <section className="my-4 rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50/80 to-white p-3 sm:p-4" aria-label="Demo Simülasyon Kontrol Paneli">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-left" aria-expanded={open}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-900 text-white"><FlaskConical className="h-4 w-4" /></span>
          <div>
            <p className="font-display text-[15px] text-brand-950">Demo Simülasyon Kontrol Paneli</p>
            <p className="text-[11px] text-slate-500">Sunum için sensör & sağlık kaydı senaryoları</p>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        <button onClick={onReset} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sıfırla</span>
        </button>
      </div>

      {open && (
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {Object.values(SCENARIOS).map((s, i) => {
              const Icon = s.icon
              const active = scenario === s.key
              const st = btnStyles[s.key]
              return (
                <button key={s.key} onClick={() => onScenario(s.key)}
                  className={`group relative rounded-xl border p-2.5 text-left transition sm:p-3 ${active ? `${st.on} shadow-lg` : `border-slate-200 bg-white ${st.off}`}`}
                  aria-pressed={active}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : st.ic}`} />
                    <span className="text-[13px] font-semibold leading-tight">{i + 1}. {s.label}</span>
                  </div>
                  <p className={`mt-1 text-[11px] leading-snug ${active ? 'text-white/85' : 'text-slate-500'}`}>{s.desc}</p>
                  {active && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white animate-pulse" />}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[300px] lg:grid-cols-1">
            {/* E-Nabız anahtarı */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-700">{region.system} Kaydı</p>
                <p className={`text-[11px] font-medium ${hasRecord ? 'text-emerald-600' : 'text-amber-600'}`}>{hasRecord ? 'Aktif · Modül 1 (Kayıtlı)' : 'Kayıt Yok · Modül 2 (Fail-Safe)'}</p>
              </div>
              <Toggle checked={hasRecord} onChange={onRecord} label={`${region.system} kaydı`} />
            </div>
            <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Globe className="h-3.5 w-3.5 text-slate-400" /> Ülke / API</span>
              <select value={regionKey} onChange={(e) => onRegion(e.target.value)} className="max-w-[150px] rounded-md border-0 bg-slate-50 py-1 pl-2 pr-1 text-xs font-medium text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-brand-400">
                {Object.entries(REGIONS).map(([k, r]) => <option key={k} value={k}>{r.flag} {r.country} · {r.system}</option>)}
              </select>
            </label>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Siren className="h-3.5 w-3.5 text-slate-400" /> Kritik tip</span>
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
                {[['tachy', 'Taşikardi'], ['brady', 'Bradikardi']].map(([k, l]) => (
                  <button key={k} onClick={() => onVariant(k)} className={`rounded-md px-2 py-1 transition ${variant === k ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

/* ─────────────────────── KRİTİK BANNER ─────────────────────── */
function CriticalBanner({ region, onCall, anomalyMs }) {
  return (
    <div className="bv-pop mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xl shadow-red-600/30">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
            <span className="bv-ring absolute inset-0 rounded-2xl border-2 border-white/60" />
            <Siren className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-100">Yüksek Öncelikli Uyarı · {fmtDur(anomalyMs)}</p>
            <p className="font-display text-lg leading-tight sm:text-[22px]">Hayati risk eşiği aşıldı — acil yardım çağırın</p>
          </div>
        </div>
        <button onClick={onCall} className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-base font-extrabold text-red-600 shadow-lg transition hover:bg-red-50 active:scale-[.98]">
          <PhoneCall className="h-5 w-5" /> {region.emergency} Acil Arama
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────── DURUM ÖZETİ (HERO) ─────────────────────── */
function StatusHero({ scenario, R, anomalyMs, vitals, variant, region }) {
  const content = {
    normal: { icon: ShieldCheck, title: 'Her şey yolunda', text: 'Tüm biyometrik değerlerin normal aralıkta. BioVibe arka planda seni sessizce izlemeye devam ediyor.', tag: 'Uyanık · Sürekli izleme' },
    sleep: { icon: Moon, title: 'Uyku sırasında anomali tespit edildi', text: `Derin uyku evresinde ani nabız yükselişi ve SpO₂ düşüşü algılandı. Arka planda ${region.system} kayıtların sorgulanıyor.`, tag: 'Uyku Modu · Derin uyku → uyandırıldı' },
    panic: { icon: Brain, title: 'Olası panik atak · AI Kriz Asistanı devrede', text: 'Ani nabız artışı, yüksek stres ve terleme birlikte algılandı. Sakinleştirici sohbet ve nefes egzersizi başlatıldı.', tag: 'Uyanık · Akut stres yanıtı' },
    critical: { icon: Siren, title: variant === 'brady' ? 'KRİTİK: Tehlikeli bradikardi + düşük SpO₂' : 'KRİTİK: Hayati risk eşiği aşıldı', text: `Net ve sakin talimatlar veriliyor. ${region.emergency} tek dokunuşla aranabilir, Acil Durum Tıbbi Özet Kartı hazır.`, tag: 'Acil eskalasyon aktif' },
  }[scenario]
  const Icon = content.icon
  const hr = new Date().getHours()
  const greet = hr < 5 ? 'İyi geceler' : hr < 12 ? 'Günaydın' : hr < 18 ? 'İyi günler' : hr < 22 ? 'İyi akşamlar' : 'İyi geceler'
  return (
    <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${R.hero} p-5 text-white shadow-lg sm:p-6`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur"><Icon className="h-6 w-6" /></span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/80">{greet}, {PROFILE.firstName} · {content.tag}</p>
            <h2 className="font-display mt-1 text-[22px] leading-tight sm:text-[28px]">{content.title}</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-white/90">{content.text}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">Risk: {R.label}</span>
          {scenario !== 'normal' ? (
            <span className="flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> Anomali süresi {fmtDur(anomalyMs)}</span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1 text-xs font-semibold"><HeartPulse className="h-3.5 w-3.5" /> {Math.round(vitals.bpm)} BPM · %{Math.round(vitals.spo2)}</span>
          )}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── CANLI EKG / NABIZ ─────────────────────── */
function EcgCanvas({ bpm, irregular, color, dark }) {
  const ref = useRef(null)
  const bpmRef = useRef(bpm)
  const irrRef = useRef(irregular)
  const colorRef = useRef(color)
  bpmRef.current = bpm
  irrRef.current = irregular
  colorRef.current = color

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let W = 0, H = 0, raf, prevTs
    let x = 0, lastY = null, t = 0, beatStart = 0
    let rr = 60 / bpmRef.current
    const g = (v, mu, sig, a) => a * Math.exp(-((v - mu) ** 2) / (2 * sig * sig))

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const r = canvas.getBoundingClientRect()
      W = r.width; H = r.height
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      x = 0; lastY = null
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const ecg = (tau) => {
      const s = Math.min(1, rr / 0.85)
      return g(tau, 0.1 * s, 0.025 * s, 0.12) - g(tau, 0.19 * s, 0.009 * s, 0.14) + g(tau, 0.215 * s, 0.012 * s, 1)
        - g(tau, 0.24 * s, 0.011 * s, 0.28) + g(tau, 0.43 * s, 0.045 * s, 0.26)
    }

    const loop = (ts) => {
      if (prevTs == null) prevTs = ts
      const dt = Math.min(0.05, (ts - prevTs) / 1000)
      prevTs = ts
      const pxPerSec = Math.max(60, W / 5) // ekranda ~5 sn
      const n = Math.max(1, Math.round(dt * pxPerSec))
      ctx.lineWidth = 2.2
      ctx.lineJoin = 'round'
      ctx.strokeStyle = colorRef.current
      ctx.shadowColor = colorRef.current
      ctx.shadowBlur = 6
      ctx.clearRect(x, 0, n + 16, H)
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        t += 1 / pxPerSec
        if (t - beatStart >= rr) {
          beatStart = t
          const base = 60 / Math.max(25, bpmRef.current)
          rr = irrRef.current ? base * (Math.random() < 0.25 ? 0.55 : 0.8 + Math.random() * 0.45) : base * (0.97 + Math.random() * 0.06)
        }
        const y = H * 0.66 - ecg(t - beatStart) * H * 0.52 + (Math.random() - 0.5) * 1.2
        if (lastY == null) ctx.moveTo(x, y)
        else { ctx.moveTo(x - 1, lastY); ctx.lineTo(x, y) }
        lastY = y
        x += 1
        if (x > W) { x = 0; lastY = null; ctx.stroke(); ctx.beginPath() }
      }
      ctx.stroke()
      // tarama imleci
      ctx.shadowBlur = 0
      ctx.fillStyle = dark ? 'rgba(255,255,255,.85)' : colorRef.current
      ctx.beginPath(); ctx.arc(x, lastY ?? H / 2, 3, 0, Math.PI * 2); ctx.fill()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [dark])

  return <canvas ref={ref} className="h-full w-full" aria-label="Canlı EKG simülasyonu" />
}

function Sparkline({ data, color, min, max, band, height = 56 }) {
  const w = 300
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, height - ((clamp(v, min, max) - min) / (max - min)) * height])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const y = (v) => height - ((v - min) / (max - min)) * height
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
      {band && <rect x="0" y={y(band[1])} width={w} height={y(band[0]) - y(band[1])} fill="#10b981" opacity=".09" />}
      <path d={`${d} L${w},${height} L0,${height} Z`} fill={color} opacity=".1" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  )
}

function EcgCard({ className, vitals, scenario, variant, R, history }) {
  const bpm = Math.round(vitals.bpm)
  const dark = scenario === 'sleep'
  return (
    <Card className={`overflow-hidden ${className} ${dark ? '!border-brand-900 !bg-brand-950 text-white' : ''}`}>
      <div className="p-4 sm:p-5">
        <CardTitle dark={dark} icon={HeartPulse} title="Canlı Nabız Monitörü" sub={rhythmLabel(scenario, variant, bpm)}
          iconClass={dark ? 'bg-brand-200/15 text-brand-200' : `${R.soft} ${R.text}`}
          right={<span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${dark ? 'bg-white/10 text-white/80' : 'bg-slate-100 text-slate-600'}`}><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> CANLI</span>} />
        <div className="mt-4 flex items-end gap-4">
          <div className="flex items-center gap-2">
            <Heart className="bv-hb h-8 w-8 fill-current" style={{ '--d': `${60 / Math.max(30, bpm)}s`, color: R.stroke }} />
            <div>
              <p className="text-[52px] font-bold tabular-nums leading-none tracking-tight">{bpm}</p>
              <p className={`text-xs font-medium ${dark ? 'text-white/60' : 'text-slate-500'}`}>BPM</p>
            </div>
          </div>
          <div className={`ml-auto text-right text-xs ${dark ? 'text-white/60' : 'text-slate-500'}`}>
            <p>Normal aralık</p><p className="font-semibold">{scenario === 'sleep' ? '50–70 (uyku)' : '60–100'}</p>
          </div>
        </div>
        <div className={`relative mt-3 h-36 overflow-hidden rounded-xl sm:h-40 ${dark ? 'bv-grid-dark bg-black/25' : 'bv-grid bg-slate-50/60'}`}>
          <EcgCanvas bpm={bpm} irregular={scenario === 'sleep'} color={R.stroke} dark={dark} />
        </div>
        <div className="mt-3">
          <div className={`mb-1 flex justify-between text-[11px] ${dark ? 'text-white/50' : 'text-slate-500'}`}><span>Son 60 sn nabız trendi</span><span>min {Math.round(Math.min(...history.map((h) => h.bpm)))} · max {Math.round(Math.max(...history.map((h) => h.bpm)))}</span></div>
          <div className="h-12"><Sparkline data={history.map((h) => h.bpm)} color={R.stroke} min={25} max={190} band={[60, 100]} height={48} /></div>
        </div>
      </div>
    </Card>
  )
}

/* ─────────────────────── VİTAL KARTLAR ─────────────────────── */
function VitalsGrid({ className, vitals, sleeping }) {
  const st = (lvl) => ({
    ok: ['Normal', 'text-emerald-600 bg-emerald-50'],
    warn: ['Dikkat', 'text-amber-700 bg-amber-50'],
    high: ['Yüksek', 'text-orange-700 bg-orange-50'],
    crit: ['Kritik', 'text-red-700 bg-red-50'],
  }[lvl])
  const items = [
    { icon: Droplets, label: 'SpO₂', value: Math.round(vitals.spo2), unit: '%', lvl: vitals.spo2 < 90 ? 'crit' : vitals.spo2 < 95 ? 'warn' : 'ok', c: 'text-sky-600 bg-sky-50' },
    { icon: Brain, label: 'Stres', value: Math.round(vitals.stress), unit: '/100', lvl: vitals.stress > 85 ? 'crit' : vitals.stress > 70 ? 'high' : vitals.stress > 42 ? 'warn' : 'ok', c: 'text-violet-600 bg-violet-50', bar: vitals.stress },
    { icon: Waves, label: 'Terleme (EDA)', value: vitals.eda.toFixed(1), unit: 'µS', lvl: vitals.eda > 9 ? 'high' : vitals.eda > 4.5 ? 'warn' : 'ok', c: 'text-brand-600 bg-brand-50' },
    { icon: Activity, label: 'HRV', value: Math.round(vitals.hrv), unit: 'ms', lvl: vitals.hrv < 15 ? 'crit' : vitals.hrv < 30 ? 'warn' : 'ok', c: 'text-brand-600 bg-brand-50' },
    { icon: Thermometer, label: 'Vücut Isısı', value: vitals.temp.toFixed(1), unit: '°C', lvl: vitals.temp > 37.5 ? 'warn' : 'ok', c: 'text-rose-600 bg-rose-50' },
    { icon: sleeping ? Moon : Footprints, label: sleeping ? 'Uyku Evresi' : 'Aktivite', value: sleeping ? 'Uyandı' : 'Dinlenme', unit: '', lvl: sleeping ? 'warn' : 'ok', c: 'text-brand-700 bg-brand-50', text: true },
  ]
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 ${className}`}>
      {items.map((it) => {
        const [lab, cls] = st(it.lvl)
        const Icon = it.icon
        return (
          <Card key={it.label} className={`p-3.5 transition ${it.lvl === 'crit' ? '!border-red-300 ring-2 ring-red-100' : ''}`}>
            <div className="flex items-center justify-between">
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${it.c}`}><Icon className="h-4 w-4" /></span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{lab}</span>
            </div>
            <p className="mt-2.5 text-[11px] font-medium text-slate-500">{it.label}</p>
            <p className={`font-bold tabular-nums leading-tight text-slate-800 ${it.text ? 'text-lg' : 'text-2xl'}`}>
              {it.value}<span className="ml-0.5 text-xs font-semibold text-slate-400">{it.unit}</span>
            </p>
            {it.bar != null && (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-all duration-700" style={{ width: `${it.bar}%` }} />
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

/* ─────────────────────── ULUSAL SAĞLIK ENTEGRASYONU ─────────────────────── */
function IntegrationCard({ region, query, hasRecord, scenario }) {
  const steps = [
    `Güvenli bağlantı (TLS 1.3 · ${region.auth})`,
    `Kimlik doğrulama & ${region.privacy} açık rıza kontrolü`,
    'Kronik hastalık ve tanı geçmişi sorgulanıyor',
    'Reçeteli ilaçlar ve alerjiler getiriliyor',
    'Anomali ↔ tıbbi geçmiş eşleştiriliyor',
  ]
  const status = query.status
  const badge = {
    idle: ['Beklemede · Bağlı', 'bg-slate-100 text-slate-600'],
    querying: ['Sorgulanıyor…', 'bg-sky-100 text-sky-700'],
    found: ['Kayıt bulundu', 'bg-emerald-100 text-emerald-700'],
    notfound: ['Kayıt yok → Fail-Safe', 'bg-amber-100 text-amber-800'],
  }[status]

  const stepState = (i) => {
    if (status === 'idle') return 'idle'
    if (status === 'found') return 'ok'
    if (status === 'notfound') return i < 2 ? 'ok' : i === 2 ? 'fail' : 'skip'
    return i < query.step ? 'ok' : i === query.step ? 'run' : 'idle'
  }

  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <CardTitle icon={Database} title={`Ulusal Sağlık Entegrasyonu · ${region.system}`} sub={`${region.flag} ${region.provider}`}
        iconClass="bg-sky-50 text-sky-600"
        right={<span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${badge[1]}`}>{badge[0]}</span>} />

      {status === 'querying' && (
        <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-sky-100"><div className="bv-scan absolute inset-y-0 w-1/3 rounded-full bg-sky-500" /></div>
      )}

      {status === 'idle' ? (
        <div className="mt-4 flex flex-1 flex-col justify-center rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="flex items-center gap-2 font-medium text-slate-700"><Lock className="h-4 w-4 text-slate-400" /> Uçtan uca şifreli bağlantı hazır</p>
          <p className="mt-1 text-xs">Biyometrik sapma algılandığında {region.system} kayıtları (kronik hastalıklar, geçmiş tanılar, reçeteli ilaçlar) arka planda otomatik sorgulanır.</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Kayıt durumu: {hasRecord ? <span className="text-emerald-600">Aktif</span> : <span className="text-amber-600">Kayıt yok (Fail-Safe hazır)</span>}</p>
        </div>
      ) : (
        <ol className="mt-4 space-y-2">
          {steps.map((s, i) => {
            const ss = stepState(i)
            return (
              <li key={i} className={`flex items-center gap-2.5 text-[13px] ${ss === 'idle' || ss === 'skip' ? 'text-slate-400' : 'text-slate-700'}`}>
                {ss === 'ok' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                {ss === 'run' && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-500" />}
                {ss === 'fail' && <XCircle className="h-4 w-4 shrink-0 text-amber-500" />}
                {(ss === 'idle' || ss === 'skip') && <span className="grid h-4 w-4 shrink-0 place-items-center"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /></span>}
                <span className={ss === 'skip' ? 'line-through' : ''}>{ss === 'fail' ? 'Kayıt bulunamadı (404 · hasta kaydı yok)' : s}</span>
              </li>
            )
          })}
        </ol>
      )}

      {status === 'found' && (
        <div className="bv-pop mt-4 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Getirilen Kayıtlar</p>
          <div className="flex flex-wrap gap-1.5">
            {MEDICAL_RECORD.chronic.map((c) => <span key={c.name} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-emerald-200">{c.name}</span>)}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MEDICAL_RECORD.meds.map((m) => <span key={m.name} className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-sky-200"><Pill className="h-3 w-3 text-sky-500" />{m.name}</span>)}
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-red-600 ring-1 ring-red-200">Alerji: Penisilin</span>
          </div>
          <p className="text-[11px] text-slate-500">Son muayene: {MEDICAL_RECORD.lastVisit}</p>
        </div>
      )}
      {status === 'notfound' && (
        <div className="bv-pop mt-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p><span className="font-semibold">Sistem kilitlenmedi.</span> Fail-Safe (Hata Korumalı) Mod devrede: anomali, giyilebilir sensör verileriyle yerel olarak analiz ediliyor.</p>
        </div>
      )}
    </Card>
  )
}

/* ─────────────────────── AI DEĞERLENDİRME & YÖNLENDİRME ─────────────────────── */
function GuidanceCard({ guidance, scenario, query, region, medTaken, facilitiesRef, onBreath, onToast, onCall }) {
  if (scenario === 'normal') {
    return (
      <Card className="flex h-full flex-col p-4 sm:p-5">
        <CardTitle icon={Sparkles} title="AI Değerlendirme & Yönlendirme" sub="Kademeli talimat motoru" iconClass="bg-emerald-50 text-emerald-600" />
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-brand-50 p-5 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-emerald-500 shadow-sm"><ShieldCheck className="h-6 w-6" /></span>
          <p className="font-display mt-3 text-lg text-brand-950">Herhangi bir sapma yok</p>
          <p className="mt-1 text-xs text-slate-600">Kademeli talimat motoru beklemede. Hafif sapmada dinlenme/su/nefes, kritik eşikte {region.emergency} eskalasyonu otomatik devreye girer.</p>
          <div className="mt-4 grid w-full grid-cols-3 gap-2 text-[11px]">
            {[['Hafif/Orta', 'Dinlenme · su · nefes', 'bg-amber-100 text-amber-800'], ['Yüksek', 'AI kriz desteği', 'bg-orange-100 text-orange-800'], ['Kritik', `${region.emergency} + Acil Kart`, 'bg-red-100 text-red-700']].map(([a, b, c]) => (
              <div key={a} className={`rounded-lg px-2 py-1.5 ${c}`}><p className="font-bold">{a}</p><p className="opacity-80">{b}</p></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (!guidance) {
    return (
      <Card className="flex h-full flex-col p-4 sm:p-5">
        <CardTitle icon={Sparkles} title="AI Değerlendirme & Yönlendirme" sub="Analiz ediliyor…" iconClass="bg-brand-50 text-brand-600" />
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-slate-50 p-6 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
          <p className="text-sm font-medium text-slate-700">{query.status === 'querying' ? `${region.system} kayıtları bekleniyor` : 'Sensör anomalisi değerlendiriliyor'}</p>
          <p className="text-xs text-slate-500">Biyometrik veri + sağlık geçmişi birleştirilerek kişiselleştirilmiş öneri hazırlanıyor.</p>
        </div>
      </Card>
    )
  }

  const modeStyle = {
    personal: ['Kişiselleştirilmiş · Modül 1', 'bg-emerald-100 text-emerald-700', 'bg-emerald-50 text-emerald-600'],
    hybrid: ['Kişisel + Fail-Safe', 'bg-sky-100 text-sky-700', 'bg-sky-50 text-sky-600'],
    failsafe: ['Fail-Safe · Modül 2', 'bg-amber-100 text-amber-800', 'bg-amber-50 text-amber-600'],
    emergency: ['Acil Eskalasyon', 'bg-red-100 text-red-700', 'bg-red-50 text-red-600'],
  }[guidance.mode]

  return (
    <Card className={`bv-pop flex h-full flex-col p-4 sm:p-5 ${guidance.mode === 'emergency' ? '!border-red-200' : ''}`}>
      <CardTitle icon={guidance.mode === 'failsafe' ? ShieldAlert : Sparkles} title={guidance.title} sub={`Seviye: ${guidance.level}`}
        iconClass={modeStyle[2]} right={<span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:block ${modeStyle[1]}`}>{modeStyle[0]}</span>} />
      <p className="mt-3 text-[13px] text-slate-600">{guidance.summary}</p>

      {guidance.matches && (
        <ul className="mt-3 space-y-1.5">
          {guidance.matches.map((m) => (
            <li key={m.text} className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium ${m.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
              {m.ok ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />}{m.text}
            </li>
          ))}
        </ul>
      )}

      {guidance.possibilities && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <p className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">Olasılık değerlendirmesi <span className="normal-case tracking-normal font-medium text-slate-400">tanı değildir</span></p>
          {guidance.possibilities.map((p) => (
            <div key={p.name} className="mb-1.5 last:mb-0">
              <div className="flex justify-between text-[12px]"><span className="text-slate-700">{p.name}</span><span className="font-semibold tabular-nums text-slate-500">%{p.p}</span></div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${p.p}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kademeli Talimatlar</p>
      <ol className="mt-2 space-y-1.5">
        {guidance.actions.map((a, i) => {
          const Icon = a.icon
          const isMed = a.icon === Clock && medTaken !== null
          return (
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-700">
              <span className={`mt-px grid h-6 w-6 shrink-0 place-items-center rounded-lg ${guidance.mode === 'emergency' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}><Icon className="h-3.5 w-3.5" /></span>
              <span className="pt-0.5">{isMed ? (medTaken ? 'Bugünkü Sertralin 50 mg dozu alındı ✓' : 'Sertralin dozu atlandı · 30 dk sonra hatırlatılacak ⏰') : a.text}</span>
            </li>
          )
        })}
      </ol>

      {guidance.branches && (
        <div className="mt-4 rounded-xl border border-slate-200 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700"><Stethoscope className="h-3.5 w-3.5 text-brand-600" /> Önerilen branş</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">{guidance.branches.map((b) => <span key={b} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">{b}</span>)}</div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Clock className="h-3 w-3" /> {guidance.urgency}</p>
        </div>
      )}

      {guidance.facilities && (
        <div ref={facilitiesRef} className="mt-3 space-y-2 scroll-mt-24">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700"><MapPin className="h-3.5 w-3.5 text-rose-500" /> En yakın sağlık kuruluşları</p>
          {FACILITIES.map((f) => (
            <div key={f.name} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-rose-500 shadow-sm"><Hospital className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-slate-800">{f.name}</p>
                <p className="truncate text-[11px] text-slate-500">{f.type} · {f.dist} · {f.eta}</p>
              </div>
              <button onClick={() => onToast(`Yol tarifi açılıyor: ${f.name} (simülasyon)`)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-brand-600" aria-label="Yol tarifi"><Navigation className="h-4 w-4" /></button>
              <button onClick={() => onToast(`${region.appointment}: ${f.name} için randevu ekranı açılıyor (simülasyon)`, 'ok')} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-brand-600" aria-label="Randevu al"><CalendarPlus className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      {guidance.mode === 'emergency' ? (
        <button onClick={onCall} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-700"><PhoneCall className="h-5 w-5" /> {region.emergency} Acil Arama</button>
      ) : (
        <button onClick={onBreath} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"><Wind className="h-4 w-4" /> 3-3-3 Nefes Egzersizi</button>
      )}
    </Card>
  )
}

/* ─────────────────────── 3-3-3 NEFES EGZERSİZİ ─────────────────────── */
function BreathingRing({ breath, size = 'lg' }) {
  const ph = BREATH_PHASES[breath.phase]
  const big = size === 'lg'
  const dim = big ? 220 : 150
  const r = dim / 2 - 6
  const C = 2 * Math.PI * r
  const progress = (ph.secs - breath.remaining + 1) / ph.secs
  return (
    <div className="relative grid place-items-center" style={{ width: dim, height: dim }}>
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200" />
      <svg className="absolute inset-0 -rotate-90" width={dim} height={dim}>
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="url(#bvg)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - progress)} style={{ transition: breath.remaining === ph.secs ? 'none' : 'stroke-dashoffset 1s linear' }} />
        <defs><linearGradient id="bvg" x1="0" x2="1"><stop offset="0" stopColor="#a876d4" /><stop offset="1" stopColor="#2d0a50" /></linearGradient></defs>
      </svg>
      <div
        className={`absolute rounded-full bg-gradient-to-br ${ph.color} shadow-2xl shadow-brand-500/30`}
        style={{ width: dim * 0.78, height: dim * 0.78, transform: `scale(${ph.scale})`, transition: 'transform 3s ease-in-out, background 1s' }}
      />
      <div className="relative text-center text-white drop-shadow">
        <p className={`${big ? 'text-6xl' : 'text-4xl'} font-bold tabular-nums leading-none`}>{breath.phase === 'prep' ? '•' : breath.remaining}</p>
        <p className={`${big ? 'mt-1 text-base' : 'text-xs'} font-semibold`}>{ph.label}</p>
      </div>
    </div>
  )
}

function BreathingCard({ breath, onStop, vitals, startBpm }) {
  const ph = BREATH_PHASES[breath.phase]
  // Egzersiz başladıktan sonra görülen en yüksek nabza göre düşüşü hesapla
  const peak = useRef(vitals.bpm)
  peak.current = Math.max(peak.current, vitals.bpm)
  const drop = breath.cycles > 0 ? Math.max(0, Math.round(peak.current - vitals.bpm)) : 0
  return (
    <Card className="bv-pop overflow-hidden !border-brand-200">
      <div className="grid items-center gap-5 bg-gradient-to-br from-brand-50 via-white to-brand-100/70 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
        <div className="mx-auto"><BreathingRing breath={breath} size="lg" /></div>
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-700"><Wind className="h-3.5 w-3.5" /> Etkileşimli 3-3-3 Nefes Egzersizi</p>
          <h3 className="font-display mt-1 text-[28px] leading-tight text-brand-950">{ph.label}</h3>
          <p className="text-sm text-slate-600">{ph.hint}</p>
          <div className="mt-4 flex gap-2">
            {['inhale', 'hold', 'exhale'].map((k) => (
              <div key={k} className={`flex-1 rounded-xl border px-2 py-2 text-center transition ${breath.phase === k ? 'border-brand-300 bg-white shadow-sm' : 'border-transparent bg-white/50 opacity-60'}`}>
                <p className="text-lg font-bold text-slate-800">3 sn</p>
                <p className="text-[11px] font-medium text-slate-500">{BREATH_PHASES[k].label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="font-semibold text-slate-700">Tur: <span className="tabular-nums">{breath.cycles}</span></span>
            <span className="flex items-center gap-1 text-slate-600"><HeartPulse className="h-4 w-4 text-rose-500" /> {Math.round(vitals.bpm)} BPM {drop > 3 && <span className="rounded-full bg-emerald-100 px-1.5 text-[11px] font-bold text-emerald-700">↓ {drop}</span>}</span>
            <button onClick={onStop} className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Square className="h-3 w-3" /> Bitir</button>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ─────────────────────── ACİL DURUM TIBBİ ÖZET KARTI ─────────────────────── */
function EmergencyCard({ vitals, hasRecord, region, anomalyStart, anomalyMs, variant, history, queryDone, onCall, onExpand, large }) {
  const row = (label, value, strong) => (
    <div className="flex justify-between gap-3 border-b border-dashed border-red-100 py-1.5 last:border-0">
      <span className="text-slate-500">{label}</span><span className={`text-right ${strong ? 'font-bold text-red-700' : 'font-semibold text-slate-800'}`}>{value}</span>
    </div>
  )
  return (
    <Card className={`bv-pop overflow-hidden !border-red-300 ${large ? 'shadow-2xl' : 'ring-4 ring-red-100'}`}>
      <div className="flex items-center justify-between gap-3 bg-red-600 px-4 py-3 text-white sm:px-5">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className={`font-display ${large ? 'text-2xl' : 'text-[17px]'} leading-tight`}>Acil Durum Tıbbi Özet Kartı</p>
            <p className="text-[11px] text-red-100">Sağlık ekiplerine gösteriniz · {region.system}{hasRecord ? ' + sensör verisi' : ' kaydı yok · yalnızca sensör verisi'}</p>
          </div>
        </div>
        {onExpand && <button onClick={onExpand} className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/25"><Maximize2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Tam ekran</span></button>}
      </div>

      <div className={`grid gap-4 p-4 sm:p-5 ${large ? 'text-[15px]' : 'text-[13px]'} md:grid-cols-2`}>
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-red-600">Anlık Durum</p>
          {row('Nabız', `${Math.round(vitals.bpm)} BPM`, true)}
          {row('SpO₂', `%${Math.round(vitals.spo2)}`, true)}
          {row('Anomali', variant === 'brady' ? 'Bradikardi + hipoksi' : 'Taşikardi + SpO₂ düşüşü')}
          {row('Başlangıç', anomalyStart ? fmtTime(new Date(anomalyStart)) : '—')}
          {row('Süre', fmtDur(anomalyMs), true)}
          <div className="mt-2 h-10"><Sparkline data={history.map((h) => h.bpm)} color="#ef4444" min={25} max={190} height={40} /></div>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-red-600">Hasta Bilgisi</p>
          {row('Ad Soyad', PROFILE.name)}
          {row('Yaş / Cinsiyet', `${PROFILE.age} · ${PROFILE.gender}`)}
          {row('Kan grubu', hasRecord ? PROFILE.blood : 'Bilinmiyor')}
          {!queryDone ? (
            <p className="flex items-center gap-2 py-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> {region.system} kaydı getiriliyor…</p>
          ) : hasRecord ? (
            <>
              {row('Kronik', MEDICAL_RECORD.chronic.map((c) => c.name.split(' (')[0]).join(', '))}
              {row('İlaçlar', MEDICAL_RECORD.meds.map((m) => m.name).join(', '))}
              {row('Alerji', MEDICAL_RECORD.allergies.join(', '), true)}
            </>
          ) : (
            <p className="mt-1 rounded-lg bg-amber-50 px-2.5 py-2 text-[12px] text-amber-800">{region.system} kaydı bulunamadı — kronik hastalık / ilaç bilgisi yok. Kart sensör verisine dayanır.</p>
          )}
          {row('Acil kişi', `${PROFILE.emergencyContact.name} · ${PROFILE.emergencyContact.phone}`)}
        </div>
      </div>
      {!large && (
        <div className="border-t border-red-100 bg-red-50/60 px-4 py-3 sm:px-5">
          <button onClick={onCall} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-base font-extrabold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 active:scale-[.99]">
            <Phone className="h-5 w-5" /> Tek Tıkla {region.emergency}’yi Ara
          </button>
        </div>
      )}
    </Card>
  )
}

/* ─────────────────────── KARAR AKIŞI ─────────────────────── */
function Pipeline({ stage, scenario, hasRecord, region, query }) {
  const failsafe = query.status === 'notfound'
  const hybrid = scenario === 'sleep' && hasRecord && query.status === 'found'
  const esc = { normal: 'Gerek yok', sleep: 'Orta · takip + poliklinik', panic: 'Yüksek · nefes + takip', critical: `Kritik · ${region.emergency} + Acil Kart` }[scenario]
  const steps = [
    { icon: Bluetooth, t: 'Sensör Verisi', s: scenario === 'normal' ? 'Sürekli izleme' : 'Akış alındı' },
    { icon: Zap, t: 'Anomali Tespiti', s: scenario === 'normal' ? 'Sapma yok' : 'Sapma algılandı' },
    { icon: Database, t: `${region.system} Sorgusu`, s: query.status === 'querying' ? 'Sorgulanıyor…' : failsafe ? 'Kayıt yok' : query.status === 'found' ? 'Kayıt bulundu' : 'Beklemede' },
    { icon: failsafe ? ShieldAlert : Brain, t: failsafe ? 'Fail-Safe Analiz' : hybrid ? 'Kişisel + Fail-Safe' : 'Kişisel Analiz', s: stage >= 3 ? 'Tamamlandı' : 'Beklemede' },
    { icon: MessageCircle, t: 'Empatik AI Müdahale', s: stage >= 4 ? 'Sohbet aktif' : 'Beklemede' },
    { icon: Siren, t: 'Kademeli Eskalasyon', s: stage >= 5 ? esc : 'Beklemede' },
  ]
  const state = (i) => {
    if (scenario === 'normal') return i === 0 ? 'active' : 'idle'
    if (i < stage) return 'done'
    if (i === stage) return 'active'
    return 'idle'
  }
  const crit = scenario === 'critical'
  return (
    <Card className="p-4 sm:p-5">
      <CardTitle icon={ArrowRight} title="Karar Akışı (canlı)" sub="Sensör → ulusal sağlık kaydı → AI analiz → kademeli aksiyon" iconClass="bg-slate-100 text-slate-600" />
      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {steps.map((st, i) => {
          const s = state(i)
          const Icon = st.icon
          const failStep = failsafe && (i === 2 || i === 3) && s !== 'idle'
          const cls = s === 'idle' ? 'border-slate-200 bg-slate-50 text-slate-400'
            : failStep ? 'border-amber-300 bg-amber-50 text-amber-800'
              : s === 'active' ? (crit ? 'border-red-300 bg-red-50 text-red-700 ring-2 ring-red-100' : 'border-brand-300 bg-brand-50 text-brand-800 ring-2 ring-brand-100')
                : 'border-emerald-200 bg-white text-slate-700'
          return (
            <li key={i} className={`relative rounded-xl border p-2.5 transition-all duration-500 ${cls}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold opacity-60">{i + 1}</span>
                <Icon className="h-4 w-4" />
                {s === 'done' && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-500" />}
                {s === 'active' && <span className={`ml-auto h-2 w-2 animate-pulse rounded-full ${crit ? 'bg-red-500' : 'bg-brand-500'}`} />}
              </div>
              <p className="mt-1.5 text-[12px] font-semibold leading-tight">{st.t}</p>
              <p className="mt-0.5 text-[11px] leading-tight opacity-80">{st.s}</p>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

/* ─────────────────────── GÜNLÜK ÖZET ─────────────────────── */
function MiniRing({ value, color, children }) {
  const r = 22, C = 2 * Math.PI * r
  return (
    <div className="relative grid h-14 w-14 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56"><circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" /><circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - value)} /></svg>
      {children}
    </div>
  )
}

function DailySummary({ hasRecord, scenario }) {
  const items = [
    { label: 'Adım', value: '6.842', sub: '/ 10.000', v: 0.68, color: '#5b2786', icon: Footprints },
    { label: 'Uyku', value: '7s 12dk', sub: 'skor 84', v: 0.84, color: '#2d0a50', icon: Moon },
    { label: 'Su', value: '1,3 L', sub: '/ 2,5 L', v: 0.52, color: '#0ea5e9', icon: GlassWater },
    { label: 'Aktif dk', value: '38', sub: '/ 45', v: 0.84, color: '#f59e0b', icon: Zap },
  ]
  return (
    <Card className="p-4 sm:p-5">
      <CardTitle icon={Sun} title="Günlük Özet" sub={new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} iconClass="bg-amber-50 text-amber-600" />
      <div className="mt-4 grid grid-cols-4 gap-2">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <div key={it.label} className="flex flex-col items-center text-center">
              <MiniRing value={it.v} color={it.color}><Icon className="h-4 w-4" style={{ color: it.color }} /></MiniRing>
              <p className="mt-1.5 text-[13px] font-bold text-slate-800">{it.value}</p>
              <p className="text-[10px] text-slate-500">{it.label} {it.sub}</p>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex gap-2.5 rounded-xl bg-gradient-to-r from-brand-50 to-brand-100/70 p-3 text-[12.5px] text-slate-700">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p>{scenario === 'normal'
          ? 'Dinlenme nabzın son 7 günün ortalamasında (71 BPM). Akşam 15 dakikalık bir yürüyüş, uyku kaliteni artırabilir.'
          : 'Bugünkü olay kaydedildi. Değerlerin normale döndüğünde sana kısa bir özet ve doktoruna iletebileceğin bir rapor hazırlayacağım.'}</p>
      </div>
      {hasRecord && (
        <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-slate-200 p-2.5 text-[12px] text-slate-600">
          <Pill className="h-4 w-4 shrink-0 text-sky-500" /> <span><span className="font-semibold text-slate-700">İlaç hatırlatıcı:</span> Sertralin 50 mg · her gün 09:00</span>
          <Bell className="ml-auto h-4 w-4 text-slate-400" />
        </div>
      )}
    </Card>
  )
}


/* ─────────────────────── OLAY GÜNLÜĞÜ ─────────────────────── */
function EventLog({ events }) {
  const dot = { info: 'bg-sky-500', ok: 'bg-emerald-500', warn: 'bg-amber-500', critical: 'bg-red-500' }
  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <CardTitle icon={Info} title="Sistem Olay Günlüğü" sub="Arka planda gerçekleşen işlemler" iconClass="bg-slate-100 text-slate-600" />
      <ol className="bv-scroll mt-3 max-h-60 space-y-0 overflow-y-auto pr-1">
        {events.map((e) => (
          <li key={e.id} className="bv-pop relative flex gap-3 border-l border-slate-200 pb-3 pl-4 last:pb-0">
            <span className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${dot[e.level]}`} />
            <div className="min-w-0">
              <p className="text-[12.5px] leading-snug text-slate-700">{e.text}</p>
              <p className="text-[10.5px] tabular-nums text-slate-400">{fmtTime(e.t)}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}

/* ─────────────────────── PROFİL ─────────────────────── */
function ProfileCard({ hasRecord, region }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-800 text-sm font-bold text-white">İK</span>
        <div>
          <p className="font-display text-[17px] text-brand-950">{PROFILE.name}</p>
          <p className="text-xs text-slate-500">{PROFILE.age} yaş · {PROFILE.gender} · {PROFILE.body}</p>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[12px]">
        <p className="flex items-center gap-1.5 font-semibold text-slate-700"><Database className="h-3.5 w-3.5 text-sky-500" /> {region.system} sağlık profili</p>
        {hasRecord ? (
          <ul className="mt-2 space-y-1 text-slate-600">
            {MEDICAL_RECORD.chronic.map((c) => <li key={c.name}>• {c.name} <span className="text-slate-400">({c.since})</span></li>)}
            {MEDICAL_RECORD.meds.map((m) => <li key={m.name}>• {m.name} — <span className="text-slate-500">{m.dose}</span></li>)}
            <li className="text-red-600">• Alerji: {MEDICAL_RECORD.allergies.join(', ')}</li>
          </ul>
        ) : (
          <p className="mt-2 text-amber-700">Kayıt bulunamadı. Anomali durumunda Fail-Safe analiz modu kullanılacak.</p>
        )}
      </div>
    </Card>
  )
}

/* ─────────────────────── AI SOHBET ─────────────────────── */
const ACTION_ICONS = { wind: Wind, calendar: CalendarPlus, map: MapPin, pill: Pill, clock: Clock, phone: PhoneCall, alert: AlertTriangle, smile: Smile }

function ChatCollapsed({ onOpen, unread, lastMsg }) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-brand-600 to-brand-900 p-4 text-white">
        <div className="flex items-center gap-3">
          <span className="relative h-11 w-11 shrink-0"><img src={logo} alt="" className="h-11 w-11 rounded-2xl ring-2 ring-white/30" /><span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-brand-700 bg-emerald-300" /></span>
          <div>
            <p className="font-display text-[16px]">BioVibe AI Asistan</p>
            <p className="text-xs text-white/80">Arka planda izliyor · anomali olursa otomatik açılır</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        {lastMsg && <p className="line-clamp-3 rounded-xl rounded-tl-sm bg-slate-50 p-3 text-[13px] text-slate-700">{lastMsg.text}</p>}
        <button onClick={onOpen} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">
          <MessageCircle className="h-4 w-4" /> Sohbeti aç {unread > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{unread}</span>}
        </button>
      </div>
    </Card>
  )
}

function ChatPanel({ messages, typing, onSend, onAction, scenario, breath, onStopBreath, onClose, mobile, onCall, isCritical, region }) {
  const [text, setText] = useState('')
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, typing, breath.active])

  const head = {
    normal: ['BioVibe AI Asistan', 'Her şey yolunda · seninle', 'from-brand-600 to-brand-900'],
    sleep: ['BioVibe AI · Gece Modu', 'Uyku anomalisi takibi', 'from-brand-950 to-brand-800'],
    panic: ['AI Kriz Asistanı', 'Seninleyim · birlikte nefes alalım', 'from-orange-500 to-amber-500'],
    critical: ['AI Acil Durum Asistanı', 'Sakin ve net talimatlar', 'from-red-600 to-rose-600'],
  }[scenario]

  const quick = {
    normal: ['Bugün nasılım?', 'İlaçlarım neler?', 'Biraz stresliyim'],
    sleep: ['Nefes egzersizi', 'Doktor öner', 'Kendimi iyi hissediyorum'],
    panic: ['Nefes egzersizi', 'Çok korkuyorum', 'Göğsümde ağrı var'],
    critical: ['112’yi ara', 'Yalnızım', 'Göğsümde ağrı var'],
  }[scenario]

  const submit = (e) => {
    e?.preventDefault()
    const v = text.trim()
    if (!v) return
    setText('')
    onSend(v)
  }

  return (
    <div className={`flex h-full flex-col overflow-hidden bg-white ${mobile ? 'rounded-t-3xl sm:rounded-3xl' : 'rounded-2xl border border-slate-200 shadow-sm'}`}>
      <div className={`flex items-center gap-3 bg-gradient-to-r ${head[2]} px-4 py-3 text-white`}>
        <span className="relative h-10 w-10 shrink-0">
          <img src={logo} alt="" className="h-10 w-10 rounded-2xl ring-2 ring-white/30" />
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white/80 bg-emerald-300" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display truncate text-[16px] leading-tight">{head[0]}</p>
          <p className="truncate text-xs text-white/85">{typing ? 'yazıyor…' : head[1]}</p>
        </div>
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/15" aria-label="Sohbeti küçült"><X className="h-4 w-4" /></button>
      </div>

      {mobile && isCritical && (
        <button onClick={onCall} className="flex items-center justify-center gap-2 bg-red-50 py-2.5 text-sm font-extrabold text-red-600 border-b border-red-100"><PhoneCall className="h-4 w-4" /> {region.emergency}’yi Tek Dokunuşla Ara</button>
      )}

      {breath.active && (
        <div className={`flex items-center gap-4 border-b border-brand-100 bg-gradient-to-r from-brand-50 to-brand-100 px-4 py-3 ${mobile ? '' : 'lg:hidden'}`}>
          <BreathingRing breath={breath} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">3-3-3 Nefes</p>
            <p className="text-sm text-slate-600">{BREATH_PHASES[breath.phase].hint}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Tur {breath.cycles}</p>
            <button onClick={onStopBreath} className="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">Bitir</button>
          </div>
        </div>
      )}

      <div className="bv-scroll flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-3 py-4 sm:px-4">
        {messages.map((m) => {
          if (m.from === 'system') return (
            <div key={m.id} className="flex justify-center"><span className="rounded-full bg-slate-200/70 px-3 py-1 text-center text-[11px] font-medium text-slate-600">{m.text}</span></div>
          )
          const ai = m.from === 'ai'
          return (
            <div key={m.id} className={`bv-pop flex gap-2 ${ai ? '' : 'flex-row-reverse'}`}>
              {ai && <img src={logo} alt="" className="mt-1 h-7 w-7 shrink-0 rounded-full ring-1 ring-brand-200" />}
              <div className={`max-w-[85%] ${ai ? '' : 'items-end'} flex flex-col`}>
                <div className={`rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${ai ? 'rounded-tl-sm bg-white text-slate-700 shadow-sm ring-1 ring-slate-100' : 'rounded-tr-sm bg-brand-600 text-white'}`}>{m.text}</div>
                {m.actions && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {m.actions.map((a) => {
                      const Icon = ACTION_ICONS[a.icon] || ArrowRight
                      return (
                        <button key={a.label} onClick={() => onAction(a.action)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition active:scale-95 ${a.danger ? 'bg-red-600 text-white shadow-md shadow-red-600/30 hover:bg-red-700' : 'border border-brand-200 bg-white text-brand-700 hover:bg-brand-50'}`}>
                          <Icon className="h-3.5 w-3.5" />{a.label}
                        </button>
                      )
                    })}
                  </div>
                )}
                <span className={`mt-0.5 text-[10px] text-slate-400 ${ai ? 'pl-1' : 'pr-1 text-right'}`}>{fmtHM(m.time)}</span>
              </div>
            </div>
          )
        })}
        {typing && (
          <div className="flex gap-2">
            <img src={logo} alt="" className="h-7 w-7 shrink-0 rounded-full ring-1 ring-brand-200" />
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
              {[0, 1, 2].map((i) => <span key={i} className="bv-dot h-1.5 w-1.5 rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-100 bg-white p-2.5">
        <div className="bv-scroll mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {quick.map((q) => (
            <button key={q} onClick={() => onSend(q)} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-200">{q}</button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nasıl hissettiğini yaz…"
            className="min-w-0 flex-1 rounded-xl border-0 bg-slate-100 px-3.5 py-2.5 text-sm outline-none ring-1 ring-transparent placeholder:text-slate-400 focus:bg-white focus:ring-brand-300" />
          <button type="submit" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 active:scale-95 disabled:opacity-40" disabled={!text.trim()} aria-label="Gönder"><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────── MODALLAR & BİLDİRİM ─────────────────────── */
function CallModal({ call, now, region, onEnd }) {
  const connected = call.phase === 'connected'
  const dur = connected ? now - call.connectedAt : 0
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-label="Acil arama">
      <div className="bv-pop w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-2xl">
        <div className="p-6 text-center">
          <div className="relative mx-auto grid h-24 w-24 place-items-center">
            {!connected && <span className="bv-ring absolute inset-0 rounded-full border-2 border-red-400" />}
            {!connected && <span className="bv-ring absolute inset-0 rounded-full border-2 border-red-400" style={{ animationDelay: '.7s' }} />}
            <span className={`grid h-20 w-20 place-items-center rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-600'}`}><PhoneCall className="h-9 w-9" /></span>
          </div>
          <p className="mt-4 text-5xl font-bold tracking-wider">{region.emergency}</p>
          <p className="text-sm text-white/70">Acil Çağrı Merkezi</p>
          <p className={`mt-2 text-sm font-semibold ${connected ? 'text-emerald-300' : 'text-red-300'}`}>{connected ? `Bağlandı · ${fmtDur(dur)}` : 'Aranıyor…'}</p>
          <ul className="mt-5 space-y-2 text-left text-[13px]">
            {[
              ['Konum paylaşıldı (GPS · ±8 m)', true],
              ['Acil Durum Tıbbi Özet Kartı iletildi', connected],
              [`Acil kişi bilgilendirildi: ${PROFILE.emergencyContact.name}`, connected],
              ['Operatör: “Ekip yönlendirildi, tahmini varış 8 dk.”', connected && dur > 2500],
            ].map(([t, ok]) => (
              <li key={t} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${ok ? 'bg-white/10' : 'bg-white/5 text-white/40'}`}>
                {ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}{t}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-amber-400/15 px-3 py-2 text-[11px] text-amber-200">DEMO: Gerçek arama yapılmaz. Gerçek kurulumda buton doğrudan <code className="font-mono">tel:{region.emergency}</code> bağlantısını açar.</p>
        </div>
        <button onClick={onEnd} className="flex w-full items-center justify-center gap-2 bg-red-600 py-4 font-bold hover:bg-red-700"><PhoneOff className="h-5 w-5" /> Aramayı Sonlandır</button>
      </div>
    </div>
  )
}

function FullCardModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-8" role="dialog" aria-label="Acil durum kartı">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex justify-end">
          <button onClick={onClose} className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow"><X className="h-4 w-4" /> Kapat</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Toast({ toast }) {
  const tone = { info: 'bg-slate-900', ok: 'bg-emerald-600', critical: 'bg-red-600' }[toast.tone] || 'bg-slate-900'
  return (
    <div key={toast.id} className="pointer-events-none fixed inset-x-0 top-[80px] z-[70] flex justify-center px-4">
      <div className={`bv-pop flex max-w-md items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-xl ${tone}`}>
        <Bell className="h-4 w-4 shrink-0" /> {toast.text}
      </div>
    </div>
  )
}
