'use client';

import { usePromptStore } from '@/lib/store';
import Link from 'next/link';
import {
  PlusCircle, FileText, ChevronRight, Zap, Layers, Database,
  AlertTriangle, CheckCircle2, Clock, Activity, TrendingUp,
  Terminal, BarChart3, BrainCircuit, BookOpen, Edit3, XCircle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DashboardData {
  totalPrompts: number;
  totalVersions: number;
  totalTests: number;
  totalTokens: number;
  totalCostUsd: number;
  averageResponseTime: number;
  recentTests: {
    id: string;
    promptId: string;
    promptTitle: string;
    model: string;
    responseTime: number | null;
    tokens: number | null;
    status: string;
    createdAt: string;
  }[];
  topPrompts: {
    id: string;
    title: string;
    testCount: number;
    updatedAt: string;
  }[];
  recentPrompts: {
    id: string;
    title: string;
    updatedAt: string;
    versionCount: number;
  }[];
  ragStats: {
    totalDocuments: number;
    totalChunks: number;
  };
  apiStats: {
    totalCalls: number;
    errorCount: number;
    errorRate: number;
    avgResponseTime: number;
    totalTokens: number;
    recentLogs: {
      id: string;
      promptTitle: string;
      apiKeyName: string;
      model: string;
      totalTokens: number | null;
      responseTime: number;
      status: string;
      createdAt: string;
    }[];
  };
}

export default function Home() {
  const { prompts, openAiKey, selectedModel } = usePromptStore();
  const [mounted, setMounted] = useState(false);
  const [dashData, setDashData] = useState<DashboardData | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch('/api/dashboard')
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (json?.data) setDashData(json.data); })
      .catch(() => { });
  }, []);

  const totalVersions = useMemo(() =>
    prompts.reduce((sum, p) => sum + (p.versions?.length || 0), 0), [prompts]);

  if (!mounted) return null;

  // System alerts
  const alerts: { icon: React.ReactNode; text: string; color: string; link?: string }[] = [];
  if (!openAiKey) alerts.push({
    icon: <AlertTriangle size={15} />,
    text: 'OpenAI API anahtarı girilmemiş.',
    color: 'amber',
    link: '/settings',
  });
  if (!selectedModel) alerts.push({
    icon: <AlertTriangle size={15} />,
    text: 'Bir model seçilmemiş.',
    color: 'amber',
    link: '/settings',
  });
  if (prompts.length === 0) alerts.push({
    icon: <AlertTriangle size={15} />,
    text: 'Henüz hiç prompt oluşturulmamış.',
    color: 'blue',
    link: '/prompts/new',
  });

  const statusColors: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  const statusLabel: Record<string, string> = {
    success: 'Başarılı', error: 'Hata', pending: 'Bekleniyor',
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Kontrol Paneli</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Prompt performansınıza ve kütüphanenize genel bakış</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/prompts"
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 px-5 py-2.5 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
          >
            <FileText size={18} />
            Kütüphane
          </Link>
          <Link
            href="/prompts/new"
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/20"
          >
            <PlusCircle size={18} />
            Yeni Prompt
          </Link>
        </div>
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2 mb-6 animate-slide-up">
          {alerts.map((alert, i) => (
            <Link
              key={i}
              href={alert.link || '#'}
              className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300 text-sm hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all"
            >
              <span className="shrink-0 text-amber-500">{alert.icon}</span>
              {alert.text}
              <ChevronRight size={14} className="ml-auto text-amber-400" />
            </Link>
          ))}
        </div>
      )}

      {/* Analytics Panel */}
      <AnalyticsPanel />


      {/* Bottom grid: Recent prompts + Top prompts + Recent tests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

        {/* Recently Updated Prompts */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden animate-slide-up delay-100">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
            <Edit3 size={16} className="text-indigo-500" />
            <span className="font-semibold text-sm text-zinc-900 dark:text-white">Son Düzenlenen Promptlar</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {dashData && dashData.recentPrompts.length > 0 ? dashData.recentPrompts.map(p => (
              <Link
                key={p.id}
                href={`/prompts/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors group"
              >
                <div className="truncate mr-2">
                  <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">{p.title}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {p.versionCount} sürüm · {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true, locale: tr })}
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 shrink-0 transition-colors" />
              </Link>
            )) : (
              <div className="p-4 text-sm text-zinc-400 text-center py-8">Henüz prompt yok.</div>
            )}
          </div>
          {dashData && dashData.recentPrompts.length > 0 && (
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-700">
              <Link href="/prompts" className="text-xs text-indigo-500 font-semibold hover:underline">Tümünü Gör →</Link>
            </div>
          )}
        </div>

        {/* Top Prompts by Test Count */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden animate-slide-up delay-200">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-500" />
            <span className="font-semibold text-sm text-zinc-900 dark:text-white">En Çok Test Edilen</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {dashData && dashData.topPrompts.length > 0 ? dashData.topPrompts.map((p, i) => (
              <Link
                key={p.id}
                href={`/prompts/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors group"
              >
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 w-4 shrink-0">#{i + 1}</span>
                <div className="truncate flex-1">
                  <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">{p.title}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{p.testCount} test</div>
                </div>
                <div className="shrink-0">
                  <span className="text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-semibold px-2 py-0.5 rounded-full">
                    {p.testCount}
                  </span>
                </div>
              </Link>
            )) : (
              <div className="p-4 text-sm text-zinc-400 text-center py-8">Henüz test verisi yok.</div>
            )}
          </div>
          {dashData && dashData.topPrompts.length === 0 && (
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-700">
              <Link href="/prompts" className="text-xs text-violet-500 font-semibold hover:underline">Bir prompt test edin →</Link>
            </div>
          )}
        </div>

        {/* Recent Test Results */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden animate-slide-up delay-300">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            <span className="font-semibold text-sm text-zinc-900 dark:text-white">Son Testler</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {dashData && dashData.recentTests.length > 0 ? dashData.recentTests.slice(0, 6).map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 truncate">
                  <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">{t.promptTitle}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                    <span className="font-mono">{t.model || '—'}</span>
                    {t.responseTime && <span className="flex items-center gap-0.5"><Clock size={10} /> {t.responseTime}ms</span>}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColors[t.status] || statusColors.pending}`}>
                  {statusLabel[t.status] || t.status}
                </span>
              </div>
            )) : (
              <div className="p-4 text-sm text-zinc-400 text-center py-8">Henüz test verisi yok.</div>
            )}
          </div>
        </div>
      </div>

      {/* API Analytics Summary */}
      {dashData?.apiStats && (
        <div className="mt-5 animate-slide-up delay-400">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={16} className="text-indigo-500" />
            <span className="font-semibold text-sm text-zinc-900 dark:text-white">API Kullanım Analitiği</span>
            <Link href="/api-analytics" className="ml-auto text-xs text-indigo-500 font-semibold hover:underline">Tümünü Gör →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={14} className="text-blue-500" />
                <span className="text-[10px] font-semibold text-zinc-400 uppercase">API Çağrısı</span>
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white">{dashData.apiStats.totalCalls}</div>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-amber-500" />
                <span className="text-[10px] font-semibold text-zinc-400 uppercase">Ort. Gecikme</span>
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white">{dashData.apiStats.avgResponseTime}<span className="text-xs text-zinc-400 ml-0.5">ms</span></div>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-emerald-500" />
                <span className="text-[10px] font-semibold text-zinc-400 uppercase">Toplam Token</span>
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white">{dashData.apiStats.totalTokens.toLocaleString()}</div>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-[10px] font-semibold text-zinc-400 uppercase">Hata Oranı</span>
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white">{dashData.apiStats.errorRate}<span className="text-xs text-zinc-400 ml-0.5">%</span></div>
            </div>
          </div>

          {/* Recent API Logs */}
          {dashData.apiStats.recentLogs.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/80 dark:bg-zinc-900/50 text-[10px] uppercase text-zinc-500 border-b border-zinc-100 dark:border-zinc-700">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Zaman</th>
                      <th className="px-4 py-2 font-semibold">Prompt</th>
                      <th className="px-4 py-2 font-semibold">API Key</th>
                      <th className="px-4 py-2 font-semibold">Model</th>
                      <th className="px-4 py-2 font-semibold text-right">Token</th>
                      <th className="px-4 py-2 font-semibold text-right">Gecikme</th>
                      <th className="px-4 py-2 font-semibold text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
                    {dashData.apiStats.recentLogs.map(log => (
                      <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-700/20 transition-colors">
                        <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap text-[10px]">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: tr })}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">{log.promptTitle}</td>
                        <td className="px-4 py-2.5">
                          <span className="bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded text-[10px] font-mono">{log.apiKeyName}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-medium">{log.model}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-600 dark:text-zinc-400">{log.totalTokens?.toLocaleString() || '-'}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`font-mono ${log.responseTime > 3000 ? 'text-red-500' : log.responseTime > 1500 ? 'text-amber-500' : 'text-emerald-600'}`}>
                            {log.responseTime}ms
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 dark:bg-green-900/20 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
                              <CheckCircle2 size={10} /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                              <XCircle size={10} /> Hata
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
