'use client';

import { History, Plus, Clock, ArrowLeftRight } from 'lucide-react';
import { PromptVersion } from '@/lib/store';

interface VersionHistoryProps {
    versions: PromptVersion[];
    onRestore: (versionId: string) => void;
    onSaveNewVersion: () => void;
    onPublish: (versionId: string) => void;
    isNew: boolean;
}

export default function VersionHistory({ versions, onRestore, onSaveNewVersion, onPublish, isNew }: VersionHistoryProps) {
    if (isNew) {
        return (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-full pointer-events-none opacity-50">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-purple-500" />
                        <h2 className="font-semibold text-zinc-900">History</h2>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-zinc-400">
                    Save the prompt first to enable version history.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History size={18} className="text-purple-500" />
                    <h2 className="font-semibold text-zinc-900">History</h2>
                </div>
                <button
                    onClick={onSaveNewVersion}
                    className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition-all"
                >
                    <Plus size={14} />
                    Save New
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                {(!versions || versions.length === 0) ? (
                    <div className="text-center py-8 text-sm text-zinc-400">
                        No history yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {versions.map((v, idx) => (
                            <div key={v.id} className="group relative p-3 rounded-xl border border-zinc-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-sm text-zinc-800 flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full inline-block ${v.isPublished ? 'bg-emerald-400' : 'bg-purple-400'}`}></span>
                                        {v.versionName}
                                        {v.isPublished && (
                                            <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                                PROD
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(v.createdAt || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>

                                <p className="text-xs text-zinc-500 line-clamp-2">
                                    {v.content}
                                </p>

                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                                    {!v.isPublished && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onPublish(v.id); }}
                                            className="flex items-center justify-center bg-white border border-emerald-200 shadow-sm text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-all text-[10px] font-bold"
                                            title="Canlıya (PROD) Al"
                                        >
                                            SET PROD
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRestore(v.id); }}
                                        className="flex items-center justify-center bg-white border border-zinc-200 shadow-sm text-zinc-600 hover:text-purple-600 p-1.5 rounded-lg transition-all"
                                        title="Bu versiyona geri dön (Restore)"
                                    >
                                        <ArrowLeftRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
