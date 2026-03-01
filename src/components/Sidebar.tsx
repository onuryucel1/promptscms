'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, PlusCircle, Settings, Sun, Moon, LogOut, User } from 'lucide-react';
import { usePromptStore } from '@/lib/store';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Bilgi Bankası (RAG)', href: '/knowledge-base', icon: FileText },
    { name: 'New Prompt', href: '/prompts/new', icon: PlusCircle },
];

interface AuthUser {
    id: string;
    name: string | null;
    email: string;
}

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = usePromptStore();
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => setUser(data))
            .catch(() => setUser(null));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    // Don't show sidebar on login/register pages
    if (pathname === '/login' || pathname === '/register') return null;

    return (
        <aside className="w-64 bg-zinc-950 text-white min-h-screen flex flex-col border-r border-zinc-800">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight flex items-center gap-2">
                    <FileText className="text-blue-400" />
                    PromptCMS
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-zinc-800 text-white shadow-md'
                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                                }`}
                        >
                            <Icon size={20} className={isActive ? 'text-blue-400' : ''} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto space-y-2 border-t border-zinc-800">
                {/* User Info */}
                {user && (
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.name?.[0]?.toUpperCase() || <User size={14} />}
                        </div>
                        <div className="truncate">
                            <div className="text-sm font-medium text-white truncate">{user.name || 'User'}</div>
                            <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
                        </div>
                    </div>
                )}

                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                >
                    {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
                    <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all ${pathname === '/settings'
                        ? 'bg-zinc-800 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                >
                    <Settings size={20} className={pathname === '/settings' ? 'text-blue-400' : ''} />
                    <span className="font-medium">Settings</span>
                </Link>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all text-zinc-400 hover:text-red-400 hover:bg-red-950/30"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Çıkış Yap</span>
                </button>
            </div>
        </aside>
    );
}
