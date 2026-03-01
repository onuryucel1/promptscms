import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { apiKey, originalPrompt, aiResponse, criteria, model = 'gpt-4o-mini' } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API anahtarı ayarlanmamış.' }, { status: 400 });
        }

        if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
            return NextResponse.json({ error: 'Değerlendirilecek en az 1 kriter gerekli.' }, { status: 400 });
        }

        const criteriaStr = criteria.map(c => `- ${c}`).join('\n');

        const systemPrompt = `Sen tarafsız, profesyonel ve son derece katı bir Yapay Zeka Hakemisin (LLM-as-a-Judge).
Görevlerin:
1. Sana verilen Orijinal Prompt'u ve ona karşılık Yapay Zekanın ürettiği Yanıtı dikkatle incele.
2. Belirtilen Değerlendirme Kriterlerine göre bu yanıtı 1 ile 5 arasında (1: Çok Kötü, 5: Mükemmel) puanla.
3. Çıktını KESİNLİKLE JSON formatında ver. Başka hiçbir açıklama yazma.

Örnek Çıktı Formatı:
{
  "ratings": {
    "Kriter 1": 4,
    "Kriter 2": 2
  }
}

Değerlendirme Kriterleri:
${criteriaStr}
`;

        const userPrompt = `Orijinal Prompt:\n${originalPrompt}\n\n---\n\nYapay Zeka Yanıtı:\n${aiResponse}`;

        const gptModel = (model === 'gpt-5.2' || model === 'gpt-5.2-pro') ? 'gpt-4o' : model;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: gptModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1, // Hakem modeli kararlı olmalı
            }),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const content = data.choices[0].message.content;
        let parsedResult;
        try {
            parsedResult = JSON.parse(content);
        } catch (e) {
            throw new Error("Hakem modeli geçersiz bir JSON döndürdü.");
        }

        // Return usage info if needed (optional)
        const usage = data.usage;

        return NextResponse.json({ success: true, data: parsedResult, usage });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Değerlendirme yapılamadı' }, { status: 500 });
    }
}
