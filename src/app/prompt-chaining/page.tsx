'use client';

import { usePromptStore } from '@/lib/store';
import ChainBuilder from '@/components/ChainBuilder';
import { Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PromptChainingPage() {
    const { prompts } = usePromptStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full h-[calc(100vh-80px)] flex flex-col animate-fade-in">
            <div className="mb-4 shrink-0">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 p-2 rounded-xl">
                        <Link2 size={24} />
                    </div>
                    Görsel İş Akışları
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm max-w-2xl">
                    Farklı prompt şablonlarını birbirine bağlayarak zincirleme (chaining) yapay zeka akışları tasarlayın. Bir promptun çıktısı, sonrakinin girdisi olur.
                </p>
            </div>

            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-800 rounded-2xl">
                <ChainBuilder prompts={prompts} />
            </div>
        </div>
    );
}
