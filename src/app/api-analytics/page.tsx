'use client';

import { Activity } from 'lucide-react';
import ApiAnalytics from '@/components/ApiAnalytics';

export default function ApiAnalyticsPage() {
    return (
        <div className="max-w-7xl mx-auto py-8 px-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center">
                    <Activity size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">API Kullanım Analitiği</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Dış uygulamalardan yapılan API çağrılarının detaylı analizi</p>
                </div>
            </div>

            <ApiAnalytics />
        </div>
    );
}
