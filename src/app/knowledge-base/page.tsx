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
    CheckCircle2
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

export default function KnowledgeBase() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast } = useToast();

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

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if OpenAI Key exists in store/settings (via API)
        setUploading(true);
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
            setUploading(false);
            e.target.value = '';
        }
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
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
                        <FileText className="text-indigo-600" size={32} />
                        Bilgi Bankası (RAG)
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        Yüklediğiniz dokümanlar (PDF/TXT) parçalanıp vektörize edilir ve Promptlarınıza bağlam olarak eklenebilir.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.txt"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <div className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${uploading ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}>
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                            {uploading ? 'İşleniyor...' : 'Yeni Doküman Yükle'}
                        </div>
                    </label>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Dokümanlarda ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50/50 text-left">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">İsim</th>
                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tür</th>
                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Vektör Parçası</th>
                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Yükleme Tarihi</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                                        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : filteredDocs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                                        <AlertCircle size={24} className="mx-auto mb-2" />
                                        Henüz doküman bulunmuyor.
                                    </td>
                                </tr>
                            ) : (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                                    {doc.type === 'pdf' ? <File size={18} /> : <FileText size={18} />}
                                                </div>
                                                <span className="font-medium text-zinc-900">{doc.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-zinc-400 uppercase">{doc.type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                {doc._count.chunks} Chunk
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 text-sm">
                                            {format(new Date(doc.createdAt), 'd MMMM yyyy, HH:mm', { locale: tr })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="text-zinc-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100/50">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                        <CheckCircle2 size={18} />
                        Otomatik Parçalama
                    </h3>
                    <p className="text-sm text-indigo-700/70 leading-relaxed">
                        Dokümanlarınız 1000 karakterlik parçalara ayrılır. Bu sayede sadece sorunuzla ilgili olan kısımlar prompta eklenerek maliyet tasarrufu sağlanır.
                    </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100/50">
                    <h3 className="font-bold text-emerald-900 flex items-center gap-2 mb-2">
                        <CheckCircle2 size={18} />
                        Vektör Arama
                    </h3>
                    <p className="text-sm text-emerald-700/70 leading-relaxed">
                        Soru sorduğunuzda, sorunuz matematiksel bir vektöre dönüştürülür ve kütüphanenizdeki en benzer içerikler saniyeler içinde bulunur.
                    </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100/50">
                    <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                        <CheckCircle2 size={18} />
                        Prompt Entegrasyonu
                    </h3>
                    <p className="text-sm text-amber-700/70 leading-relaxed">
                        Prompt sayfasından istediğiniz dokümanları seçebilirsiniz. Yapay zeka bu dokümanları "okuyarak" size cevap verir.
                    </p>
                </div>
            </div>
        </div>
    );
}
