'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePromptStore } from '@/lib/store';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Wand2, Loader2 } from 'lucide-react';
import PromptEditor from '@/components/PromptEditor';
import PromptTester from '@/components/PromptTester';
import VersionHistory from '@/components/VersionHistory';
import BatchTester from '@/components/BatchTester';
import ABTester from '@/components/ABTester';
import TestHistory from '@/components/TestHistory';
import ChainBuilder from '@/components/ChainBuilder';
import MultiModelArena from '@/components/MultiModelArena';
import ApiIntegrationSnippet from '@/components/ApiIntegrationSnippet';
import RagDocumentSelector from '@/components/RagDocumentSelector';
import VersionDiff from '@/components/VersionDiff';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function PromptPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const isNew = id === 'new';

    const { prompts, addPrompt, updatePrompt, deletePrompt, saveVersion, restoreVersion, publishPromptVersion, fetchVersions, versions: storeVersions } = usePromptStore();
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
    const [optimizing, setOptimizing] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        if (!isNew && prompts.length > 0) {
            const existing = prompts.find(p => p.id === id);
            if (existing) {
                setTitle(existing.title);
                setContent(existing.content);
                setSystemPrompt(existing.systemPrompt || '');
                setTags(existing.tags || []);
                setSelectedDocumentIds(existing.documentIds || []);
            } else {
                router.push('/');
            }
            if (!isNew && id) {
                fetchVersions(id);
            }
        }
    }, [id, isNew, prompts, router, fetchVersions]);

    const handleSave = () => {
        if (!title.trim() || !content.trim()) return;

        if (isNew) {
            addPrompt({
                title,
                content,
                systemPrompt: systemPrompt || undefined,
                tags: tags.length > 0 ? tags : undefined,
                documentIds: selectedDocumentIds
            });
            showToast('Yeni prompt başarıyla oluşturuldu!', 'success');
            router.push('/');
        } else {
            updatePrompt(id, {
                title,
                content,
                systemPrompt: systemPrompt || undefined,
                tags: tags.length > 0 ? tags : undefined,
                documentIds: selectedDocumentIds
            });
            showToast('Değişiklikler kaydedildi!', 'success');
            router.push('/');
        }
    };

    const handleDelete = () => {
        if (!isNew) {
            setShowDeleteConfirm(true);
        }
    };

    const confirmDelete = () => {
        deletePrompt(id);
        showToast('Prompt silindi.', 'error');
        setShowDeleteConfirm(false);
        router.push('/');
    };

    const handleSaveNewVersion = () => {
        if (isNew) return;
        const existing = prompts.find(p => p.id === id);
        const nextVersionNum = (existing?.versions?.length || 0) + 1;
        saveVersion(id, `V1.${nextVersionNum}`, content, title);
        showToast(`V1.${nextVersionNum} versiyonu kaydedildi!`, 'info');
    };

    const handleRestore = (versionId: string) => {
        restoreVersion(id, versionId);
        showToast('Versiyon içeriği geri yüklendi. Değişiklikleri onarmak için Kaydet\'e basmalısınız.', 'info');
    };

    const handlePublish = async (versionId: string) => {
        await publishPromptVersion(id, versionId);
        showToast('Versiyon Canlıya (PROD) alındı!', 'success');
    };

    const { openAiKey, selectedModel } = usePromptStore();

    const handleOptimize = async () => {
        if (!content.trim()) return;
        setOptimizing(true);
        setSuggestion(null);
        try {
            const metaPrompt = `Aşağıdaki prompt şablonunu analiz et ve daha etkili, daha net ve daha iyi sonuçlar üretecek şekilde iyileştir. İyileştirilmiş versiyonu markdownla ver.

Mevcut Prompt:
---
${content}
---
${systemPrompt ? `Sistem Talimatı: ${systemPrompt}` : ''}`;

            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: metaPrompt, apiKey: openAiKey, model: selectedModel })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSuggestion(data.result);
            showToast('İyileştirme önerisi hazır!', 'success');
        } catch (err: any) {
            showToast(`Optimizasyon başarısız: ${err.message}`, 'error');
        } finally {
            setOptimizing(false);
        }
    };

    if (!mounted) return null;

    const currentPrompt = prompts.find(p => p.id === id);
    // Prefer store versions if loaded, fallback to prompt.versions (which might be empty based on schema changes)
    const versions = storeVersions[id] || currentPrompt?.versions || [];

    return (
        <div className="flex flex-col h-full bg-zinc-50/50">
            <header className="px-8 py-5 border-b border-zinc-200 bg-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight">
                        {isNew ? 'Create New Prompt' : 'Edit Prompt'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {!isNew && content.trim() && (
                        <button
                            onClick={handleOptimize}
                            disabled={optimizing}
                            className="flex items-center gap-2 px-4 py-2 text-violet-600 hover:bg-violet-50 font-medium rounded-lg transition-all text-sm disabled:opacity-50"
                        >
                            {optimizing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                            {optimizing ? 'Optimizing...' : 'Optimize Et'}
                        </button>
                    )}
                    {!isNew && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-all text-sm"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || !content.trim()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </header>

            <div className="flex-1 p-8 overflow-y-auto h-[calc(100vh-80px)] custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
                    <PromptEditor
                        title={title}
                        content={content}
                        systemPrompt={systemPrompt}
                        tags={tags}
                        onTitleChange={setTitle}
                        onContentChange={setContent}
                        onSystemPromptChange={setSystemPrompt}
                        onTagsChange={setTags}
                    />
                    <PromptTester promptId={isNew ? '' : id} content={content} systemPrompt={systemPrompt} />
                    <VersionHistory
                        versions={versions}
                        isNew={isNew}
                        onSaveNewVersion={handleSaveNewVersion}
                        onRestore={handleRestore}
                        onPublish={handlePublish}
                    />
                </div>
                {!isNew && <RagDocumentSelector selectedIds={selectedDocumentIds} onChange={setSelectedDocumentIds} />}
                {!isNew && <ApiIntegrationSnippet promptId={id} content={content} />}
                {!isNew && <MultiModelArena promptId={id} content={content} systemPrompt={systemPrompt} />}
                {!isNew && <BatchTester promptId={id} content={content} systemPrompt={systemPrompt} />}
                {!isNew && <ABTester promptId={id} contentA={content} systemPrompt={systemPrompt} />}
                {!isNew && <TestHistory promptId={id} />}
                {!isNew && <ChainBuilder prompts={prompts} systemPrompt={systemPrompt} />}
                {!isNew && versions.length >= 2 && <VersionDiff versions={versions} />}

                {/* AI Optimization Suggestion Panel */}
                {suggestion && (
                    <div className="mt-6 bg-violet-50 border border-violet-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-violet-800 flex items-center gap-2">
                                <Wand2 size={16} /> AI İyileştirme Önerisi
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setContent(suggestion); setSuggestion(null); showToast('Öneri uygulandı!', 'success'); }}
                                    className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-violet-700 transition-all"
                                >
                                    Uygula
                                </button>
                                <button
                                    onClick={() => setSuggestion(null)}
                                    className="text-xs bg-white text-violet-600 border border-violet-200 px-3 py-1.5 rounded-lg font-medium hover:bg-violet-100 transition-all"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-violet-900 whitespace-pre-wrap bg-white/60 p-4 rounded-xl border border-violet-100 max-h-64 overflow-y-auto">
                            {suggestion}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Prompt'ı Sil"
                message="Bu prompt'ı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                cancelText="İptal"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
}
