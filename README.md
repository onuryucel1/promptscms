# PromptCMS — AI Prompt Management System

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Prisma-SQLite-2D3748?style=for-the-badge&logo=prisma" />
  <img src="https://img.shields.io/badge/OpenAI-API-412991?style=for-the-badge&logo=openai" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
</p>

> **PromptCMS**, AI prompt şablonlarınızı yönetmenizi, test etmenizi, versiyon kontrolü yapmanızı ve dış uygulamalarınızla entegre etmenizi sağlayan tam özellikli bir içerik yönetim sistemidir.

---

## ✨ Özellikler

### 📝 Prompt Yönetimi
- Prompt oluşturma, düzenleme ve silme
- `{{değişken}}` tabanlı dinamik şablon desteği
- Etiket sistemi ile kategorizasyon
- Sistem prompt (system prompt) desteği
- Akıllı AI optimizasyon önerileri

### 🔄 Versiyon Kontrolü
- Her prompt için sürüm geçmişi
- Sürümler arası fark (diff) görüntüleme
- Herhangi bir sürüme geri dönme
- Sürüm yayınlama (publish) desteği

### 🧪 Test & Değerlendirme
- **Anlık Test** — Değişkenleri doldur, sonucu gör
- **Multi-Model Arena** — Aynı prompt'u farklı modellerde karşılaştır
- **Toplu Test (Batch)** — Birden fazla girdi ile otomatik test
- **A/B Test** — İki farklı prompt versiyonunu karşılaştır
- **Test Geçmişi** — Tüm test sonuçlarını kaydetme ve inceleme

### 🔗 İş Akışları (Workflow Builder)
- Sürükle-bırak görsel iş akışı tasarımı (ReactFlow)
- 4 düğüm tipi: **Prompt**, **Koşul (if/else)**, **Dönüştür**, **Birleştir**
- Koşullu dallanma — Çıktıya göre farklı yollar
- Per-node dinamik değişken girişi
- İş akışı kaydetme/yükleme (veritabanı desteği)
- Çalışma geçmişi

### 📚 Bilgi Bankası (RAG)
- PDF/doküman yükleme
- Otomatik vektör parçalama (chunking)
- Prompt çalıştırırken bağlam enjeksiyonu
- Cosine similarity tabanlı arama

### 🔌 API Entegrasyonu
- Prompt başına benzersiz REST endpoint: `POST /api/v1/run/:promptId`
- API Key yönetimi (oluştur, listele, sil)
- cURL, Node.js, Python kod örnekleri
- Bearer token kimlik doğrulama

### 📊 API Kullanım Analitiği
- Her dış API çağrısı otomatik loglanır
- **Toplam Çağrı, Ortalama Gecikme, Toplam Token, Hata Oranı**
- Filtrelenebilir ve sayfalanabilir log tablosu
- Detay modalı: Giriş/çıkış, token dağılımı, IP, User-Agent
- Dashboard'da özet widget

### 🎛️ Kontrol Paneli
- Prompt, sürüm, test ve token istatistikleri
- Son düzenlenen promptlar
- En çok test edilen promptlar
- API kullanım özeti
- Test sonuçları canlı akışı

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- OpenAI API Anahtarı

### Adımlar

```bash
# Repoyu klonla
git clone https://github.com/onuryucel1/promptscms.git
cd promptscms

# Bağımlılıkları yükle
npm install

# Veritabanını oluştur
npx prisma db push
npx prisma generate

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç ve hesap oluştur.

> **Not:** Ayarlar sayfasından OpenAI API anahtarını eklemeyi unutma.

---

## ⚙️ Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 15 (App Router) |
| Dil | TypeScript |
| Veritabanı | SQLite (Prisma ORM) |
| Kimlik Doğrulama | JWT (Cookie tabanlı) |
| UI | Tailwind CSS |
| İş Akışları | ReactFlow |
| AI | OpenAI API (gpt-4o, gpt-4o-mini, vb.) |
| RAG | Cosine similarity + Prisma |

---

## 📁 Proje Yapısı

```
src/
├── app/
│   ├── api/              # REST API endpoint'leri
│   │   ├── auth/         # Login/logout/me
│   │   ├── prompts/      # Prompt CRUD
│   │   ├── workflows/    # İş akışı CRUD + run history
│   │   ├── api-logs/     # API kullanım analitiği
│   │   ├── v1/run/       # Dış API endpoint'i
│   │   └── dashboard/    # Dashboard istatistikleri
│   ├── prompts/          # Prompt listesi ve düzenleme
│   ├── prompt-chaining/  # İş akışı builder
│   ├── api-deployment/   # API entegrasyon sayfası
│   ├── api-analytics/    # API kullanım analitiği
│   ├── knowledge-base/   # Bilgi bankası
│   └── settings/         # Ayarlar
├── components/           # Yeniden kullanılabilir bileşenler
├── lib/
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # Kimlik doğrulama yardımcıları
│   └── store.ts          # Zustand global state
└── generated/
    └── prisma/           # Otomatik oluşturulan Prisma client
```

---

## 🔑 API Kullanımı

### Prompt Çalıştırma

```bash
curl -X POST https://your-domain.com/api/v1/run/PROMPT_ID \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"variables": {"isim": "Ahmet", "konu": "Yapay Zeka"}}'
```

### Yanıt

```json
{
  "success": true,
  "data": {
    "result": "AI'nın ürettiği metin...",
    "usage": {
      "prompt_tokens": 120,
      "completion_tokens": 85,
      "total_tokens": 205
    },
    "responseTimeMs": 1240,
    "model": "gpt-4o-mini"
  }
}
```

---

## 📸 Ekran Görüntüleri

| Kontrol Paneli | Prompt Editör | İş Akışları |
|---|---|---|
| Dashboard istatistikleri ve son aktiviteler | Dinamik şablon editörü | Görsel workflow builder |

---

## 📄 Lisans

MIT © [Onur Yücel](https://github.com/onuryucel1)
