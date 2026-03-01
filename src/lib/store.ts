import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PromptVersion {
    id: string;
    versionName: string;
    title: string;
    content: string;
    isPublished: boolean;
    createdAt: number;
}

export interface TestResult {
    id: string;
    promptId: string;
    input: string;
    output: string;
    aiResponse?: string;
    tokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    responseTime?: number;
    isToxic: boolean;
    ratings?: any;
    createdAt?: number;
}

export interface EvaluationBatch {
    id: string;
    promptId: string;
    name: string;
    criteria?: string;
    results: TestResult[];
    createdAt: number;
}

export interface Prompt {
    id: string;
    title: string;
    content: string;
    systemPrompt?: string;
    tags?: string[];
    createdAt: number;
    updatedAt: number;
    versions?: PromptVersion[];
    documentIds?: string[]; // New: List of associated document IDs
}

interface PromptStore {
    prompts: Prompt[];
    testResults: Record<string, TestResult[]>;
    versions: Record<string, PromptVersion[]>; // New: Store versions per promptId
    openAiKey?: string;
    selectedModel: string;
    theme: 'light' | 'dark';
    isLoaded: boolean;
    isMigrated: boolean;

    // Data loading
    fetchPrompts: () => Promise<void>;
    fetchSettings: () => Promise<void>;
    fetchTestResults: (promptId: string) => Promise<void>;
    fetchVersions: (promptId: string) => Promise<void>; // New: Fetch versions
    saveTestResult: (promptId: string, data: Omit<TestResult, 'id' | 'promptId' | 'createdAt'>) => Promise<void>;
    saveEvaluationBatch: (promptId: string, name: string, criteria: string[], results: Omit<TestResult, 'id' | 'promptId' | 'createdAt'>[]) => Promise<void>;

    // Migration
    setMigrated: (val: boolean) => void;

    // Settings actions
    setOpenAiKey: (key: string) => void;
    setSelectedModel: (model: string) => void;
    toggleTheme: () => void;

    // Prompt CRUD
    addPrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'versions'>) => void;
    updatePrompt: (id: string, prompt: Partial<Omit<Prompt, 'id'>>) => void;
    deletePrompt: (id: string) => void;
    duplicatePrompt: (id: string) => void;

    // Prompt Versions
    saveVersion: (promptId: string, versionName: string, content: string, title?: string) => Promise<void>; // Modified signature
    restoreVersion: (id: string, versionId: string) => void;
    publishPromptVersion: (promptId: string, versionId: string) => Promise<void>; // New: Publish version
}

export const usePromptStore = create<PromptStore>()(
    persist(
        (set, get) => ({
            prompts: [],
            testResults: {},
            versions: {}, // New: Initialize versions
            openAiKey: undefined,
            selectedModel: 'gpt-4o-mini',
            theme: 'light',
            isLoaded: false,
            isMigrated: false,

            setMigrated: (val) => set({ isMigrated: val }),

            // Fetch all prompts from the database
            fetchPrompts: async () => {
                try {
                    const res = await fetch('/api/prompts');
                    if (res.ok) {
                        const data = await res.json();
                        set({ prompts: data, isLoaded: true });
                    }
                } catch (e) {
                    console.error('Failed to fetch prompts:', e);
                }
            },

            // Fetch settings from the database
            fetchSettings: async () => {
                try {
                    const res = await fetch('/api/settings');
                    if (res.ok) {
                        const data = await res.json();
                        set({
                            openAiKey: data.openAiKey || get().openAiKey,
                            selectedModel: data.selectedModel || get().selectedModel,
                            theme: data.theme || get().theme,
                        });
                    }
                } catch (e) {
                    console.error('Failed to fetch settings:', e);
                }
            },

            // Fetch test results for a specific prompt
            fetchTestResults: async (promptId) => {
                try {
                    const res = await fetch(`/api/prompts/${promptId}/tests`);
                    if (res.ok) {
                        const data = await res.json();
                        set((state) => ({
                            testResults: { ...state.testResults, [promptId]: data }
                        }));
                    }
                } catch (e) {
                    console.error('Failed to fetch test results:', e);
                }
            },

            // New: Fetch versions for a specific prompt
            fetchVersions: async (promptId) => {
                try {
                    const res = await fetch(`/api/prompts/${promptId}/versions`);
                    if (res.ok) {
                        const data = await res.json();
                        set((state) => ({
                            versions: { ...state.versions, [promptId]: data }
                        }));
                    }
                } catch (e) {
                    console.error('Failed to fetch versions:', e);
                }
            },

            publishPromptVersion: async (promptId, versionId) => {
                try {
                    const res = await fetch(`/api/prompts/${promptId}/versions/${versionId}/publish`, {
                        method: 'POST'
                    });
                    if (res.ok) {
                        set((state) => {
                            const currentVersions = state.versions[promptId] || [];
                            const updatedVersions = currentVersions.map(v => ({
                                ...v,
                                isPublished: v.id === versionId
                            }));
                            return {
                                versions: {
                                    ...state.versions,
                                    [promptId]: updatedVersions
                                }
                            };
                        });
                    }
                } catch (e) {
                    console.error('Failed to publish version:', e);
                }
            },

            // Save a test result to DB and state
            saveTestResult: async (promptId, data) => {
                try {
                    const res = await fetch(`/api/prompts/${promptId}/tests`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (res.ok) {
                        const saved = await res.json();
                        set((state) => ({
                            testResults: {
                                ...state.testResults,
                                [promptId]: [saved, ...(state.testResults[promptId] || [])]
                            }
                        }));
                    }
                } catch (e) {
                    console.error('Failed to save test result:', e);
                }
            },

            // Save an entire evaluation batch
            saveEvaluationBatch: async (promptId, name, criteria, results) => {
                try {
                    const res = await fetch(`/api/prompts/${promptId}/batches`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, criteria, results })
                    });
                    if (res.ok) {
                        const savedBatch = await res.json();
                        set((state) => ({
                            testResults: {
                                ...state.testResults,
                                [promptId]: [...(savedBatch.results || []), ...(state.testResults[promptId] || [])]
                            }
                        }));
                    }
                } catch (e) {
                    console.error('Failed to save evaluation batch:', e);
                }
            },

            // Settings: optimistic update + API call
            setOpenAiKey: (key) => {
                set({ openAiKey: key });
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ openAiKey: key }),
                }).catch(console.error);
            },

            setSelectedModel: (model) => {
                set({ selectedModel: model });
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ selectedModel: model }),
                }).catch(console.error);
            },

            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                set({ theme: newTheme });
                fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme: newTheme }),
                }).catch(console.error);
            },

            // Create prompt: optimistic UI + API
            addPrompt: (prompt) => {
                const tempId = crypto.randomUUID();
                const now = Date.now();
                const newPrompt: Prompt = {
                    ...prompt,
                    id: tempId,
                    createdAt: now,
                    updatedAt: now,
                    documentIds: prompt.documentIds || [],
                };
                set((state) => ({ prompts: [...state.prompts, newPrompt] }));

                // Sync with DB
                fetch('/api/prompts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prompt),
                }).then(async (res) => {
                    if (res.ok) {
                        const created = await res.json();
                        set((state) => ({
                            prompts: state.prompts.map(p => p.id === tempId ? created : p),
                        }));
                    }
                }).catch(console.error);
            },

            // Update prompt: optimistic + API
            updatePrompt: (id, updatedFields) => {
                set((state) => ({
                    prompts: state.prompts.map((p) =>
                        p.id === id ? { ...p, ...updatedFields, updatedAt: Date.now() } : p
                    ),
                }));
                const payload = { ...updatedFields };
                fetch(`/api/prompts/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }).catch(console.error);
            },

            // Delete prompt: optimistic + API
            deletePrompt: (id) => {
                set((state) => ({
                    prompts: state.prompts.filter((p) => p.id !== id),
                }));
                fetch(`/api/prompts/${id}`, { method: 'DELETE' }).catch(console.error);
            },

            // Duplicate prompt: optimistic + API
            duplicatePrompt: (id) => {
                const original = get().prompts.find((p) => p.id === id);
                if (!original) return;
                const tempId = crypto.randomUUID();
                set((state) => ({
                    prompts: [...state.prompts, {
                        ...original,
                        id: tempId,
                        title: `${original.title} (Kopya)`,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    }],
                }));
                fetch(`/api/prompts/${id}/duplicate`, { method: 'POST' })
                    .then(async (res) => {
                        if (res.ok) {
                            const dup = await res.json();
                            set((state) => ({
                                prompts: state.prompts.map(p => p.id === tempId ? dup : p),
                            }));
                        }
                    }).catch(console.error);
            },

            // Save version: optimistic + API
            saveVersion: async (id, versionName, content, title) => {
                const prompt = get().prompts.find(p => p.id === id);
                if (!prompt) return;

                const payload = {
                    versionName,
                    title: title || prompt.title,
                    content: content || prompt.content
                };

                const tempVersion: PromptVersion = {
                    id: crypto.randomUUID(),
                    versionName: payload.versionName,
                    title: payload.title,
                    content: payload.content,
                    isPublished: false,
                    createdAt: Date.now(),
                };

                // Optimistic UI update
                set((state) => ({
                    versions: {
                        ...state.versions,
                        [id]: [tempVersion, ...(state.versions[id] || [])]
                    }
                }));

                try {
                    const res = await fetch(`/api/prompts/${id}/versions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });

                    if (res.ok) {
                        const createdVersion = await res.json();
                        // Replace the optimistic temp version with the real one from DB
                        set((state) => ({
                            versions: {
                                ...state.versions,
                                [id]: (state.versions[id] || []).map(v => v.id === tempVersion.id ? createdVersion : v)
                            }
                        }));
                    }
                } catch (e) {
                    console.error('Failed to save version:', e);
                }
            },

            // Restore version: update prompt content based on versions state
            restoreVersion: (id, versionId) =>
                set((state) => {
                    const prompt = state.prompts.find((p) => p.id === id);
                    if (!prompt) return state;
                    const vers = state.versions[id]?.find((v) => v.id === versionId);
                    if (!vers) return state;

                    // Update only locally for optimistic UI. Wait for user to actually "Save" the prompt.
                    const updatedPrompts = state.prompts.map((p) =>
                        p.id === id ? { ...p, title: vers.title, content: vers.content, updatedAt: Date.now() } : p
                    );

                    return { prompts: updatedPrompts };
                }),
        }),
        {
            name: 'prompt-cms-storage',
            partialize: (state) => ({
                openAiKey: state.openAiKey,
                selectedModel: state.selectedModel,
                theme: state.theme,
                isMigrated: state.isMigrated,
            }),
        }
    )
);
