'use client';

import { Terminal, BookOpen, KeyRound, Activity } from 'lucide-react';
import ApiKeysSection from '@/components/ApiKeysSection';
import ApiAnalytics from '@/components/ApiAnalytics';

export default function ApiDeploymentPage() {
    return (
        <div className="max-w-6xl mx-auto py-8 px-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Terminal size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">API Entegrasyonu</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Uygulamalarınıza yapay zeka entegre etmek için API erişimini yönetin.</p>
                </div>
            </div>

            <div className="mt-8 space-y-6">
                {/* Documentation Section */}
                <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden animate-slide-up delay-100">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-500" />
                        <h2 className="font-semibold text-zinc-900 dark:text-white">API Kullanım Rehberi</h2>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            <p>
                                PromptCMS API'si üzerinden oluşturduğunuz prompt şablonlarınızı kendi uygulamalarınızda (web, mobil, backend) otomatik olarak tetikleyebilirsiniz.
                            </p>

                            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-2">Kimlik Doğrulama</h3>
                                <p className="mb-3">
                                    Tüm API isteklerinizde <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">Authorization: Bearer &lt;API_KEY&gt;</code> başlığını göndermeniz zorunludur. Aşağıdaki bölümden yeni bir API Anahtarı oluşturabilirsiniz.
                                </p>
                            </div>

                            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-2">Genel Kullanım</h3>
                                <p className="mb-3">
                                    Herhangi bir promptu tetiklemek için Prompt detay sayfasına gidip "API" butonuna tıklayarak o prompta özel entegrasyon kodlarını (cURL, Node.js, Python) kopyalayabilirsiniz.
                                </p>
                                <pre className="bg-zinc-900 text-zinc-300 p-3 rounded-lg overflow-x-auto text-xs font-mono">
                                    {`POST /api/v1/run/<PROMPT_ID>
Content-Type: application/json
Authorization: Bearer SIZIN_API_KEY_NIZ

{
  "variables": {
    "isim": "Ahmet",
    "konu": "Yapay Zeka"
  }
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Keys Management Section */}
                <div className="animate-slide-up delay-200">
                    <ApiKeysSection />
                </div>

                {/* API Usage Analytics Section */}
                <div className="animate-slide-up delay-300">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center">
                            <Activity size={16} />
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">API Kullanım Analitiği</h2>
                    </div>
                    <ApiAnalytics />
                </div>
            </div>
        </div>
    );
}
