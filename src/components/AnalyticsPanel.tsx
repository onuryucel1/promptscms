'use client';

import { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { Activity, Zap, DollarSign, Clock, FileText, Layers, TrendingUp } from 'lucide-react';

interface DashboardStats {
    totalPrompts: number;
    totalVersions: number;
    totalTests: number;
    totalTokens: number;
    totalCostUsd: number;
    averageResponseTime: number;
    chartData: any[];
}

export default function AnalyticsPanel() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tokens' | 'cost' | 'requests'>('tokens');

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/dashboard');
                if (res.ok) {
                    const result = await res.json();
                    setStats(result.data);
                }
            } catch (e) {
                console.error('Failed to fetch stats:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm animate-pulse mb-8 flex flex-col items-center justify-center min-h-[300px]">
                <Activity className="text-zinc-300 w-10 h-10 mb-4 animate-bounce" />
                <div className="text-zinc-500 font-medium">Analytics Yükleniyor...</div>
            </div>
        );
    }

    // Format Y-Axis for large numbers (Tokens)
    const formatYAxis = (tickItem: number) => {
        if (tickItem >= 1000000) return (tickItem / 1000000).toFixed(1) + 'M';
        if (tickItem >= 1000) return (tickItem / 1000).toFixed(1) + 'k';
        return tickItem.toString();
    };

    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm mb-8 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                        <TrendingUp className="text-blue-500" />
                        Genel Bakış
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Prompt kullanım, maliyet ve performans metrikleriniz</p>
                </div>

                <div className="flex bg-white rounded-lg p-1 border border-zinc-200 shadow-sm text-xs font-medium">
                    <button
                        onClick={() => setActiveTab('tokens')}
                        className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'tokens' ? 'bg-indigo-500 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50'}`}
                    >
                        Token Kullanımı
                    </button>
                    <button
                        onClick={() => setActiveTab('cost')}
                        className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'cost' ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50'}`}
                    >
                        Maliyet ($)
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'requests' ? 'bg-blue-500 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50'}`}
                    >
                        İstek Sayısı
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-b border-zinc-100 divide-x divide-zinc-100 divide-y md:divide-y-0">
                <div className="p-4 flex flex-col justify-center text-center">
                    <Layers className="mx-auto text-zinc-400 mb-2 w-5 h-5" />
                    <div className="text-2xl font-bold text-zinc-900">{stats.totalPrompts}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mt-1">Şablonlar</div>
                </div>
                <div className="p-4 flex flex-col justify-center text-center">
                    <FileText className="mx-auto text-zinc-400 mb-2 w-5 h-5" />
                    <div className="text-2xl font-bold text-zinc-900">{stats.totalVersions}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mt-1">Versiyonlar</div>
                </div>
                <div className="p-4 flex flex-col justify-center text-center">
                    <Activity className="mx-auto text-blue-500 mb-2 w-5 h-5" />
                    <div className="text-2xl font-bold text-blue-600">{stats.totalTests}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-blue-600/70 mt-1">Test Edildi</div>
                </div>
                <div className="p-4 flex flex-col justify-center text-center">
                    <Zap className="mx-auto text-indigo-500 mb-2 w-5 h-5" />
                    <div className="text-2xl font-bold text-indigo-600">{formatYAxis(stats.totalTokens)}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-600/70 mt-1">Token Harcandı</div>
                </div>
                <div className="p-4 flex flex-col justify-center text-center">
                    <DollarSign className="mx-auto text-emerald-500 mb-2 w-5 h-5" />
                    <div className="text-2xl font-bold text-emerald-600">${stats.totalCostUsd.toFixed(3)}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/70 mt-1">Tahmini Maliyet</div>
                </div>
                <div className="p-4 flex flex-col justify-center text-center">
                    <Clock className="mx-auto text-amber-500 mb-2 w-5 h-5" />
                    <div className="text-2xl font-bold text-amber-600">{stats.averageResponseTime}ms</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-amber-600/70 mt-1">Ort. Yanıt Hızı</div>
                </div>
            </div>

            <div className="p-6 h-[300px] w-full bg-slate-900/5">
                {stats.chartData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center flex-col text-zinc-400">
                        <Activity className="w-8 h-8 opacity-20 mb-2" />
                        <span className="text-sm">Henüz grafik oluşturacak test verisi yok.</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {activeTab === 'requests' ? (
                            <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#F4F4F5' }}
                                />
                                <Bar dataKey="requests" name="İstek Sayısı" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        ) : (
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={activeTab === 'cost' ? '#10B981' : '#6366F1'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={activeTab === 'cost' ? '#10B981' : '#6366F1'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
                                <YAxis
                                    tickFormatter={formatYAxis}
                                    tick={{ fontSize: 12, fill: '#71717A' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => {
                                        if (activeTab === 'cost') return ['$' + value.toFixed(4), 'Maliyet'];
                                        return [value, 'Token'];
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={activeTab === 'cost' ? 'cost' : 'tokens'}
                                    name={activeTab === 'cost' ? 'Maliyet ($)' : 'Token'}
                                    stroke={activeTab === 'cost' ? '#10B981' : '#6366F1'}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
