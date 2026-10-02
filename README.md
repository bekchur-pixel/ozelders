# 🎹 Piyano Ders Takip

**Özel ders öğretmenleri için hediye niteliğinde, mobil öncelikli ders takip uygulaması.**

Ders programı, randevu, ödeme takibi ve WhatsApp hatırlatmaları tek ekranda. Öğretmene hediye olarak hazırlandı — sade, hızlı ve telefonla kullanıma odaklı.

> 💡 **Bu proje, bir kızının piyano öğretmenine hediye etmek için hazırlanmıştır.** İster aynen kullanın, ister kendinize göre özelleştirin.

---

## ✨ Özellikler

| Özellik | Açıklama |
|---|---|
| 🔐 **Öğretmen girişi** | Firebase Email/Şifre ile tek kullanıcılı güvenli giriş |
| 🎓 **Öğrenci yönetimi** | Öğrenci ekle, veli bilgisi, telefon, ders ücreti, not |
| 📅 **Ders / randevu** | Tek ders veya haftalık tekrarlı program (4 / 8 / 12 ders) |
| 📝 **Ders düzenleme** | Yapılan dersin tarihini, ücretini, süresini sonradan değiştir |
| ✅ **Durum takibi** | Planlandı / Yapıldı / İptal |
| 💰 **Ödeme takibi** | Ders bazında ödendi / ödenmedi işaretleme |
| 🔴 **Borç takibi** | Sadece **yapılan ve ödenmeyen** dersler borca yansır |
| 📊 **Öğrenci detayı** | Gelecek + geçmiş dersler, **toplam tahsilat** ve **güncel borç** |
| 🏠 **Ana sayfa özeti** | Bugünkü dersler, bu hafta, bekleyen ödeme toplamı |
| 📱 **WhatsApp hatırlatma** | Tek dokunuşla hazır ders/ödeme mesajı ile WhatsApp aç |
| 📲 **PWA / mobil öncelik** | Telefonda uygulama gibi ana ekrana eklenebilir |

---

## 🧰 Teknoloji Yığını

- **[Next.js 16](https://nextjs.org)** (App Router, TypeScript)
- **[Tailwind CSS 4](https://tailwindcss.com)**
- **[Firebase](https://firebase.google.com)** — Authentication + Firestore
- **[date-fns](https://date-fns.org)** — tarih/saat işlemleri

---

## 🚀 Kurulum (5 dakika)

### 1. Repoyu kopyala

```bash
git clone https://github.com/bekchur-pixel/ozelders.git
cd ozelders
npm install
```

### 2. Firebase projesi aç

1. [Firebase Console](https://console.firebase.google.com) → **Add project** → isim: `piyano-takip`
2. **Authentication → Sign-in method → Email/Password → Enable → Save**
3. **Authentication → Users → Add user** → öğretmen e-postası + şifre oluştur (bunu öğretmene ver)
4. **Firestore Database → Create database → Start in production mode → Konum: `europe-west`**
5. **Firestore → Rules** sekmesine `firestore.rules` dosyasındaki kuralları yapıştır → **Publish**
6. **Project settings (⚙️) → Your apps → Web (`</>`)** → App nickname: `piyano` → `firebaseConfig` değerlerini kopyala

### 3. Ortam değişkenlerini ayarla

```bash
Copy-Item .env.example .env.local
```

`.env.local` dosyasını açıp Firebase'den aldığın 6 anahtarı doldur:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 4. Çalıştır

```bash
npm run dev
```

Tarayıcıda **http://localhost:3000/giris** adresini aç → oluşturduğun öğretmen e-postası/şifresiyle giriş yap. 🎉

---

## 📖 Kullanım Kılavuzu

### 🏠 Ana Sayfa
- **Bugün** kaç ders olduğu, kaçının tamamlandığı
- **Bekleyen ödeme** toplamı (sadece yapılıp ödenmemiş dersler)
- Bugünkü dersler listesi: ⏳ planlandı / ✅ yapıldı / 💰 ödendi
- **Ödenmemiş dersler**: kırmızı kart listesi + tek dokunuşla "Ödendi Yap" + WhatsApp hatırlatma
- **Bu hafta** ders listesi

### 🎓 Öğrenciler
- **＋ Yeni Öğrenci Ekle**: ad, veli adı, veli telefonu (05xx), varsayılan ücret, not
- Öğrenciye **tıkla** → detay sayfası:
  - **Gelecek dersler** (bugün vurgulu, anında "✓ Yapıldı" işaretlenebilir)
  - **Geçmiş dersler** (ödeme durumu + 💰 Ödendi butonu)
  - **Toplam tahsilat** (yeşil) ve **Güncel borç** (kırmızı)
- **WA** butonu: veliye hazır mesaj ile WhatsApp açar

### 📅 Dersler
- Filtreler: Tümü / Bugün / Bu hafta / Gelecek / 🔴 Borçlular
- Her derste:
  - `💰 Ödendi işaretle` / `Ödenmedi yap`
  - `✓ Yapıldı` — ders gerçekleşti
  - `İptal` — ders iptal edildi
  - `📝 Tarih / Ücret Düzenle` — tarih, süre, ücret, not değiştirme
  - `🗑` — sil
  - `WA` — ders hatırlatma mesajı

### ➕ Yeni Randevu
- Öğrenci seç → gün + saat → süre → ücret → **tekrarlı program** (haftalık 4/8/12 ders) → not
- Tekrarlı dersler tek seferde oluşturulur, her biri ayrı kayıt olur

---

## 🗄️ Veri Modeli (Firestore)

```
students/{id}
  ├─ name, parentName, phone (05xx...), fee, note
  ├─ active, createdAt

lessons/{id}
  ├─ studentId, studentName, phone
  ├─ date (timestamp), durationMin, fee
  ├─ status: planned | done | cancelled
  ├─ paid: bool
  ├─ groupId?  (tekrarlı derslerde aynı grup)
  ├─ note, createdAt
```

> **Borç mantığı:** Bir dersin borca yansıması için hem **`status = done`** hem de **`paid = false`** olmalıdır. Planlanan/iptal dersler tahsilatı ve borcu etkilemez.

### 🔒 Firestore Rules (`firestore.rules`)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{id} {
      allow read, write: if request.auth != null;
    }
    match /lessons/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Sadece giriş yapmış öğretmen verilere erişebilir.

---

## 🌍 Yayınlama (Deploy)

### Seçenek A — Vercel (kolay, ücretsiz)

1. [vercel.com](https://vercel.com) → GitHub ile giriş → **Import** → `ozelders`
2. **Environment Variables** bölümüne `.env.local`'deki 6 anahtarı ekle
3. **Deploy** → link bitti. 📱 Telefonunda "Ana ekrana ekle" ile uygulama gibi kullan.

### Seçenek B — Firebase Hosting

```bash
npm i -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## 📁 Proje Yapısı

```
ozelders/
├─ app/
│  ├─ page.tsx               → Ana sayfa (bugün, özet, ödenmemişler)
│  ├─ giris/page.tsx         → Öğretmen girişi
│  ├─ ogrenciler/page.tsx    → Öğrenci listesi
│  ├─ ogrenciler/[id]/page.tsx → Öğrenci detayı (tahsilat + borç)
│  ├─ dersler/page.tsx       → Ders listesi + filtreler + düzenleme
│  └─ dersler/yeni/page.tsx  → Yeni randevu (tek / tekrarlı)
├─ components/
│  ├─ AuthProvider.tsx       → Giriş durumu yönetimi
│  └─ BottomNav.tsx          → Mobil alt menü
├─ lib/
│  ├─ firebase.ts            → Firebase başlangıcı
│  ├─ types.ts               → Student / Lesson tipleri
│  └─ utils.ts               → ₺ format, tarih, WhatsApp link
├─ public/manifest.json      → PWA
├─ firestore.rules
├─ .env.example
└─ README.md
```

---

## 🛠️ Geliştirme Komutları

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production derleme |
| `npm run start` | Derlemeyi çalıştır |
| `npm run lint` | ESLint kontrolü |

---

## 🎁 Teşekkür & Not

Bu uygulama sevgiyle hazırlandı — bir piyano öğretmeninin gününü kolaylaştırmak için. Umarım sizin öğretmeniniz de çok sevsin! 🎶

> **Özelleştirme fikri:** Ders ücreti, renk teması, logo ve öğretmen adı gibi alanları kendi öğretmeninize göre düzenleyebilirsiniz — sorularınız olursa [GitHub Issues](https://github.com/bekchur-pixel/ozelders/issues) üzerinden ulaşın.