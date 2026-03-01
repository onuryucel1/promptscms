'use client';

import { usePromptStore } from '@/lib/store';
import { KeyRound, CheckCircle2, Save, Cpu, Database, Loader2, Settings, Users, UserPlus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

interface TeamMember {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
}

interface AuthUser {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

const AVAILABLE_MODELS = [
    // Amiral Gemisi & Ajan Modelleri
    { id: 'gpt-5.2', label: 'GPT-5.2', desc: 'Sektörler arası en iyi model (Kodlama & Ajan)' },
    { id: 'gpt-5.2-pro', label: 'GPT-5.2 Pro', desc: 'Daha akıllı ve hassas yanıtlar üreten amiral gemisi' },
    { id: 'gpt-5-mini', label: 'GPT-5 Mini', desc: 'Belirli görevler için daha hızlı ve uygun maliyetli' },
    { id: 'gpt-5-nano', label: 'GPT-5 Nano', desc: 'GPT-5 serisinin en hızlı ve en ucuz versiyonu' },

    // Akıl Yürütme Modelleri
    { id: 'o4-mini', label: 'o4-mini', desc: 'Hızlı, uygun maliyetli akıl yürütme (o1-mini halefi)' },
    { id: 'o3', label: 'o3', desc: 'Karmaşık görevler için akıl yürütme (o1 halefi)' },
    { id: 'o3-pro', label: 'o3 Pro', desc: 'Daha iyi yanıtlar için daha fazla işlem gücüne sahip o3' },
    { id: 'o3-deep-research', label: 'o3 Deep Research', desc: 'En güçlü derinlemesine araştırma modeli' },

    // Kodlama Modelleri
    { id: 'gpt-5.3-codex', label: 'GPT-5.3 Codex', desc: 'Ajan tabanlı görevler için en yetenekli kodlama modeli' },

    // Geri Uyumluluk (Legacy)
    { id: 'gpt-4.1', label: 'GPT-4.1', desc: 'Akıl yürütme özelliği olmayan en akıllı model' },
    { id: 'gpt-4o', label: 'GPT-4o', desc: 'Standart yüksek zekalı model' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Hızlı ve uygun maliyetli çoklu ortam modeli' },
];
export default function SettingsPage() {
    const { openAiKey, setOpenAiKey, selectedModel, setSelectedModel, isMigrated, setMigrated, fetchPrompts } = usePromptStore();
    const { showToast } = useToast();
    const [inputValue, setInputValue] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);

    // Team Management State
    const [user, setUser] = useState<AuthUser | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isTeamLoading, setIsTeamLoading] = useState(false);

    // New Member Form State
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberPassword, setNewMemberPassword] = useState('');
    const [isAddingMember, setIsAddingMember] = useState(false);

    useEffect(() => {
        if (openAiKey) setInputValue(openAiKey);
    }, [openAiKey]);

    useEffect(() => {
        // Fetch current user
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                setUser(data);
                if (data?.role === 'owner') {
                    fetchTeamMembers();
                }
            })
            .catch(console.error);
    }, []);

    const fetchTeamMembers = async () => {
        setIsTeamLoading(true);
        try {
            const res = await fetch('/api/team');
            if (res.ok) {
                const data = await res.json();
                setTeamMembers(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setIsTeamLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName || !newMemberEmail || !newMemberPassword) {
            showToast('Lütfen tüm alanları doldurun.', 'error');
            return;
        }

        setIsAddingMember(true);
        try {
            const res = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newMemberName,
                    email: newMemberEmail,
                    password: newMemberPassword
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Eklenirken bir hata oluştu');

            showToast('Takım arkadaşı başarıyla eklendi', 'success');
            setNewMemberName('');
            setNewMemberEmail('');
            setNewMemberPassword('');
            fetchTeamMembers(); // Listeyi yenile
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm('Bu kullanıcıyı çalışma alanından çıkarmak istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Silinirken bir hata oluştu');

            showToast('Kullanıcı başarıyla silindi', 'success');
            setTeamMembers(prev => prev.filter(m => m.id !== id));
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const handleSave = () => {
        setOpenAiKey(inputValue.trim());
        setIsSaved(true);
        showToast('API anahtarı başarıyla kaydedildi!', 'success');
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Settings size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Ayarlar</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">PromptCMS sisteminizi yapılandırın.</p>
                </div>
            </div>

            <div className="mt-8 space-y-6">
                {/* API Key Section */}
                <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden animate-slide-up delay-100">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
                        <KeyRound size={18} className="text-emerald-500" />
                        <h2 className="font-semibold text-zinc-900 dark:text-white">API Entegrasyonları</h2>
                    </div>

                    <div className="p-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">OpenAI API Key</label>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Not:</span> Girdiğiniz anahtar yalnızca tarayıcınızda yerel olarak saklanır.
                            </p>
                            <div className="flex gap-3">
                                <input
                                    type="password"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="sk-proj-..."
                                    className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 text-zinc-800 dark:text-zinc-100 transition-all font-mono placeholder:text-zinc-400"
                                />
                                <button
                                    onClick={handleSave}
                                    className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-900/50 font-medium px-4 py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2 min-w-[100px]"
                                >
                                    {isSaved ? (
                                        <>
                                            <CheckCircle2 size={16} />
                                            Kaydedildi
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Kaydet
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Model Selection Section */}
                <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden animate-slide-up delay-300">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
                        <Cpu size={18} className="text-violet-500" />
                        <h2 className="font-semibold text-zinc-900 dark:text-white">Model Seçimi</h2>
                    </div>

                    <div className="p-6">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Testlerinizde kullanılacak OpenAI modelini seçin.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {AVAILABLE_MODELS.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        setSelectedModel(model.id);
                                        showToast(`Model değiştirildi: ${model.label}`, 'info');
                                    }}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedModel === model.id
                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-sm'
                                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <div className={`text-sm font-semibold ${selectedModel === model.id ? 'text-violet-700 dark:text-violet-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                        {model.label}
                                    </div>
                                    <div className="text-[11px] text-zinc-400 mt-0.5">{model.desc}</div>
                                    {selectedModel === model.id && (
                                        <div className="mt-2 text-[10px] text-violet-500 dark:text-violet-400 font-medium uppercase tracking-wider flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Aktif
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Migration Section */}
                {!isMigrated && (
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-sm overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 animate-slide-up delay-400">
                        <div className="p-4 border-b border-blue-100 dark:border-blue-900/50 flex items-center gap-2">
                            <Database size={18} className="text-blue-500" />
                            <h2 className="font-semibold text-blue-900 dark:text-blue-300">Yerel Verileri Aktar</h2>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-blue-800/80 dark:text-blue-300/80 mb-4">
                                Önceki sürümlerden kalan (tarayıcınızda kayıtlı) verilerinizi yeni veritabanı sistemine aktarıp hesabınızla eşleştirebilirsiniz.
                            </p>

                            <button
                                onClick={async () => {
                                    setIsMigrating(true);
                                    try {
                                        const storageStr = localStorage.getItem('prompt-cms-storage');
                                        if (!storageStr) {
                                            showToast('Tarayıcıda aktarılacak veri bulunamadı.', 'info');
                                            setMigrated(true);
                                            return;
                                        }

                                        const parsed = JSON.parse(storageStr);
                                        const state = parsed.state || {};
                                        const prompts = state.prompts || [];
                                        const settings = {
                                            openAiKey: state.openAiKey,
                                            selectedModel: state.selectedModel,
                                            theme: state.theme
                                        };

                                        if (prompts.length === 0 && !settings.openAiKey) {
                                            showToast('Aktarılacak önemli bir veri yok.', 'info');
                                            setMigrated(true);
                                            return;
                                        }

                                        const res = await fetch('/api/migrate', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ prompts, settings })
                                        });

                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error);

                                        showToast(`${data.importedCount || 0} prompt başarıyla aktarıldı!`, 'success');
                                        setMigrated(true);
                                        fetchPrompts();
                                    } catch (e: any) {
                                        showToast(`Hata: ${e.message}`, 'error');
                                    } finally {
                                        setIsMigrating(false);
                                    }
                                }}
                                disabled={isMigrating}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 disabled:opacity-50"
                            >
                                {isMigrating ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                                {isMigrating ? 'Aktarılıyor...' : 'Verileri Veritabanına Aktar'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Team Management Section */}
                {user?.role === 'owner' && (
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden animate-slide-up delay-500">
                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-pink-500" />
                                <h2 className="font-semibold text-zinc-900 dark:text-white">Takım Yönetimi</h2>
                            </div>
                            <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-1 rounded-full font-medium">Sadece Yönetici (Owner)</span>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                                Çalışma alanınıza yeni takım arkadaşları ekleyin. Eklediğiniz kişiler bu alandaki prompt ve belgelerinize erişebilir.
                            </p>

                            {/* Add Member Form */}
                            <form onSubmit={handleAddMember} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700 mb-8">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                                    <UserPlus size={16} className="text-zinc-400" /> Yeni Üye Ekle
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                    <input
                                        type="text"
                                        placeholder="İsim"
                                        value={newMemberName}
                                        onChange={e => setNewMemberName(e.target.value)}
                                        className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                                        disabled={isAddingMember}
                                    />
                                    <input
                                        type="email"
                                        placeholder="E-posta Adresi"
                                        value={newMemberEmail}
                                        onChange={e => setNewMemberEmail(e.target.value)}
                                        className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                                        disabled={isAddingMember}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Şifre (Min 6 karakter)"
                                        value={newMemberPassword}
                                        onChange={e => setNewMemberPassword(e.target.value)}
                                        className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                                        disabled={isAddingMember}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isAddingMember}
                                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isAddingMember ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                                        Ekle
                                    </button>
                                </div>
                            </form>

                            {/* Members List */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 text-zinc-800 dark:text-zinc-200">Mevcut Üyeler</h3>
                                {isTeamLoading ? (
                                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-zinc-400" size={20} /></div>
                                ) : teamMembers.length === 0 ? (
                                    <div className="text-center py-4 text-sm text-zinc-500">Henüz takım arkadaşı eklenmemiş.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {teamMembers.map(member => (
                                            <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/30 gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-medium text-xs">
                                                        {member.name?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                            {member.name}
                                                            {member.role === 'owner' && <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase">Owner</span>}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">{member.email}</div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteMember(member.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs self-start sm:self-auto"
                                                >
                                                    <Trash2 size={14} /> Kaldır
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
