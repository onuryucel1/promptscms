'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Activity, Zap, Clock, AlertTriangle, ChevronLeft, ChevronRight,
    Filter, CheckCircle2, XCircle, Eye, X
} from 'lucide-react';

interface ApiLogEntry {
    id: string;
    promptId: string;
    prompt: { id: string; title: string };
    apiKeyId: string | null;
    apiKeyName: string | null;
    input: string;
    output: string;
    model: string;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    responseTime: number;
    status: string;
    errorMessage: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
}

interface Stats {
    totalCalls: number;
    successCount: number;
    errorCount: number;
    errorRate: number;
    avgResponseTime: number;
    totalTokensUsed: number;
}

export default function ApiAnalytics() {
    const [logs, setLogs] = useState<ApiLogEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filterPromptId, setFilterPromptId] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedLog, setSelectedLog] = useState<ApiLogEntry | null>(null);
    const [prompts, setPrompts] = useState<{ id: string; title: string }[]>([]);
    const limit = 20;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (filterPromptId) params.set('promptId', filterPromptId);
            if (filterStatus) params.set('status', filterStatus);

            const res = await fetch(`/api/api-logs?${params}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setLogs(data.logs);
            setStats(data.stats);
            setTotal(data.total);
        } catch {
            setLogs([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [page, filterPromptId, filterStatus]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    useEffect(() => {
        fetch('/api/prompts').then(r => r.ok ? r.json() : []).then(data => {
            const ps = Array.isArray(data) ? data : [];
            setPrompts(ps.map((p: any) => ({ id: p.id, title: p.title })));
        }).catch(() => { });
    }, []);

    const totalPages = Math.ceil(total / limit);

    const formatDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const truncate = (s: string, len: number) => s.length > len ? s.slice(0, len) + '...' : s;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center">
                                <Activity size={18} />
                            </div>
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Toplam Çağrı</span>
                        </div>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalCalls.toLocaleString()}</div>
                        <div className="text-[10px] text-zinc-400 mt-1">{stats.successCount} başarılı · {stats.errorCount} hata</div>
                    </div>

                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl flex items-center justify-center">
                                <Clock size={18} />
                            </div>
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ort. Gecikme</span>
                        </div>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.avgResponseTime.toLocaleString()}<span className="text-sm text-zinc-400 ml-1">ms</span></div>
                    </div>

                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center">
                                <Zap size={18} />
                            </div>
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Toplam Token</span>
                        </div>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalTokensUsed.toLocaleString()}</div>
                    </div>

                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl flex items-center justify-center">
                                <AlertTriangle size={18} />
                            </div>
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hata Oranı</span>
                        </div>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.errorRate}<span className="text-sm text-zinc-400 ml-1">%</span></div>
                    </div>
                </div>
            )}

            {/* Filters + Table */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-3 flex-wrap">
                    <Filter size={14} className="text-zinc-400" />
                    <select value={filterPromptId} onChange={e => { setFilterPromptId(e.target.value); setPage(1); }}
                        className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-zinc-700 dark:text-zinc-300">
                        <option value="">Tüm Promptlar</option>
                        {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                        className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-zinc-700 dark:text-zinc-300">
                        <option value="">Tüm Durumlar</option>
                        <option value="success">Başarılı</option>
                        <option value="error">Hata</option>
                    </select>
                    <div className="ml-auto text-[10px] text-zinc-400 font-medium">
                        {total} kayıt · Sayfa {page}/{totalPages || 1}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-16 text-zinc-400">
                            <Activity size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">Henüz API çağrısı yok</p>
                            <p className="text-xs mt-1">Dış uygulamalardan API çağrısı yapıldığında burada görünecek.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50/80 dark:bg-zinc-900/50 text-[10px] uppercase text-zinc-500 border-b border-zinc-100 dark:border-zinc-700">
                                <tr>
                                    <th className="px-4 py-2.5 font-semibold">Zaman</th>
                                    <th className="px-4 py-2.5 font-semibold">Prompt</th>
                                    <th className="px-4 py-2.5 font-semibold">API Key</th>
                                    <th className="px-4 py-2.5 font-semibold">Model</th>
                                    <th className="px-4 py-2.5 font-semibold text-right">Token</th>
                                    <th className="px-4 py-2.5 font-semibold text-right">Gecikme</th>
                                    <th className="px-4 py-2.5 font-semibold text-center">Durum</th>
                                    <th className="px-4 py-2.5 font-semibold text-center">Detay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/20 transition-colors">
                                        <td className="px-4 py-3 text-zinc-500 whitespace-nowrap text-[10px]">{formatDate(log.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{log.prompt?.title || 'Silinmiş'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                                {log.apiKeyName || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                                {log.model}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                                            {log.totalTokens?.toLocaleString() || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-mono ${log.responseTime > 3000 ? 'text-red-500' : log.responseTime > 1500 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                {log.responseTime}ms
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {log.status === 'success' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 dark:bg-green-900/20 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
                                                    <CheckCircle2 size={10} /> Başarılı
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                                                    <XCircle size={10} /> Hata
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => setSelectedLog(log)}
                                                className="text-zinc-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 disabled:opacity-30 font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all">
                            <ChevronLeft size={14} /> Önceki
                        </button>
                        <span className="text-[10px] text-zinc-400">{page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 disabled:opacity-30 font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all">
                            Sonraki <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-800 z-10">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">API Çağrı Detayı</h3>
                            <button onClick={() => setSelectedLog(null)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Meta info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-3">
                                    <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider mb-1">Prompt</div>
                                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{selectedLog.prompt?.title}</div>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-3">
                                    <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider mb-1">Model</div>
                                    <div className="text-xs font-semibold text-indigo-600">{selectedLog.model}</div>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-3">
                                    <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider mb-1">Gecikme</div>
                                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{selectedLog.responseTime}ms</div>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-3">
                                    <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider mb-1">API Key</div>
                                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{selectedLog.apiKeyName || '-'}</div>
                                </div>
                            </div>

                            {/* Token breakdown */}
                            <div className="flex gap-3">
                                <div className="flex-1 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 text-center">
                                    <div className="text-[9px] text-blue-500 uppercase font-bold mb-1">Input Token</div>
                                    <div className="text-sm font-bold text-blue-700 dark:text-blue-400">{selectedLog.promptTokens?.toLocaleString() || '-'}</div>
                                </div>
                                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 text-center">
                                    <div className="text-[9px] text-emerald-500 uppercase font-bold mb-1">Output Token</div>
                                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{selectedLog.completionTokens?.toLocaleString() || '-'}</div>
                                </div>
                                <div className="flex-1 bg-violet-50 dark:bg-violet-900/10 rounded-xl p-3 text-center">
                                    <div className="text-[9px] text-violet-500 uppercase font-bold mb-1">Toplam Token</div>
                                    <div className="text-sm font-bold text-violet-700 dark:text-violet-400">{selectedLog.totalTokens?.toLocaleString() || '-'}</div>
                                </div>
                            </div>

                            {/* Input */}
                            <div>
                                <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider mb-2">Giriş (Variables)</div>
                                <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-40 whitespace-pre-wrap">
                                    {(() => { try { return JSON.stringify(JSON.parse(selectedLog.input), null, 2); } catch { return selectedLog.input; } })()}
                                </pre>
                            </div>

                            {/* Output */}
                            <div>
                                <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider mb-2">Çıkış (AI Yanıtı)</div>
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 max-h-60 overflow-y-auto whitespace-pre-wrap border border-zinc-200 dark:border-zinc-700">
                                    {selectedLog.output}
                                </div>
                            </div>

                            {/* Error */}
                            {selectedLog.errorMessage && (
                                <div>
                                    <div className="text-[9px] text-red-400 uppercase font-bold tracking-wider mb-2">Hata Mesajı</div>
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3 rounded-xl text-xs text-red-700 dark:text-red-400">
                                        {selectedLog.errorMessage}
                                    </div>
                                </div>
                            )}

                            {/* Footer info */}
                            <div className="flex items-center gap-4 text-[10px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-700">
                                <span>📅 {formatDate(selectedLog.createdAt)}</span>
                                {selectedLog.ipAddress && <span>🌐 {selectedLog.ipAddress}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
