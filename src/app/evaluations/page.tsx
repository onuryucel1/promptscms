'use client';

import { useEffect, useState } from 'react';
import { Brain, Calendar, FileText, LayoutDashboard, ChevronRight, Activity, Beaker } from 'lucide-react';
import Link from 'next/link';

interface EvaluationBatch {
    id: string;
    name: string;
    promptTitle: string;
    promptId: string;
    criteria: string[];
    resultsCount: number;
    createdAt: number;
    results: any[];
}

export default function EvaluationsPage() {
    const [batches, setBatches] = useState<EvaluationBatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/evaluations')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBatches(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const calculateAverage = (batch: EvaluationBatch, criterion: string) => {
        const rated = batch.results.filter(r => r.ratings && r.ratings[criterion]);
        if (rated.length === 0) return '-';
        const sum = rated.reduce((acc, r) => acc + r.ratings[criterion], 0);
        return (sum / rated.length).toFixed(1);
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    <div className="text-zinc-500 font-medium">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                            <Brain className="text-violet-500" />
                            Yapay Zeka Değerlendirmeleri (AI Judge)
                        </h1>
                        <p className="text-zinc-500 mt-1">Geçmiş toplu test sonuçlarınızı ve LLM as a Judge skorlarınızı listeleyin.</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {batches.length === 0 ? (
                        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                                <Beaker size={32} className="text-zinc-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900">Henüz Test Bulunamadı</h3>
                            <p className="text-zinc-500 max-w-sm mt-2">
                                Prompt sayfasından "Toplu Test (Batch Tester)" özelliğini kullanarak değerlendirme yapabilirsiniz.
                            </p>
                            <Link href="/prompts" className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                                Promptlara Git
                            </Link>
                        </div>
                    ) : (
                        batches.map((batch) => (
                            <div key={batch.id} className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-lg hover:shadow-zinc-200/50 transition-all group">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-zinc-900">{batch.name}</h3>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                                <div className="flex items-center gap-1.5 bg-zinc-100 px-2 py-1 rounded-md">
                                                    <FileText size={14} />
                                                    {batch.promptTitle}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    {new Date(batch.createdAt).toLocaleString('tr-TR')}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Activity size={14} />
                                                    {batch.resultsCount} Yanıt
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/prompts/${batch.promptId}?tab=batch`}
                                            className="hidden md:flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            Prompt'a Git <ChevronRight size={16} />
                                        </Link>
                                    </div>

                                    {/* Criteria averages */}
                                    {batch.criteria && batch.criteria.length > 0 && (
                                        <div className="pt-3 border-t border-zinc-100 flex flex-wrap gap-3">
                                            {batch.criteria.map((c, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-lg text-sm">
                                                    <span className="text-violet-900 font-medium text-xs uppercase tracking-wider">{c}</span>
                                                    <div className="h-4 w-px bg-violet-200" />
                                                    <div className="font-bold text-violet-700 flex items-center gap-1">
                                                        {calculateAverage(batch, c)}
                                                        <span className="text-violet-400 text-xs font-normal">/ 5</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Toxic violations block */}
                                            {batch.results.filter(r => r.isToxic).length > 0 && (
                                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg text-sm">
                                                    <span className="text-red-900 font-medium text-xs uppercase tracking-wider">Güvenlik İhlali</span>
                                                    <div className="h-4 w-px bg-red-200" />
                                                    <div className="font-bold text-red-700 flex items-center gap-1">
                                                        {batch.results.filter(r => r.isToxic).length}
                                                        <span className="text-red-400 text-xs font-normal">vaka</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
