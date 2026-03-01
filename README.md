# PromptCMS — AI Prompt Management & Orchestration System

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Prisma-SQLite-2D3748?style=for-the-badge&logo=prisma" />
  <img src="https://img.shields.io/badge/OpenAI-API-412991?style=for-the-badge&logo=openai" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
</p>

> **PromptCMS**, AI uzmanları ve geliştiriciler için tasarlanmış; prompt şablonlarını yönetmenizi, test etmenizi, LLM tabanlı değerlendirmeler yapmanızı (LLM-as-a-Judge) ve sürükle-bırak mantığıyla iş akışları kurmanızı sağlayan kapsamlı bir içerik yönetim sistemidir.

---

## ✨ Öne Çıkan Özellikler

### 🏢 Çalışma Alanı & Takım Yönetimi (Multi-Tenant)
- **İzole Çalışma Alanları (Workspaces):** Her yeni kullanıcıya kayıt olduğu an özel, tamamen izole edilmiş bir "Workspace" alanı atanır.
- **Takım Arkadaşı Ekleme:** Yöneticilerin (Owner), yetkili ayarlarına girip "Takım Yönetimi" bölümünden alt kullanıcılar (Member) davet etmesi mümkündür.
- **Ortak Veri Erişimi:** Takım üyeleri aynı çalışma alanındaki (Workspace) promptlara, dokümanlara ve iş akışlarına erişip takımla birlikte çalışabilir.

### 📝 Prompt Mühendisliği & Yönetimi
- **Dinamik Şablonlar:** `{{değişken}}` standartlı dinamik parametrelerle prompt şablonları tasarımı ve yönetimi.
- **Sürüm Kontrolü:** Her prompt ve şablon için detaylı sürüm geçmişi (V1.0, V1.1 vb.), yayınlanan (isPublished) versiyon ayrımı ve hızlı kurtarma tespiti.
- **Kategorizasyon:** Projenin yönetilebilirliğini arttıran dinamik etiketleme mimarisi.

### 🧪 Kapsamlı Test & Yapay Zeka Hakemi (LLM-as-a-Judge)
- **Toplu Test (Batch Tester):** CSV formatında dosyalar yükleyerek değişkenlerinize on binlerce veriyi otomatik entegre edebilme.
- **AI Değerlendirici (AI Judge):** Yüzlerce test sonucunu manuel incelemek yerine; sistemin "Robot Yargıcı"na (`gpt-4o`) kendi kurallarınızı (Empati, Doğruluk vb.) vererek çıktıların 1'den 5'e kadar (otomatik) değerlendirilmesini sağlayabilirsiniz. 
- **Değerlendirmeler Paneli (Evaluations):** Geçmiş AI Judge skorlarınızı, kritik "Güvenlik İhlallerini" (Toxcitiy), ve test oturumu bazlı ortalamalarınızı doğrudan görebileceğiniz özel analiz paneli.

### 🔗 Görsel İş Akışları (Prompt Chaining)
- **Tuval Sürükle-Bırak Tasarım:** ReactFlow tabanlı geliştirilmiş, "Workflow" stili nodelar (düğümler) halinde çalışır AI otomasyonları inşa etme.
- **Güçlü Akış Senaryoları:** Prompt, Koşul (If/Else karar mekanizmaları), Markdown okuyucu vb. tetikleyicilerle otomasyon kurguları yazma.

### 📚 Bilgi Bankası Eğitimi (RAG)
- **Güçlü Vektör Aktarımı:** PDF/Doküman içeriklerinizi sisteme kaydedip okutabilme.
- **Akıllı Arama (Chunking & Embedding):** Context Window'u şişirmeden metin parçalarının "Cosine Similarity" denklemiyle aranıp sadece en anlamlı içeriğin LLM'e enjekte edilmesi.

### 🔌 Dış API & Geliştirici Entegrasyonları
- **Güvenli API Mimarisi:** Dış web projeleriniz veya mobil uygulamalarınızın PromptCMS ile bağlantı kurması için sistemde eşsiz "API Key" üretebilme opsiyonu.
- **Rest API Yayınlama:** Yalnızca kendi onayladığınız (Publish) versiyondaki bir Prompt'u dışarıya bir URL ile sunma. ( `POST /api/v1/run/:promptId` )
- **Kapsamlı Analitik:** Kurulan bu API'nin ne kadar saniye gecikme süresi harcadığı, hangi logların düştüğü veya günlük token limitlerini barındıran kapsamlı "API Dashboard" ekranı.

---

## 🚀 Kurulum & Çalıştırma

### Gereksinimler
- Node.js 18 veya üzeri
- Aktif bir OpenAI API Anahtarı 

### Adımlar

```bash
# Repoyu bilgisayarınıza indirin
git clone https://github.com/onuryucel1/promptscms.git
cd promptscms

# Tüm npm paketlerini kurun
npm install

# SQLite veritabanı yansımalarını (schema) uygulayın
npx prisma db push
npx prisma generate

# Uygulama sunucusunu ayağa kaldırın
npm run dev
```

> **Not:** Sistem aktif olduğunda `http://localhost:3000` adresinden oturumunuzu açın. Giriş işleminden sonra sol menüden **Ayarlar** sekmesine tıklayarak projenin kalbi olan OpenAI API anahtarınızı (sk-...) sisteme tanıtın!

---

## ⚙️ Teknoloji Yığını

| Katman | Teknoloji / Yaklaşım |
|---|---|
| Framwork / Altyapı | Next.js 15 (App Router Mimari) |
| Programlama Dili | TypeScript (%100 Tip Güvenliği) |
| Veritabanı | SQLite (Prisma ORM Adaptörü) |
| Kimlik & Oturum Kontrolü | Özel JWT, Password Hash (Bcrypt), HttpOnly Cookies |
| Görünüm / Tasarım | Tailwind CSS, Lucide Icons, Modern Glassmorphism |
| İş Akışları (Workflow) | ReactFlow kütüphanesi |
| AI / LLM Altyapısı | OpenAI API (`gpt-4o`, `gpt-4o-mini`, vs.) |
| Toplu Test Ayrıştırıcı | Papaparse |

---

## 📁 Proje Dosya Ağacı & Mimari

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/         # Login, Kayıt ve Güvenli JWT Rol atamaları
│   │   ├── team/         # Yeni eklenen: Çalışma alanlarına (Workspace) alt kullanıcı davet etme (Owner -> Member)
│   │   ├── evaluate/     # Yeni eklenen: LLM as a Judge (Hakem) modeli yapısının çalıştığı Rest uç nokta
│   │   ├── evaluations/  # Yeni eklenen: Yapay Zeka Hakem geçmiş verilerini dışarıya JSON olarak sunma
│   │   ├── prompts/      # Prompt varyantları ve CRUD işlemleri (Yarat/Sil/Görüntüle)
│   │   ├── workflows/    # İş Akışları (React flow) tasarımlarını JSON halinde yazma işlemleri
│   │   ├── v1/run/       # Dış sunucu / mobil app entegrasyonu için tetikleyici Public URL
│   │   └── dashboard/    # Proje girişindeki genel İstatistikler ve metrik çizelgesi
│   ├── prompts/          # /prompts listesi ve "Toplu Test(Batching)" detay paneli
│   ├── evaluations/      # Yeni eklenen: Değerlendirme Analitiği Sayfası 
│   ├── prompt-chaining/  # İş akışlarının (Workflow) birleştirildiği dizin
│   ├── knowledge-base/   # Embedding ve RAG işlemlerine ev sahipliği yapan bilgi ekranı
│   ├── api-deployment/   # Kod blokları (cURL, Python) aracılığı ile API testlerinin gösterildiği sayfa
│   ├── api-analytics/    # Yaratılan anahtarların ping ve token takiplerini yapan UI 
│   └── settings/         # Şifre değiştirme, Model/Theme Seçimi ve Takım kurma sayfası
├── components/           # Bileşenler (SideBar.tsx, BatchTester.tsx vs.)
├── lib/
│   ├── db.ts             # Prisma Database referans atama dosyası
│   ├── auth.ts           # Token/Session ayrıştırma scripti
│   └── store.ts          # Zustand: Uygulamanın merkezi (Global Context) beyinsel hafızası
└── generated/
    └── prisma/           # Npx generate ardından otomatik oluşan types ve Prisma-Client 
```

---

## 📄 Lisans
Bu proje açık kaynak standartlarında ve esnekliği destekleyecek düzeyde yapılandırılmıştır. (MIT)

---
*Bu sistem geliştirilirken Agentic AI prensiplerinden oldukça faydalanılmıştır. - Coded & Directed by [Onur Yücel](https://github.com/onuryucel1)*
