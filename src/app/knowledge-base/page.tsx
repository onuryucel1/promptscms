'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    Upload,
    Trash2,
    Search,
    File,
    Loader2,
    Plus,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    Type,
    X
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Document {
    id: string;
    title: string;
    type: string;
    createdAt: string;
    _count: {
        chunks: number;
    };
}

interface QAPair {
    q: string;
    a: string;
}

type EntryMode = 'file' | 'text' | 'qa';

export default function KnowledgeBase() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mode, setMode] = useState<EntryMode>('file');
    const { showToast } = useToast();

    // Form states
    const [textTitle, setTextTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    const [qaTitle, setQaTitle] = useState('');
    const [qaPairs, setQaPairs] = useState<QAPair[]>([{ q: '', a: '' }]);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await fetch('/api/documents');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setDocuments(data);
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSubmitting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            showToast(`${file.name} başarıyla işlendi ve vektörize edildi.`, 'success');
            fetchDocuments();
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setSubmitting(false);
            e.target.value = '';
        }
    };

    const handleTextSubmit = async () => {
        if (!textTitle.trim() || !textContent.trim()) {
            showToast('Lütfen başlık ve içeriği doldurun.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'text',
                    title: textTitle,
                    content: textContent
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            showToast('Metin başarıyla eklendi ve vektörize edildi.', 'success');
            setTextTitle('');
            setTextContent('');
            fetchDocuments();
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleQaSubmit = async () => {
        const filledPairs = qaPairs.filter(p => p.q.trim() && p.a.trim());
        if (!qaTitle.trim() || filledPairs.length === 0) {
            showToast('Lütfen başlık ekleyin ve en az bir Soru-Cevap çifti doldurun.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'qa',
                    title: qaTitle,
                    pairs: filledPairs
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            showToast('Soru-Cevap çiftleri başarıyla eklendi.', 'success');
            setQaTitle('');
            setQaPairs([{ q: '', a: '' }]);
            fetchDocuments();
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const addQaPair = () => setQaPairs([...qaPairs, { q: '', a: '' }]);
    const removeQaPair = (index: number) => {
        if (qaPairs.length === 1) return;
        setQaPairs(qaPairs.filter((_, i) => i !== index));
    };
    const updateQaPair = (index: number, field: 'q' | 'a', value: string) => {
        const newPairs = [...qaPairs];
        newPairs[index][field] = value;
        setQaPairs(newPairs);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu dokümanı ve tüm vektör parçalarını silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Silme işlemi başarısız');

            showToast('Doküman silindi.', 'success');
            setDocuments(docs => docs.filter(d => d.id !== id));
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <FileText className="text-indigo-600" size={32} />
                    Bilgi Bankası (RAG)
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Verilerinizi yükleyin veya oluşturun. Yapay zeka bu bilgileri kullanarak daha doğru yanıtlar verir.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Entry Form */}
                <div className="lg:col-span-5 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col h-fit">
                    <div className="flex border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <button
                            onClick={() => setMode('file')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider transition-all ${mode === 'file' ? 'text-indigo-600 bg-white dark:bg-zinc-800 border-b-2 border-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <Upload size={14} /> Dosya
                        </button>
                        <button
                            onClick={() => setMode('text')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider transition-all ${mode === 'text' ? 'text-indigo-600 bg-white dark:bg-zinc-800 border-b-2 border-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <Type size={14} /> Metin
                        </button>
                        <button
                            onClick={() => setMode('qa')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider transition-all ${mode === 'qa' ? 'text-indigo-600 bg-white dark:bg-zinc-800 border-b-2 border-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <MessageSquare size={14} /> Soru-Cevap
                        </button>
                    </div>

                    <div className="p-6">
                        {mode === 'file' && (
                            <div className="text-center py-6">
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-indigo-300 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                                            <Upload size={24} />
                                        </div>
                                        <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300 font-medium">Click to upload or drag and drop</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">PDF or TXT (MAX. 10MB)</p>
                                    </div>
                                    <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} disabled={submitting} />
                                </label>
                                {submitting && (
                                    <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 text-sm font-medium animate-pulse">
                                        <Loader2 size={16} className="animate-spin" /> Dosya işleniyor...
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'text' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Başlık</label>
                                    <input
                                        type="text"
                                        value={textTitle}
                                        onChange={(e) => setTextTitle(e.target.value)}
                                        placeholder="Örn: Kullanım Klavuzu"
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">İçerik</label>
                                    <textarea
                                        rows={8}
                                        value={textContent}
                                        onChange={(e) => setTextContent(e.target.value)}
                                        placeholder="Eklemek istediğiniz metni buraya yapıştırın..."
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white resize-none"
                                    />
                                </div>
                                <button
                                    onClick={handleTextSubmit}
                                    disabled={submitting}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:active:scale-100"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    Kaydet ve Vektörize Et
                                </button>
                            </div>
                        )}

                        {mode === 'qa' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Grup Başlığı</label>
                                    <input
                                        type="text"
                                        value={qaTitle}
                                        onChange={(e) => setQaTitle(e.target.value)}
                                        placeholder="Örn: SSS - İptal Koşulları"
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {qaPairs.map((pair, index) => (
                                        <div key={index} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 relative group/qa">
                                            <button
                                                onClick={() => removeQaPair(index)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/qa:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <X size={12} />
                                            </button>
                                            <div className="space-y-3">
                                                <input
                                                    placeholder="Soru"
                                                    value={pair.q}
                                                    onChange={(e) => updateQaPair(index, 'q', e.target.value)}
                                                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 dark:text-white font-medium"
                                                />
                                                <textarea
                                                    placeholder="Cevap"
                                                    value={pair.a}
                                                    onChange={(e) => updateQaPair(index, 'a', e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 dark:text-white resize-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addQaPair}
                                    className="w-full py-2 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 hover:text-indigo-500 hover:border-indigo-300 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> Yeni Çift Ekle
                                </button>
                                <button
                                    onClick={handleQaSubmit}
                                    disabled={submitting}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:active:scale-100"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    Tümünü Kaydet
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Document List */}
                <div className="lg:col-span-7 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="text"
                                placeholder="Dokümanlarda ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 text-left sticky top-0 z-10 border-b border-zinc-100 dark:border-zinc-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">İsim</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Parça</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tarih</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                                            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                                            Yükleniyor...
                                        </td>
                                    </tr>
                                ) : filteredDocs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                                            <AlertCircle size={24} className="mx-auto mb-2" />
                                            Henüz doküman bulunmuyor.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDocs.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                                        {doc.type === 'pdf' ? <File size={16} /> :
                                                            doc.type === 'qa' ? <MessageSquare size={16} /> :
                                                                <FileText size={16} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-zinc-900 dark:text-white text-sm truncate max-w-[150px] md:max-w-[250px]">{doc.title}</div>
                                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{doc.type}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                                                    {doc._count.chunks} Chunk
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">
                                                {format(new Date(doc.createdAt), 'd MMM yy', { locale: tr })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="text-zinc-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e4e4e7;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #3f3f46;
                }
            `}</style>
        </div>
    );
}
