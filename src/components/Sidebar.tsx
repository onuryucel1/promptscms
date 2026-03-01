'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, FileText, PlusCircle, Settings,
    Sun, Moon, LogOut, User, Database, Menu, X, ChevronRight, Terminal, Link2, Activity
} from 'lucide-react';
import { usePromptStore } from '@/lib/store';

const navItems = [
    { name: 'Kontrol Paneli', href: '/', icon: LayoutDashboard },
    { name: 'Promptlar', href: '/prompts', icon: FileText },
    { name: 'İş Akışları', href: '/prompt-chaining', icon: Link2 },
    { name: 'Bilgi Bankası', href: '/knowledge-base', icon: Database },
    { name: 'API Entegrasyonu', href: '/api-deployment', icon: Terminal },
    { name: 'API Analitiği', href: '/api-analytics', icon: Activity },
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
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => setUser(data))
            .catch(() => setUser(null));
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    // Don't show sidebar on login/register pages
    if (pathname === '/login' || pathname === '/register') return null;

    const SidebarContent = () => (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Logo */}
            <div className="p-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400 tracking-tight flex items-center gap-2">
                    <FileText className="text-indigo-400 shrink-0" size={22} />
                    PromptCMS
                </h1>
                <button
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar pb-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                                : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon
                                    size={18}
                                    className={`transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`}
                                />
                                <span className="font-medium text-sm">{item.name}</span>
                            </div>
                            {isActive && <ChevronRight size={14} className="opacity-60" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 mt-auto space-y-1 border-t border-zinc-800">
                {/* User Info */}
                {user && (
                    <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-zinc-800/50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.name?.[0]?.toUpperCase() || <User size={14} />}
                        </div>
                        <div className="truncate">
                            <div className="text-sm font-semibold text-white truncate">{user.name || 'Kullanıcı'}</div>
                            <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
                        </div>
                    </div>
                )}

                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all text-zinc-400 hover:text-white hover:bg-zinc-800/70 text-sm"
                >
                    {theme === 'dark'
                        ? <Sun size={18} className="text-amber-400" />
                        : <Moon size={18} />}
                    <span className="font-medium">{theme === 'dark' ? 'Açık Mod' : 'Koyu Mod'}</span>
                </button>

                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all text-sm ${pathname === '/settings'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                        }`}
                >
                    <Settings size={18} className={pathname === '/settings' ? 'text-white' : ''} />
                    <span className="font-medium">Ayarlar</span>
                </Link>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all text-zinc-400 hover:text-red-400 hover:bg-red-950/30 text-sm"
                >
                    <LogOut size={18} />
                    <span className="font-medium">Çıkış Yap</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-zinc-900 text-white rounded-xl shadow-lg border border-zinc-800 hover:bg-zinc-800 transition-all"
            >
                <Menu size={20} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <aside
                className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <SidebarContent />
            </aside>

            {/* Desktop sidebar */}
            <aside className="hidden lg:flex w-64 bg-zinc-950 text-white h-screen sticky top-0 flex-col border-r border-zinc-800">
                <SidebarContent />
            </aside>
        </>
    );
}
