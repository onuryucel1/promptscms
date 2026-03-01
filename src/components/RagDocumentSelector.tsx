'use client';

import { useState, useEffect } from 'react';
import { FileText, Check, Plus, X, Search, Database, Loader2 } from 'lucide-react';

interface DocumentInfo {
    id: string;
    title: string;
}

interface RagDocumentSelectorProps {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

export default function RagDocumentSelector({ selectedIds, onChange }: RagDocumentSelectorProps) {
    const [allDocuments, setAllDocuments] = useState<DocumentInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await fetch('/api/documents');
                if (res.ok) {
                    const data = await res.json();
                    setAllDocuments(data);
                }
            } catch (err) {
                console.error('Failed to fetch docs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, []);

    const toggleDocument = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(i => i !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectedDocs = allDocuments.filter(d => selectedIds.includes(d.id));
    const availableDocs = allDocuments.filter(d =>
        !selectedIds.includes(d.id) &&
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 mt-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Database className="text-indigo-600" size={20} />
                    <h3 className="font-bold text-zinc-900">Bilgi Bankası Bağlantısı (RAG)</h3>
                </div>
                <div className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {selectedIds.length} Doküman Bağlı
                </div>
            </div>

            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                Bu prompt çalıştırıldığında, aşağıda seçili olan dokümanlarda vektör araması yapılır ve en alakalı bilgiler otomatik olarak bağlam (context) olarak eklenir.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
                {selectedDocs.map(doc => (
                    <div
                        key={doc.id}
                        className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-medium group transition-all"
                    >
                        <FileText size={14} />
                        {doc.title}
                        <button
                            onClick={() => toggleDocument(doc.id)}
                            className="hover:text-red-500 transition-colors p-0.5"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-zinc-300 text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 transition-all text-xs font-medium bg-zinc-50/50"
                >
                    <Plus size={14} />
                    Doküman Bağla
                </button>
            </div>

            {isOpen && (
                <div className="mt-4 border border-zinc-100 rounded-xl overflow-hidden bg-zinc-50/30">
                    <div className="p-3 border-b border-zinc-100 bg-white flex items-center gap-2">
                        <Search size={14} className="text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Dosya ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none text-xs focus:ring-0 placeholder:text-zinc-400"
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            <div className="p-4 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
                                <Loader2 size={14} className="animate-spin" />
                                Yükleniyor...
                            </div>
                        ) : availableDocs.length === 0 ? (
                            <div className="p-4 text-center text-zinc-400 text-xs">
                                Bağlanabilir doküman bulunamadı.
                            </div>
                        ) : (
                            availableDocs.map(doc => (
                                <button
                                    key={doc.id}
                                    onClick={() => toggleDocument(doc.id)}
                                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-left text-xs text-zinc-600 hover:text-indigo-600 group"
                                >
                                    <FileText size={14} className="text-zinc-400 group-hover:text-indigo-400" />
                                    <span className="flex-1 truncate">{doc.title}</span>
                                    <Plus size={14} className="opacity-0 group-hover:opacity-100 text-indigo-400" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
