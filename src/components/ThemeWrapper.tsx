'use client';

import { useEffect } from 'react';
import { usePromptStore } from '@/lib/store';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const { theme, fetchPrompts, fetchSettings, isLoaded } = usePromptStore();

    // Load data from DB on mount
    useEffect(() => {
        if (!isLoaded) {
            fetchPrompts();
            fetchSettings();
        }
    }, [isLoaded, fetchPrompts, fetchSettings]);

    // Apply theme class
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return <>{children}</>;
}
