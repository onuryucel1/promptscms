'use client';

import { usePromptStore } from '@/lib/store';
import { KeyRound, CheckCircle2, Save, Cpu, Database, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import ApiKeysSection from '@/components/ApiKeysSection';

const AVAILABLE_MODELS = [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Hızlı ve ekonomik' },
    { id: 'gpt-4o', label: 'GPT-4o', desc: 'En güçlü model' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', desc: 'Eski nesil, çok hızlı' },
];

export default function SettingsPage() {
    const { openAiKey, setOpenAiKey, selectedModel, setSelectedModel, isMigrated, setMigrated, fetchPrompts } = usePromptStore();
    const { showToast } = useToast();
    const [inputValue, setInputValue] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);

    useEffect(() => {
        if (openAiKey) setInputValue(openAiKey);
    }, [openAiKey]);

    const handleSave = () => {
        setOpenAiKey(inputValue.trim());
        setIsSaved(true);
        showToast('API anahtarı başarıyla kaydedildi!', 'success');
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">Ayarlar</h1>
            <p className="text-zinc-400 text-sm mb-8">Prompt CMS sisteminizi yapılandırın.</p>

            {/* API Key Section */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                    <KeyRound size={18} className="text-emerald-500" />
                    <h2 className="font-semibold text-zinc-900">API Entegrasyonları</h2>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-zinc-700 mb-2">OpenAI API Key</label>
                        <p className="text-xs text-zinc-500 mb-3">
                            <span className="font-semibold text-zinc-700">Not:</span> Girdiğiniz anahtar yalnızca tarayıcınızda yerel olarak saklanır. .env.local yapılandırmasını geçersiz kılar.
                        </p>
                        <div className="flex gap-3">
                            <input
                                type="password"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="sk-proj-..."
                                className="flex-1 rounded-xl bg-zinc-50 border-zinc-200 border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 text-zinc-800 transition-all font-mono placeholder:text-zinc-400"
                            />
                            <button
                                onClick={handleSave}
                                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 font-medium px-4 py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2 min-w-[100px]"
                            >
                                {isSaved ? (
                                    <>
                                        <CheckCircle2 size={16} />
                                        Kaydedildi
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Kaydet
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application API Keys Section */}
            <ApiKeysSection />

            {/* Model Selection Section */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                    <Cpu size={18} className="text-violet-500" />
                    <h2 className="font-semibold text-zinc-900">Model Seçimi</h2>
                </div>

                <div className="p-6">
                    <p className="text-xs text-zinc-500 mb-4">Testlerinizde kullanılacak OpenAI modelini seçin.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {AVAILABLE_MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    setSelectedModel(model.id);
                                    showToast(`Model değiştirildi: ${model.label}`, 'info');
                                }}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedModel === model.id
                                    ? 'border-violet-500 bg-violet-50 shadow-sm'
                                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                                    }`}
                            >
                                <div className={`text-sm font-semibold ${selectedModel === model.id ? 'text-violet-700' : 'text-zinc-800'}`}>
                                    {model.label}
                                </div>
                                <div className="text-[11px] text-zinc-400 mt-0.5">{model.desc}</div>
                                {selectedModel === model.id && (
                                    <div className="mt-2 text-[10px] text-violet-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Aktif
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Migration Section */}
            {!isMigrated && (
                <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden mb-6 bg-gradient-to-br from-blue-50 to-indigo-50/50">
                    <div className="p-4 border-b border-blue-100 flex items-center gap-2">
                        <Database size={18} className="text-blue-500" />
                        <h2 className="font-semibold text-blue-900">Yerel Verileri Aktar</h2>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-blue-800/80 mb-4">
                            Önceki sürümlerden kalan (tarayıcınızda kayıtlı) verilerinizi yeni veritabanı sistemine aktarıp hesabınızla eşleştirebilirsiniz.
                            Bu işlem sadece promptlarınızı ve ayarlarınızı hesabınıza kopyalar.
                        </p>

                        <button
                            onClick={async () => {
                                setIsMigrating(true);
                                try {
                                    const storageStr = localStorage.getItem('prompt-cms-storage');
                                    if (!storageStr) {
                                        showToast('Tarayıcıda aktarılacak veri bulunamadı.', 'info');
                                        setMigrated(true);
                                        return;
                                    }

                                    const parsed = JSON.parse(storageStr);
                                    const state = parsed.state || {};
                                    const prompts = state.prompts || [];
                                    const settings = {
                                        openAiKey: state.openAiKey,
                                        selectedModel: state.selectedModel,
                                        theme: state.theme
                                    };

                                    if (prompts.length === 0 && !settings.openAiKey) {
                                        showToast('Aktarılacak önemli bir veri yok.', 'info');
                                        setMigrated(true);
                                        return;
                                    }

                                    const res = await fetch('/api/migrate', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ prompts, settings })
                                    });

                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error);

                                    showToast(`${data.importedCount || 0} prompt başarıyla aktarıldı!`, 'success');
                                    setMigrated(true);
                                    fetchPrompts(); // Refresh prompts in the sidebar/dashboard
                                } catch (e: any) {
                                    showToast(`Hata: ${e.message}`, 'error');
                                } finally {
                                    setIsMigrating(false);
                                }
                            }}
                            disabled={isMigrating}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 disabled:opacity-50"
                        >
                            {isMigrating ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                            {isMigrating ? 'Aktarılıyor...' : 'Verileri Veritabanına Aktar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
