'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';

interface ApiKeyData {
    id: string;
    name: string;
    key: string;
    createdAt: string;
    lastUsedAt: string | null;
}

export default function ApiKeysSection() {
    const { showToast } = useToast();
    const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const fetchApiKeys = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/apikeys');
            if (res.ok) {
                const data = await res.json();
                setApiKeys(data);
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) {
            showToast('Lütfen bir API anahtarı adı girin.', 'error');
            return;
        }

        setIsCreating(true);
        setNewlyCreatedKey(null);
        try {
            const res = await fetch('/api/apikeys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            showToast('API Anahtarı oluşturuldu!', 'success');
            setNewKeyName('');
            setNewlyCreatedKey(data.key); // Show the full raw key ONCE
            fetchApiKeys();
        } catch (error: any) {
            showToast(`Hata: ${error.message}`, 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteKey = async (id: string) => {
        if (!window.confirm('Bu API anahtarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve bu anahtarı kullanan uygulamalar çalışmayı durdurur.')) return;

        try {
            const res = await fetch(`/api/apikeys/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Silinemedi');

            showToast('API Anahtarı silindi.', 'info');
            setApiKeys(prev => prev.filter(k => k.id !== id));
        } catch (error: any) {
            showToast(`Hata: ${error.message}`, 'error');
        }
    };

    const copyToClipboard = (text: string, id: string = 'new') => {
        navigator.clipboard.writeText(text);
        setCopiedKey(id);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                <Key size={18} className="text-orange-500" />
                <h2 className="font-semibold text-zinc-900">API Deployment Anahtarları</h2>
            </div>

            <div className="p-6">
                <p className="text-sm text-zinc-600 mb-6">
                    Bu anahtarlar, tasarladığınız promptları dış uygulamalarınızdan (Node.js, Python vb.) REST API aracılığıyla doğrudan çağırmanıza olanak tanır.
                </p>

                {newlyCreatedKey && (
                    <div className="mb-6 p-4 rounded-xl border border-orange-200 bg-orange-50">
                        <div className="flex items-center gap-2 text-orange-800 font-semibold mb-2">
                            <AlertCircle size={16} />
                            Önemli: Yeni API Anahtarınız
                        </div>
                        <p className="text-sm text-orange-700 mb-3">
                            Bu anahtarı bir daha tam haliyle <strong>göremeyeceksiniz</strong>. Lütfen şimdi kopyalayıp güvenli bir yere kaydedin.
                        </p>
                        <div className="flex gap-2">
                            <code className="flex-1 bg-white border border-orange-100 px-3 py-2 rounded-lg text-sm font-mono text-zinc-800 break-all">
                                {newlyCreatedKey}
                            </code>
                            <button
                                onClick={() => copyToClipboard(newlyCreatedKey)}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center min-w-[100px]"
                            >
                                {copiedKey === 'new' ? <Check size={16} /> : <Copy size={16} />}
                                {copiedKey === 'new' ? 'Kopyalandı' : 'Kopyala'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 mb-6">
                    <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="Anahtar Adı (Örn: Mobil Uygulama Prod)"
                        className="flex-1 rounded-xl bg-zinc-50 border-zinc-200 border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:border-orange-500 focus:ring-orange-500/20 text-zinc-800 transition-all placeholder:text-zinc-400"
                    />
                    <button
                        onClick={handleCreateKey}
                        disabled={isCreating || !newKeyName.trim()}
                        className="bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed font-medium px-4 py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Yeni Anahtar Oluştur
                    </button>
                </div>

                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-zinc-600">
                        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Adı</th>
                                <th className="px-4 py-3 font-semibold">Anahtar (Maskeli)</th>
                                <th className="px-4 py-3 font-semibold">Son Kullanım</th>
                                <th className="px-4 py-3 font-semibold text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                                        <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : apiKeys.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                                        Henüz hiç Deployment API anahtarı oluşturmadınız.
                                    </td>
                                </tr>
                            ) : (
                                apiKeys.map((key) => (
                                    <tr key={key.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-zinc-800">{key.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{key.key}</td>
                                        <td className="px-4 py-3 text-xs text-zinc-500">
                                            {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Hiç kullanılmadı'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDeleteKey(key.id)}
                                                className="text-zinc-400 hover:text-red-500 transition-colors p-1"
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
    );
}
