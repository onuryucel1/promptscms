'use client';

import { useEffect } from 'react';
import { usePromptStore } from '@/lib/store';
import { LineChart, Clock, ShieldCheck, ShieldAlert, KeyRound } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TestHistory({ promptId }: { promptId: string }) {
    const { fetchTestResults, testResults } = usePromptStore();

    useEffect(() => {
        if (promptId) {
            fetchTestResults(promptId);
        }
    }, [promptId, fetchTestResults]);

    const results = testResults[promptId] || [];

    if (results.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center mt-6">
                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <LineChart size={24} className="text-zinc-300" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 mb-1">Henüz Test Sonucu Yok</h3>
                <p className="text-xs text-zinc-500">Bu prompt için henüz bir test kaydı bulunmuyor. Batch Tester veya A/B Tester üzerinden test çalıştırdıkça sonuçlar burada listelenecektir.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm mt-6 overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                <LineChart size={18} className="text-indigo-500" />
                <h2 className="font-semibold text-zinc-900">Geçmiş Test Sonuçları</h2>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full ml-2">
                    {results.length} Kayıt
                </span>
            </div>

            <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                {results.map((test) => (
                    <div key={test.id} className="p-4 hover:bg-zinc-50 transition-colors">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Input Details */}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                        <span>Girdi (İstem)</span>
                                        <span className="font-normal normal-case text-zinc-400">
                                            {test.createdAt ? new Date(test.createdAt).toLocaleString('tr-TR') : ''}
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono bg-zinc-900 text-zinc-300 p-3 rounded-xl whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                                        {test.input || test.output}
                                    </div>
                                </div>
                            </div>

                            {/* AI Response Details */}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 flex justify-between items-center">
                                        <span>Yapay Zeka Yanıtı</span>
                                        {test.isToxic && (
                                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                <ShieldAlert size={12} /> Güvenlik İhlali
                                            </span>
                                        )}
                                        {!test.isToxic && test.aiResponse && (
                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                <ShieldCheck size={12} /> Güvenli
                                            </span>
                                        )}
                                    </div>

                                    <div className={`text-xs p-3 rounded-xl border max-h-32 overflow-y-auto custom-scrollbar prose prose-xs max-w-none ${test.isToxic ? 'bg-red-50/50 border-red-200 text-red-900' : 'bg-white border-zinc-200 text-zinc-800'}`}>
                                        {test.aiResponse ? (
                                            <ReactMarkdown>{test.aiResponse}</ReactMarkdown>
                                        ) : (
                                            <span className="text-zinc-400 italic">Yanıt üretilmedi (Hata veya iptal)</span>
                                        )}
                                    </div>
                                </div>

                                {/* Metrics & Ratings */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-2">
                                        {test.tokens !== null && test.tokens !== undefined && (
                                            <div className="flex items-center gap-1 text-[10px] bg-zinc-100 text-zinc-600 px-2 py-1 rounded-lg font-medium border border-zinc-200" title={`Input: ${test.promptTokens} | Output: ${test.completionTokens}`}>
                                                <KeyRound size={12} className="text-zinc-400" />
                                                {test.tokens} Token {test.promptTokens !== undefined && test.completionTokens !== undefined ? `(IN: ${test.promptTokens}, OUT: ${test.completionTokens})` : ''}
                                            </div>
                                        )}
                                        {test.responseTime !== null && test.responseTime !== undefined && (
                                            <div className="flex items-center gap-1 text-[10px] bg-zinc-100 text-zinc-600 px-2 py-1 rounded-lg font-medium border border-zinc-200">
                                                <Clock size={12} className="text-zinc-400" />
                                                {test.responseTime} ms
                                            </div>
                                        )}
                                    </div>

                                    {test.ratings && Object.keys(test.ratings).length > 0 && typeof test.ratings === 'object' && (
                                        <div className="flex items-center gap-2">
                                            {Object.entries(parsedRatings(test.ratings)).map(([crit, rate]) => (
                                                <div key={crit} className="flex flex-col items-center bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100">
                                                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider mb-0.5 truncate max-w-[80px]" title={crit}>
                                                        {crit}
                                                    </span>
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <svg key={star} className={`w-2.5 h-2.5 ${(rate as number) >= star ? 'text-amber-400' : 'text-zinc-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e4e4e7;
          border-radius: 10px;
        }
      `}} />
        </div>
    );
}

function parsedRatings(ratings: any): Record<string, number> {
    if (typeof ratings === 'string') {
        try {
            return JSON.parse(ratings);
        } catch {
            return {};
        }
    }
    return ratings || {};
}
