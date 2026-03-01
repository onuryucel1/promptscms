'use client';

import { useState } from 'react';
import { GitCompare } from 'lucide-react';
import { PromptVersion } from '@/lib/store';

interface VersionDiffProps {
    versions: PromptVersion[];
}

function diffLines(a: string, b: string): { type: 'same' | 'added' | 'removed'; text: string }[] {
    const linesA = a.split('\n');
    const linesB = b.split('\n');
    const result: { type: 'same' | 'added' | 'removed'; text: string }[] = [];

    const maxLen = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < maxLen; i++) {
        const lineA = linesA[i];
        const lineB = linesB[i];

        if (lineA === undefined) {
            result.push({ type: 'added', text: lineB });
        } else if (lineB === undefined) {
            result.push({ type: 'removed', text: lineA });
        } else if (lineA === lineB) {
            result.push({ type: 'same', text: lineA });
        } else {
            result.push({ type: 'removed', text: lineA });
            result.push({ type: 'added', text: lineB });
        }
    }
    return result;
}

export default function VersionDiff({ versions }: VersionDiffProps) {
    const [versionA, setVersionA] = useState<string>(versions[1]?.id || '');
    const [versionB, setVersionB] = useState<string>(versions[0]?.id || '');
    const [isOpen, setIsOpen] = useState(false);

    if (versions.length < 2) return null;

    const a = versions.find(v => v.id === versionA);
    const b = versions.find(v => v.id === versionB);
    const diff = a && b ? diffLines(a.content, b.content) : [];

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm mt-6 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between hover:bg-zinc-100/50 transition-all"
            >
                <div className="flex items-center gap-2">
                    <GitCompare size={18} className="text-teal-500" />
                    <h2 className="font-semibold text-zinc-900">Versiyon Karşılaştırma</h2>
                </div>
                <span className="text-xs text-zinc-400">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="p-6">
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1.5 block">Eski Versiyon</label>
                            <select
                                value={versionA}
                                onChange={(e) => setVersionA(e.target.value)}
                                className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            >
                                {versions.map(v => (
                                    <option key={v.id} value={v.id}>{v.versionName} — {v.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1.5 block">Yeni Versiyon</label>
                            <select
                                value={versionB}
                                onChange={(e) => setVersionB(e.target.value)}
                                className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            >
                                {versions.map(v => (
                                    <option key={v.id} value={v.id}>{v.versionName} — {v.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Diff View */}
                    {a && b && (
                        <div className="border border-zinc-200 rounded-xl overflow-hidden">
                            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                                <span className="text-xs text-zinc-500 font-medium">
                                    {a.versionName} → {b.versionName}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                    {diff.filter(d => d.type === 'added').length} ekleme, {diff.filter(d => d.type === 'removed').length} silme
                                </span>
                            </div>
                            <div className="font-mono text-xs max-h-80 overflow-y-auto">
                                {diff.map((line, i) => (
                                    <div
                                        key={i}
                                        className={`px-4 py-1 border-b border-zinc-50 ${line.type === 'added'
                                                ? 'bg-emerald-50 text-emerald-800'
                                                : line.type === 'removed'
                                                    ? 'bg-red-50 text-red-800 line-through'
                                                    : 'text-zinc-600'
                                            }`}
                                    >
                                        <span className={`mr-3 select-none ${line.type === 'added' ? 'text-emerald-400' : line.type === 'removed' ? 'text-red-400' : 'text-zinc-300'
                                            }`}>
                                            {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                                        </span>
                                        {line.text || ' '}
                                    </div>
                                ))}
                                {diff.length === 0 && (
                                    <div className="p-4 text-center text-zinc-400 italic">Aynı versiyonları seçtiniz veya içerik aynı.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
