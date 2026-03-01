'use client';

import { useState } from 'react';
import { usePromptStore } from '@/lib/store';
import { PlaySquare, Swords, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/components/Toast';

interface ArenaProps {
    promptId: string;
    content: string;
    systemPrompt?: string;
}

interface RunResult {
    model: string;
    response: string;
    error?: string;
    tokens?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    responseTimeMs?: number;
    costUsd?: number;
}

const AVAILABLE_MODELS = [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', costPer1kIn: 0.00015, costPer1kOut: 0.0006 },
    { id: 'gpt-4o', label: 'GPT-4o', costPer1kIn: 0.005, costPer1kOut: 0.015 },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', costPer1kIn: 0.0005, costPer1kOut: 0.0015 },
];

export default function MultiModelArena({ promptId, content, systemPrompt }: ArenaProps) {
    const { openAiKey } = usePromptStore();
    const { showToast } = useToast();
    const [isTesting, setIsTesting] = useState(false);
    const [results, setResults] = useState<Record<string, RunResult>>({});
    const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4o-mini', 'gpt-4o']);
    const [isExpanded, setIsExpanded] = useState(false);

    // Mock variable extraction for quick test without full CSV row context
    const getVariables = (text: string) => {
        return Array.from(new Set(Array.from(text.matchAll(/{{([^}]+)}}/g)).map(m => m[1].trim())));
    };

    const vars = getVariables(content);
    const [testInputs, setTestInputs] = useState<Record<string, string>>({});

    const handleRunArena = async () => {
        if (!content.trim()) return;
        if (selectedModels.length < 2) {
            showToast('Karşılaştırma için en az 2 model seçmelisiniz.', 'error');
            return;
        }

        setIsTesting(true);
        setResults({});

        let finalContent = content;
        Object.keys(testInputs).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalContent = finalContent.replace(regex, testInputs[key]);
        });

        showToast(`Arena başlatıldı... ${selectedModels.length} model yarışıyor!`, 'info');

        const promises = selectedModels.map(async (modelId) => {
            const startTime = performance.now();
            try {
                const res = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: finalContent, apiKey: openAiKey, systemPrompt, model: modelId })
                });

                const data = await res.json();
                const elapsed = Math.round(performance.now() - startTime);

                if (!res.ok) throw new Error(data.error);

                const modelMeta = AVAILABLE_MODELS.find(m => m.id === modelId);
                let cost = 0;
                if (modelMeta && data.usage) {
                    cost = (data.usage.prompt_tokens / 1000 * modelMeta.costPer1kIn) +
                        (data.usage.completion_tokens / 1000 * modelMeta.costPer1kOut);
                }

                return {
                    model: modelId,
                    response: data.result,
                    tokens: data.usage,
                    responseTimeMs: elapsed,
                    costUsd: cost
                } as RunResult;

            } catch (err: any) {
                return {
                    model: modelId,
                    response: '',
                    error: err.message
                } as RunResult;
            }
        });

        const allResults = await Promise.all(promises);
        const resultsMap: Record<string, RunResult> = {};
        allResults.forEach(r => resultsMap[r.model] = r);

        setResults(resultsMap);
        setIsTesting(false);
        showToast('Arena testi tamamlandı!', 'success');
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col mt-6 overflow-hidden">
            <div
                className="p-4 border-b border-zinc-100 bg-gradient-to-r from-slate-50 to-indigo-50/30 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Swords size={18} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-zinc-900">Model Karşılaştırma Arenası</h2>
                        <p className="text-[10px] text-zinc-500">Aynı prompt'u farklı modellerde eşzamanlı test edin.</p>
                    </div>
                </div>
                <div className="text-zinc-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 flex flex-col gap-6">
                    {/* Setup Bar */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Variables Input */}
                        {vars.length > 0 && (
                            <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                                <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">Değişkenler (Test Verisi)</h3>
                                <div className="space-y-3">
                                    {vars.map(v => (
                                        <div key={v}>
                                            <label className="block text-[10px] font-medium text-zinc-500 mb-1">{v}</label>
                                            <input
                                                type="text"
                                                value={testInputs[v] || ''}
                                                onChange={(e) => setTestInputs(prev => ({ ...prev, [v]: e.target.value }))}
                                                placeholder={`${v} için değer...`}
                                                className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Model Selection */}
                        <div className="flex-[2] bg-white border border-zinc-200 rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">Yarışacak Modeller</h3>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_MODELS.map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            setSelectedModels(prev =>
                                                prev.includes(model.id)
                                                    ? prev.filter(id => id !== model.id)
                                                    : [...prev, model.id]
                                            );
                                        }}
                                        className={`px-3 py-2 border rounded-xl text-xs flex items-center gap-2 transition-all ${selectedModels.includes(model.id)
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                                                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                                            }`}
                                    >
                                        <div className={`w-3 h-3 rounded-full border ${selectedModels.includes(model.id) ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-300'}`} />
                                        {model.label}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleRunArena}
                                    disabled={isTesting || selectedModels.length < 2}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                                >
                                    {isTesting ? <Loader2 size={16} className="animate-spin" /> : <PlaySquare size={16} />}
                                    {isTesting ? 'Savaşıyorlar...' : 'Arenayı Başlat'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    {Object.keys(results).length > 0 && (
                        <div className={`grid gap-4 ${Object.keys(results).length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                            {selectedModels.map(modelId => {
                                const res = results[modelId];
                                const modelMeta = AVAILABLE_MODELS.find(m => m.id === modelId);

                                return (
                                    <div key={modelId} className="bg-white border text-left border-zinc-200 rounded-xl overflow-hidden flex flex-col relative">
                                        <div className="bg-zinc-50 border-b border-zinc-200 p-3 flex justify-between items-center">
                                            <span className="font-semibold text-sm text-zinc-800">{modelMeta?.label || modelId}</span>
                                            {res && !res.error && <CheckCircle2 size={16} className="text-emerald-500" />}
                                        </div>

                                        <div className="p-4 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar bg-slate-900 text-slate-100 prose prose-invert prose-sm">
                                            {res ? (
                                                res.error ? (
                                                    <div className="text-red-400 text-sm">{res.error}</div>
                                                ) : (
                                                    <ReactMarkdown>{res.response}</ReactMarkdown>
                                                )
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-zinc-500 italic text-sm">
                                                    Bekleniyor...
                                                </div>
                                            )}
                                        </div>

                                        {res && !res.error && (
                                            <div className="bg-zinc-50 border-t border-zinc-200 p-3 grid grid-cols-3 gap-2 text-center divide-x divide-zinc-200">
                                                <div>
                                                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Süre</div>
                                                    <div className="text-xs font-mono text-zinc-700">{res.responseTimeMs}ms</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Token</div>
                                                    <div className="text-xs font-mono text-indigo-600">{res.tokens?.total_tokens}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Maliyet</div>
                                                    <div className="text-xs font-mono text-emerald-600">${res.costUsd?.toFixed(6)}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
