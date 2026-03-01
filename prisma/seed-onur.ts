import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = 'onuryucel1242@gmail.com';
    const password = await bcrypt.hash('123456', 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: { password }, // Şifreyi 123456 olarak güncelle (varsa)
        create: {
            email,
            name: 'Onur Yücel',
            password,
            settings: {
                create: {
                    selectedModel: 'gpt-4o-mini',
                    theme: 'dark',
                }
            }
        }
    });

    console.log('✅ User created/updated:', user.email);

    // Mevcut promptları temizle (tekrar tekrar eklememek için)
    await prisma.prompt.deleteMany({ where: { userId: user.id } });

    // Seed prompts
    const prompts = [
        {
            title: 'E-Ticaret Ürün Tanıtımı',
            content: '{{product_name}} ürününü {{category}} kategorisinde {{price}} TL fiyatla tanıt. Açıklama: {{description}}',
            systemPrompt: 'Sen bir e-ticaret ürün tanıtım uzmanısın. Dikkat çekici, satış odaklı açıklamalar yaz.',
            tags: JSON.stringify(['E-Ticaret', 'Pazarlama']),
        },
        {
            title: 'Blog Yazısı Üretici',
            content: 'Bana {{konu}} hakkında, {{hedef_kitle}} için ilgi çekici bir blog yazısı fikri ver. İçinde şu kelime geçsin: {{anahtar_kelime}}.',
            systemPrompt: 'Sen deneyimli bir içerik yazarısın. SEO uyumlu, okuyucu dostu içerikler üret.',
            tags: JSON.stringify(['İçerik', 'Blog', 'SEO']),
        },
        {
            title: 'Müşteri Destek Yanıtı',
            content: 'Müşteri şikayeti: {{sikayet}}\nÜrün: {{urun_adi}}\nSipariş No: {{siparis_no}}\n\nBu şikayete profesyonel ve empatik bir yanıt yaz.',
            systemPrompt: 'Sen müşteri hizmetleri temsilcisisin. Her zaman nazik, çözüm odaklı ve profesyonel ol.',
            tags: JSON.stringify(['Müşteri Destek', 'CRM']),
        },
        {
            title: 'Kod Açıklayıcı',
            content: '{{programlama_dili}} dilindeki şu kodu açıkla:\n\n```\n{{kod}}\n```\n\nAçıklama seviyesi: {{seviye}} (başlangıç/orta/ileri)',
            systemPrompt: 'Sen bir yazılım eğitmenisin. Kodları anlaşılır şekilde, örneklerle açıkla.',
            tags: JSON.stringify(['Yazılım', 'Eğitim']),
        },
        {
            title: 'Sosyal Medya Paylaşımı',
            content: '{{platform}} için {{marka}} markasının {{kampanya}} kampanyası hakkında dikkat çekici bir paylaşım metni yaz. Ton: {{ton}}',
            systemPrompt: 'Sen bir sosyal medya uzmanısın. Etkileşim oranı yüksek, viral potansiyelli içerikler üret.',
            tags: JSON.stringify(['Sosyal Medya', 'Pazarlama']),
        },
    ];

    for (const p of prompts) {
        const created = await prisma.prompt.create({
            data: {
                ...p,
                userId: user.id,
                versions: {
                    create: [
                        { versionName: 'V1.0', title: p.title, content: p.content },
                        { versionName: 'V1.1', title: p.title, content: p.content + '\n\n(Güncellenmiş versiyon)' },
                    ],
                },
            },
        });
        console.log(`✅ Prompt: "${created.title}" eklendi.`);
    }

    console.log('\n🎉 İşlem tamamlandı!');
    console.log('Giriş Bilgileri:');
    console.log('Email:', email);
    console.log('Şifre: 123456');
}

main()
    .catch(console.error)
    .finally(() => process.exit(0));
