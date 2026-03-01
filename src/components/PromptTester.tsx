'use client';

import { useState, useEffect } from 'react';
import { Play, Variable, Copy, Check, Sparkles, Loader2, Save, ShieldAlert } from 'lucide-react';
import { usePromptStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import ReactMarkdown from 'react-markdown';

interface PromptTesterProps {
    promptId: string;
    content: string;
    systemPrompt?: string;
}

export default function PromptTester({ promptId, content, systemPrompt }: PromptTesterProps) {
    const { openAiKey, selectedModel, saveTestResult } = usePromptStore();
    const { showToast } = useToast();
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);

    // AI state
    const [isTesting, setIsTesting] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<{ time: number, tokens?: number, promptTokens?: number, completionTokens?: number, isToxic: boolean } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Extract variables enclosed in {{...}}
    const extractedVars = Array.from(new Set(
        Array.from(content.matchAll(/{{([^}]+)}}/g)).map(m => m[1].trim())
    ));

    useEffect(() => {
        // Keep existing values for existing variables, initialize new ones
        setVariables(prev => {
            const next: Record<string, string> = {};
            extractedVars.forEach(v => {
                next[v] = prev[v] || '';
            });
            return next;
        });
    }, [content]);

    let finalOutput = content;
    extractedVars.forEach(v => {
        const regex = new RegExp(`{{${v}}}`, 'g');
        finalOutput = finalOutput.replace(regex, variables[v] || `{{${v}}}`);
    });

    const handleCopy = () => {
        navigator.clipboard.writeText(finalOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTestAI = async () => {
        setIsTesting(true);
        setAiResponse(null);
        setMetrics(null);
        const startTime = performance.now();

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: finalOutput,
                    apiKey: openAiKey,
                    systemPrompt,
                    model: selectedModel,
                    promptId: promptId || undefined
                })
            });
            const elapsed = Math.round(performance.now() - startTime);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setAiResponse(data.result);
            setMetrics({
                time: elapsed,
                tokens: data.usage?.total_tokens,
                promptTokens: data.usage?.prompt_tokens,
                completionTokens: data.usage?.completion_tokens,
                isToxic: data.isToxic
            });
            showToast('Yanıt başarıyla üretildi!', 'success');
        } catch (error: any) {
            setAiResponse(`Hata: ${error.message}`);
            showToast(`Test sırasında hata: ${error.message}`, 'error');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSaveResult = async () => {
        if (!promptId) {
            showToast('Lütfen önce promptu kaydedin.', 'error');
            return;
        }
        if (!aiResponse || !metrics) return;
        setIsSaving(true);
        try {
            await saveTestResult(promptId, {
                input: finalOutput,
                output: finalOutput,
                aiResponse,
                tokens: metrics.tokens,
                promptTokens: metrics.promptTokens,
                completionTokens: metrics.completionTokens,
                responseTime: metrics.time,
                isToxic: metrics.isToxic,
                ratings: {}
            });
            showToast('Test sonucu geçmişe kaydedildi!', 'success');
        } catch (e) {
            showToast('Kaydedilirken hata oluştu.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full col-span-1 lg:col-span-1">
            <div className="p-4 border-b border-zinc-100 bg-emerald-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-emerald-500" />
                    <h2 className="font-semibold text-zinc-900">Tekil Test</h2>
                </div>
                <div className="text-xs text-zinc-500 font-medium">
                    {extractedVars.length} Variables found
                </div>
            </div>

            <div className="p-6 flex flex-col gap-6 flex-1">
                {extractedVars.length > 0 ? (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                            <Variable size={16} className="text-zinc-400" />
                            Variables
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {extractedVars.map(v => (
                                <div key={v} className="flex flex-col gap-1">
                                    <label className="text-xs font-mono text-zinc-500 ml-1">{v}</label>
                                    <input
                                        type="text"
                                        value={variables[v] || ''}
                                        onChange={(e) => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                                        placeholder={`Value for ${v}...`}
                                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 px-4 bg-zinc-50 rounded-xl border border-zinc-100 border-dashed">
                        <Variable size={24} className="mx-auto text-zinc-300 mb-2" />
                        <p className="text-zinc-500 text-sm">No variables detected.</p>
                        <p className="text-zinc-400 text-xs mt-1">Add {'{{variable_name}}'} in the editor to see them here.</p>
                    </div>
                )}

            </div>

            <div className="flex-1 flex flex-col mt-4 border-t border-zinc-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                        <Sparkles size={16} className="text-zinc-400" />
                        AI Yanıtı
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleTestAI}
                            disabled={isTesting || !finalOutput.trim()}
                            className="flex flex-row items-center gap-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-md transition-all disabled:opacity-50 shadow-sm"
                        >
                            {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                            {isTesting ? 'Üretiliyor...' : 'Test Et'}
                        </button>
                        {aiResponse && (
                            <button
                                onClick={handleSaveResult}
                                disabled={isSaving}
                                className="flex flex-row items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-md transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Kaydet
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white border text-sm p-4 rounded-xl flex-1 overflow-y-auto min-h-[200px] border-zinc-200 shadow-inner flex flex-col">
                    {!aiResponse && !isTesting ? (
                        <div className="text-center text-zinc-400 italic my-auto">
                            Promptu test etmek için "Test Et" butonuna tıklayın.
                        </div>
                    ) : isTesting ? (
                        <div className="flex flex-col items-center justify-center my-auto text-emerald-600 animate-pulse gap-2">
                            <Loader2 size={24} className="animate-spin" />
                            <span className="text-xs font-semibold">Yapay zeka yanıtlıyor...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {metrics?.isToxic && (
                                <div className="mb-3 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-100/80 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200 w-fit">
                                    <ShieldAlert size={12} />
                                    Güvenlik İhlali
                                </div>
                            )}
                            <div className={`flex-1 overflow-y-auto custom-scrollbar prose prose-xs max-w-none ${metrics?.isToxic ? 'text-red-900' : 'text-zinc-800'}`}>
                                <ReactMarkdown>{aiResponse || ''}</ReactMarkdown>
                            </div>

                            {metrics && (
                                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-100">
                                    <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md font-medium">⏱ {metrics.time}ms</span>
                                    {metrics.tokens && (
                                        <span
                                            className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md font-medium cursor-help"
                                            title={`Input: ${metrics.promptTokens} | Output: ${metrics.completionTokens}`}
                                        >
                                            🪙 {metrics.tokens} (IN: {metrics.promptTokens}, OUT: {metrics.completionTokens})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
