'use client';

import { usePromptStore } from '@/lib/store';
import { Prompt } from '@/lib/store';
import Link from 'next/link';
import { PlusCircle, Edit3, Trash2, Calendar, TerminalSquare, Search, Copy, Download, Upload, Tag } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function PromptsPage() {
    const { prompts, deletePrompt, duplicatePrompt, addPrompt } = usePromptStore();
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const importRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Collect all unique tags
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        prompts.forEach(p => p.tags?.forEach(t => tagSet.add(t)));
        return Array.from(tagSet).sort();
    }, [prompts]);

    const filteredPrompts = useMemo(() => {
        let result = prompts;
        if (selectedTag) {
            result = result.filter(p => p.tags?.includes(selectedTag));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
            );
        }
        return result;
    }, [prompts, searchQuery, selectedTag]);

    if (!mounted) return null;

    const handleDuplicate = (id: string) => {
        duplicatePrompt(id);
        showToast('Prompt kopyalandı!', 'success');
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            deletePrompt(deleteTarget);
            showToast('Prompt silindi.', 'error');
            setDeleteTarget(null);
        }
    };

    // JSON Export
    const handleExportAll = () => {
        const data = JSON.stringify(prompts, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'prompt-cms-export.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`${prompts.length} şablon dışa aktarıldı!`, 'success');
    };

    // JSON Import
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const imported = JSON.parse(evt.target?.result as string) as Prompt[];
                let count = 0;
                imported.forEach(p => {
                    addPrompt({ title: p.title, content: p.content, systemPrompt: p.systemPrompt, tags: p.tags });
                    count++;
                });
                showToast(`${count} şablon başarıyla içe aktarıldı!`, 'success');
            } catch {
                showToast('Geçersiz JSON dosyası.', 'error');
            }
        };
        reader.readAsText(file);
        if (importRef.current) importRef.current.value = '';
    };

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Prompt Library</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage and organize your prompt templates</p>
                </div>

                <div className="flex items-center gap-2">
                    {prompts.length > 0 && (
                        <>
                            <button
                                onClick={handleExportAll}
                                className="flex items-center gap-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-2 rounded-lg font-medium transition-all"
                            >
                                <Download size={14} /> Export
                            </button>
                            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                            <button
                                onClick={() => importRef.current?.click()}
                                className="flex items-center gap-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-2 rounded-lg font-medium transition-all"
                            >
                                <Upload size={14} /> Import
                            </button>
                        </>
                    )}
                    <Link
                        href="/prompts/new"
                        className="flex items-center gap-2 bg-zinc-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-blue-500 transition-all shadow-sm"
                    >
                        <PlusCircle size={18} />
                        Create Prompt
                    </Link>
                </div>
            </div>

            {/* Search Bar + Tag Filter */}
            {prompts.length > 0 && (
                <div className="mb-6 space-y-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search templates..."
                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-zinc-400 dark:text-white shadow-sm"
                        />
                    </div>
                    {allTags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Tag size={14} className="text-zinc-400" />
                            <button
                                onClick={() => setSelectedTag(null)}
                                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${!selectedTag ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                            >
                                All
                            </button>
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${selectedTag === tag ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {prompts.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                        <TerminalSquare size={32} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">No prompts yet</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">Create your first prompt template to start managing your AI interactions.</p>
                    <div className="flex gap-3">
                        <Link
                            href="/prompts/new"
                            className="flex items-center gap-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-all"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            ) : filteredPrompts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col items-center justify-center">
                    <Search size={32} className="text-zinc-300 mb-3" />
                    <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 mb-1">No matching templates found</h3>
                    <p className="text-sm text-zinc-400">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrompts.map((prompt) => (
                        <div
                            key={prompt.id}
                            className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all group flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg line-clamp-1 flex-1 pr-4 dark:text-white">{prompt.title}</h3>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link
                                        href={`/prompts/${prompt.id}`}
                                        className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                                        title="Edit"
                                    >
                                        <Edit3 size={16} />
                                    </Link>
                                    <button
                                        onClick={() => handleDuplicate(prompt.id)}
                                        className="p-1.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-all"
                                        title="Duplicate"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(prompt.id)}
                                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Tags */}
                            {prompt.tags && prompt.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {prompt.tags.map(tag => (
                                        <span key={tag} className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50 font-medium">{tag}</span>
                                    ))}
                                </div>
                            )}

                            <div className="text-zinc-600 dark:text-zinc-400 text-sm mb-6 line-clamp-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl font-mono flex-1">
                                {prompt.content}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-700">
                                <Calendar size={14} />
                                <span>Updated {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                                {prompt.versions && prompt.versions.length > 0 && (
                                    <span className="ml-auto bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                        {prompt.versions.length} versions
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Delete Prompt"
                message="Are you sure you want to delete this prompt? This action cannot be undone."
                confirmText="Yes, Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
