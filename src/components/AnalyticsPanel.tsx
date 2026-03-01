'use client';

import { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
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
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Detect dark mode
        setIsDark(document.documentElement.classList.contains('dark'));
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

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
        return () => observer.disconnect();
    }, []);

    if (loading || !stats) {
        return (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-8 shadow-sm mb-8 flex flex-col items-center justify-center min-h-[300px]">
                <Activity className="text-zinc-300 dark:text-zinc-600 w-10 h-10 mb-4 animate-bounce" />
                <div className="text-zinc-500 dark:text-zinc-400 font-medium">Analitik Yükleniyor...</div>
            </div>
        );
    }

    const formatYAxis = (tickItem: number) => {
        if (tickItem >= 1000000) return (tickItem / 1000000).toFixed(1) + 'M';
        if (tickItem >= 1000) return (tickItem / 1000).toFixed(1) + 'k';
        return tickItem.toString();
    };

    const gridColor = isDark ? '#3f3f46' : '#E4E4E7';
    const tickColor = isDark ? '#71717a' : '#71717A';
    const tooltipStyle = {
        borderRadius: '12px',
        border: 'none',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        backgroundColor: isDark ? '#27272a' : '#ffffff',
        color: isDark ? '#e4e4e7' : '#18181b',
    };

    return (
        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm mb-8 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-700 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-indigo-500" />
                        Genel Bakış
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Prompt kullanım, maliyet ve performans metrikleriniz</p>
                </div>

                <div className="flex bg-white dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-700 shadow-sm text-xs font-medium">
                    <button
                        onClick={() => setActiveTab('tokens')}
                        className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'tokens' ? 'bg-indigo-500 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                    >
                        Token
                    </button>
                    <button
                        onClick={() => setActiveTab('cost')}
                        className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'cost' ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                    >
                        Maliyet ($)
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'requests' ? 'bg-blue-500 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                    >
                        İstekler
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-b border-zinc-100 dark:border-zinc-700 divide-x divide-zinc-100 dark:divide-zinc-700">
                {[
                    { icon: <Layers className="mx-auto mb-2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />, value: stats.totalPrompts, label: 'Şablonlar', color: '' },
                    { icon: <FileText className="mx-auto mb-2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />, value: stats.totalVersions, label: 'Versiyonlar', color: '' },
                    { icon: <Activity className="mx-auto mb-2 w-5 h-5 text-blue-500" />, value: stats.totalTests, label: 'Test Edildi', color: 'text-blue-600 dark:text-blue-400' },
                    { icon: <Zap className="mx-auto mb-2 w-5 h-5 text-indigo-500" />, value: formatYAxis(stats.totalTokens), label: 'Token', color: 'text-indigo-600 dark:text-indigo-400' },
                    { icon: <DollarSign className="mx-auto mb-2 w-5 h-5 text-emerald-500" />, value: `$${stats.totalCostUsd.toFixed(3)}`, label: 'Maliyet', color: 'text-emerald-600 dark:text-emerald-400' },
                    { icon: <Clock className="mx-auto mb-2 w-5 h-5 text-amber-500" />, value: `${stats.averageResponseTime}ms`, label: 'Ort. Hız', color: 'text-amber-600 dark:text-amber-400' },
                ].map((stat, i) => (
                    <div key={i} className="p-4 flex flex-col justify-center text-center">
                        {stat.icon}
                        <div className={`text-2xl font-bold ${stat.color || 'text-zinc-900 dark:text-white'}`}>{stat.value}</div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="p-6 h-[280px] w-full bg-zinc-50/30 dark:bg-zinc-900/30">
                {stats.chartData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center flex-col text-zinc-400 dark:text-zinc-600">
                        <Activity className="w-8 h-8 opacity-20 mb-2" />
                        <span className="text-sm">Henüz grafik oluşturacak test verisi yok.</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {activeTab === 'requests' ? (
                            <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#3f3f46' : '#F4F4F5' }} />
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
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    formatter={(value: number | undefined) => {
                                        if (value === undefined) return ['0', ''];
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
