'use client';

import { useState } from 'react';
import { FlaskConical, Play, Loader2 } from 'lucide-react';
import { usePromptStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import ReactMarkdown from 'react-markdown';

interface ABTesterProps {
    promptId: string;
    contentA: string;
    systemPrompt?: string;
}

interface ABResult {
    input: string;
    responseA: string;
    responseB: string;
    timeA: number;
    timeB: number;
    tokensA?: number;
    tokensB?: number;
    promptTokensA?: number;
    completionTokensA?: number;
    promptTokensB?: number;
    completionTokensB?: number;
}

export default function ABTester({ promptId, contentA, systemPrompt }: ABTesterProps) {
    const { openAiKey, selectedModel, saveTestResult } = usePromptStore();
    const { showToast } = useToast();
    const [promptB, setPromptB] = useState('');
    const [testInput, setTestInput] = useState('');
    const [results, setResults] = useState<ABResult[]>([]);
    const [testing, setTesting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const runTest = async (prompt: string): Promise<{ result: string; time: number; tokens?: number; promptTokens?: number; completionTokens?: number; }> => {
        const start = performance.now();
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, apiKey: openAiKey, systemPrompt, model: selectedModel })
        });
        const elapsed = Math.round(performance.now() - start);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return {
            result: data.result,
            time: elapsed,
            tokens: data.usage?.total_tokens,
            promptTokens: data.usage?.prompt_tokens,
            completionTokens: data.usage?.completion_tokens,
        };
    };

    const handleTest = async () => {
        if (!testInput.trim() || !promptB.trim()) {
            showToast('Lütfen test girdisi ve B varyasyonunu doldurun.', 'error');
            return;
        }

        setTesting(true);
        try {
            // Replace {{input}} or use as suffix
            const finalA = contentA.includes('{{') ? contentA.replace(/\{\{[^}]+\}\}/g, testInput) : `${contentA}\n\n${testInput}`;
            const finalB = promptB.includes('{{') ? promptB.replace(/\{\{[^}]+\}\}/g, testInput) : `${promptB}\n\n${testInput}`;

            const [resA, resB] = await Promise.all([runTest(finalA), runTest(finalB)]);

            // Save results to DB
            saveTestResult(promptId, {
                input: testInput,
                output: finalA,
                aiResponse: resA.result,
                tokens: resA.tokens,
                promptTokens: resA.promptTokens,
                completionTokens: resA.completionTokens,
                responseTime: resA.time,
                isToxic: false,
                ratings: { variation: "A" }
            });
            saveTestResult(promptId, {
                input: testInput,
                output: finalB,
                aiResponse: resB.result,
                tokens: resB.tokens,
                promptTokens: resB.promptTokens,
                completionTokens: resB.completionTokens,
                responseTime: resB.time,
                isToxic: false,
                ratings: { variation: "B" }
            });

            setResults(prev => [{
                input: testInput,
                responseA: resA.result,
                responseB: resB.result,
                timeA: resA.time,
                timeB: resB.time,
                tokensA: resA.tokens,
                tokensB: resB.tokens,
                promptTokensA: resA.promptTokens,
                completionTokensA: resA.completionTokens,
                promptTokensB: resB.promptTokens,
                completionTokensB: resB.completionTokens,
            }, ...prev]);

            showToast('A/B test tamamlandı!', 'success');
        } catch (err: any) {
            showToast(`Test başarısız: ${err.message}`, 'error');
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm mt-6 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between hover:bg-zinc-100/50 transition-all"
            >
                <div className="flex items-center gap-2">
                    <FlaskConical size={18} className="text-pink-500" />
                    <h2 className="font-semibold text-zinc-900">A/B Test Modu</h2>
                </div>
                <span className="text-xs text-zinc-400">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                                Varyasyon A <span className="text-blue-500">(Mevcut)</span>
                            </label>
                            <div className="bg-zinc-950 text-zinc-300 text-xs font-mono p-3 rounded-xl max-h-32 overflow-y-auto whitespace-pre-wrap">
                                {contentA || 'Prompt içeriği boş...'}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                                Varyasyon B <span className="text-pink-500">(Alternatif)</span>
                            </label>
                            <textarea
                                value={promptB}
                                onChange={(e) => setPromptB(e.target.value)}
                                placeholder="Alternatif prompt şablonunu buraya yazın..."
                                rows={4}
                                className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mb-6">
                        <input
                            type="text"
                            value={testInput}
                            onChange={(e) => setTestInput(e.target.value)}
                            placeholder="Test girdisi (değişkenlerin yerine geçecek)..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                        />
                        <button
                            onClick={handleTest}
                            disabled={testing}
                            className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-pink-700 transition-all shadow-sm disabled:opacity-50 text-sm"
                        >
                            {testing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                            {testing ? 'Testing...' : 'Karşılaştır'}
                        </button>
                    </div>

                    {/* Results */}
                    {results.length > 0 && (
                        <div className="space-y-4">
                            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sonuçlar ({results.length})</div>
                            {results.map((r, i) => (
                                <div key={i} className="border border-zinc-200 rounded-xl overflow-hidden">
                                    <div className="bg-zinc-50 px-4 py-2 text-xs text-zinc-500 border-b border-zinc-100">
                                        Girdi: <span className="font-medium text-zinc-700">{r.input}</span>
                                    </div>
                                    <div className="grid grid-cols-2 divide-x divide-zinc-200">
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-blue-600 uppercase">A — Mevcut</span>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">⏱ {r.timeA}ms</span>
                                                    {r.tokensA && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium" title={`Input: ${r.promptTokensA} | Output: ${r.completionTokensA}`}>🪙 {r.tokensA} (IN: {r.promptTokensA}, OUT: {r.completionTokensA})</span>}
                                                </div>
                                            </div>
                                            <div className="text-xs text-zinc-700 prose prose-xs max-w-none max-h-40 overflow-y-auto">
                                                <ReactMarkdown>{r.responseA}</ReactMarkdown>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-pink-600 uppercase">B — Alternatif</span>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded font-medium">⏱ {r.timeB}ms</span>
                                                    {r.tokensB && <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded font-medium" title={`Input: ${r.promptTokensB} | Output: ${r.completionTokensB}`}>🪙 {r.tokensB} (IN: {r.promptTokensB}, OUT: {r.completionTokensB})</span>}
                                                </div>
                                            </div>
                                            <div className="text-xs text-zinc-700 prose prose-xs max-w-none max-h-40 overflow-y-auto">
                                                <ReactMarkdown>{r.responseB}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
