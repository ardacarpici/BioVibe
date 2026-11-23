# BioVibe — Proaktif Yapay Zekâ Sağlık ve Yaşam Asistanı

> Programlamada Yeni Eğilimler · Final Projesi · Doğuş Üniversitesi, Bilgisayar Programcılığı

BioVibe, giyilebilir sensör verilerini (uyanıkken ve uykudayken) anlık izleyen, sapma algıladığında
ulusal sağlık kaydını (E-Nabız) arka planda sorgulayan, kayıt yoksa **Fail-Safe** modda kendi analizini
yapan, kullanıcıyla empatik bir sohbet arayüzü üzerinden konuşan ve risk seviyesine göre kademeli
olarak **112 Acil** eskalasyonu yapan bir ön yüz (frontend) prototipidir.

## Teknolojiler
- **React 18**: tüm uygulama tek dosyada (`src/App.jsx`)
- **Tailwind CSS 3**: responsive, medikal temalı arayüz
- **Lucide React**: ikonlar
- **Vite 5** + `vite-plugin-singlefile`: tek bir `index.html` olarak derlenir
- Canvas API: canlı EKG dalgası · SVG: trend grafikleri, nefes halkası

## Tasarım sistemi
- **Logo:** `src/assets/logo.png` (üst bar, AI asistan avatarı, sekme ikonu)
- **Renk paleti** (`tailwind.config.js` → `brand`):
  - `#2d0a50` (brand-900): koyu ton, gece modu, alt bant
  - `#5b2786` (brand-600): ana marka rengi, butonlar
  - `#e6c7ff` (brand-200): açık vurgu, kenarlıklar
  - Risk renkleri (yeşil / turuncu / kırmızı) tıbbi anlamları korunsun diye ayrı tutuldu.
- **Fontlar** (dosyaya gömülü, internetsiz çalışır):
  - **Prata:** başlıklar. Orijinal fontta Türkçe `ğ Ğ ş Ş İ` harfleri bulunmadığı için bu harfler fontun kendi kısa işareti, çengeli ve noktasıyla eklendi (`Prata-TR.woff2`, OFL 1.1).
  - **Raleway:** gövde metni ve sayılar (değişken ağırlık, düz rakamlar).

## Çalıştırma
```bash
npm install
npm run dev       # geliştirme sunucusu → http://localhost:5173
npm run build     # dist/index.html (tek dosya, internetsiz açılır)
```
`dist/index.html` dosyası çift tıklanarak tarayıcıda doğrudan açılabilir. Sunumda internet olmasa bile çalışır.

## Spesifikasyon → Uygulama eşlemesi

| Gereksinim | Uygulamadaki karşılığı |
|---|---|
| 2.1 E-Nabız / küresel API | "Ulusal Sağlık Entegrasyonu" kartı: 5 adımlı sorgu animasyonu, üst barda "sorgulanıyor…" rozeti, Ülke seçici (E-Nabız · ePA · NHS · FHIR) |
| 2.2 Fail-Safe Mod | Kayıt yoksa sorgu 3. adımda "404" ile düşer, sistem kilitlenmez; olasılık analizi, branş önerisi ve en yakın 3 sağlık kuruluşu gösterilir. Uyku senaryosunda **geçmişle eşleşmeyen** SpO₂ düşüşü de Fail-Safe'e gider (hibrit mod). |
| 2.3 Empatik AI + 3-3-3 nefes | Sohbet anomalide otomatik açılır. Panik atakta nefes egzersizi kendiliğinden başlar. Nefes turları ilerledikçe simüle nabız düşer ve AI bunu kullanıcıya bildirir. Serbest metne kural tabanlı empatik yanıt verilir. |
| 2.4 Kademeli talimat + 112 | Orta / Yüksek / Kritik seviyeleri; kritikte kırmızı uyarı modu, tek tıkla 112 butonu, canlı süre sayaçlı Acil Durum Tıbbi Özet Kartı (tam ekran modu ile) |
| 3.1 Senaryo butonları | Normal · Uyku Anomalisi · Panik Atak · Kritik (Taşikardi / Bradikardi seçilebilir) |
| 3.2 E-Nabız anahtarı | "E-Nabız Kaydı: Aktif / Kayıt Yok" (Modül 1 / Modül 2) |
| 4. UI | Canlı EKG, 60 sn trend, büyüyüp küçülen nefes halkası, mobil alt sayfa sohbet, sabit yasal uyarı |

## Sunum için önerilen akış (yaklaşık 4 dk)
1. **Normal Durum**: sakin pano, günlük özet, ilaç hatırlatıcı.
2. **Uyku Anomalisi** (kayıt aktif): E-Nabız sorgusunu, aritmi eşleşmesini ve SpO₂ için Fail-Safe ek analizini gösterin.
3. **E-Nabız anahtarını kapatın → Panik Atak**: Fail-Safe olasılık analizi ile birlikte nefes halkası ve düşen nabzı gösterin.
4. **Kritik Anomali**: kırmızı mod, Acil Kart (Tam ekran), "112 Acil Arama" simülasyonu.
5. Sağ alttaki **Karar Akışı** ve **Olay Günlüğü** ile arka planda olanları anlatın.

## Güvenlik notu
`src/App.jsx` içindeki `DEMO_MODE = true` ayarı sunum sırasında yanlışlıkla gerçek 112 araması yapılmasını engeller.
Bu ayar açıkken arama ekranı yalnızca simüle edilir. `false` yapıldığında buton doğrudan `tel:112` bağlantısını açar.

## Mimari (gerçek ürüne geçişte)
- Sensör katmanı: BLE üzerinden giyilebilir cihaz → `setVitals` yerine gerçek akış
- Sağlık API'si: E-Nabız / HL7 FHIR (OAuth 2.0, KVKK açık rıza) → `runScenario` içindeki sorgu simülasyonu yerine
- AI katmanı: `handleSend` içindeki kural tabanlı motor yerine bir LLM API'si (güvenlik filtreli sistem istemi)

> ⚠️ **Yasal Uyarı:** BioVibe bir tıbbi tanı veya tedavi cihazı değildir; yalnızca karar destek, erken farkındalık ve yönlendirme asistanıdır.
> Tüm hasta, doktor ve kurum adları kurgusaldır.
