'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    Node,
    Edge,
    Connection,
    NodeChange,
    EdgeChange,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Link2, Play, Loader2, Plus, Trash2 } from 'lucide-react';
import { usePromptStore, Prompt } from '@/lib/store';
import { useToast } from '@/components/Toast';
import ReactMarkdown from 'react-markdown';

interface ChainBuilderProps {
    prompts: Prompt[];
    systemPrompt?: string;
}

// Ensure the prompt node style matches the application's clean UI
const PromptNode = memo(({ data }: any) => {
    return (
        <div className="bg-white border-2 border-cyan-400 rounded-xl shadow-lg min-w-[200px] max-w-[250px] overflow-hidden">
            <div className="bg-cyan-50 p-2 border-b border-cyan-100 flex justify-between items-center text-xs font-bold text-cyan-800">
                <span>{data.label}</span>
                <button onClick={data.onDelete} className="text-zinc-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors">
                    <Trash2 size={12} />
                </button>
            </div>
            <div className="p-3 text-[10px] text-zinc-500 line-clamp-2">
                {data.content}
            </div>

            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-cyan-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-cyan-500 border-2 border-white"
            />
        </div>
    );
});
PromptNode.displayName = 'PromptNode';

const nodeTypes = {
    promptNode: PromptNode
};

export default function ChainBuilder({ prompts, systemPrompt }: ChainBuilderProps) {
    const { openAiKey, selectedModel } = usePromptStore();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [initialInput, setInitialInput] = useState('');
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<{ stepLabel: string; input: string; output: string; time: number }[]>([]);

    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );
    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } }, eds)),
        []
    );

    const handleDeleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    }, []);

    const addNode = (promptId: string) => {
        const prompt = prompts.find(p => p.id === promptId);
        if (!prompt) return;

        const newNode: Node = {
            id: crypto.randomUUID(),
            type: 'promptNode',
            position: { x: 100 + (nodes.length * 250), y: 150 }, // Auto layout roughly
            data: {
                label: prompt.title,
                content: prompt.content,
                promptId: prompt.id,
                onDelete: () => handleDeleteNode(newNode.id)
            }
        };

        setNodes((nds) => [...nds, newNode]);
    };

    // Very simple linear execution tracing based on edges
    const runWorkflow = async () => {
        if (nodes.length === 0 || !initialInput.trim()) {
            showToast('Lütfen düğümleri ve ilk veriyi doldurun.', 'error');
            return;
        }

        // Find the start node (node with no incoming edges)
        const targets = new Set(edges.map(e => e.target));
        const startNodes = nodes.filter(n => !targets.has(n.id));

        if (startNodes.length === 0) {
            showToast('Bir başlangıç düğümü bulunamadı (Tümü birbirine bağlı).', 'error');
            return;
        }
        if (startNodes.length > 1) {
            showToast('Birden fazla başlangıç düğümü var. Şimdilik sadece doğrusal (lineer) akış desteklenmektedir.', 'error');
            return;
        }

        // Topologically sort or simply follow the single path
        let currentNodeId: string | null = startNodes[0].id;
        const executionPath: Node[] = [];
        const visited = new Set<string>();

        while (currentNodeId && !visited.has(currentNodeId)) {
            visited.add(currentNodeId);
            const node = nodes.find(n => n.id === currentNodeId);
            if (node) {
                executionPath.push(node);
                const nextEdge = edges.find(e => e.source === currentNodeId);
                currentNodeId = nextEdge ? nextEdge.target : null;
            } else {
                currentNodeId = null;
            }
        }

        if (visited.has(currentNodeId!)) {
            showToast('Döngü tespit edildi. Halka şeklinde akış desteklenmiyor.', 'error');
            return;
        }

        setRunning(true);
        setResults([]);
        let currentInput = initialInput;

        try {
            for (const step of executionPath) {
                const promptContent = step.data.content;
                const promptText = promptContent.includes('{{')
                    ? promptContent.replace(/\{\{[^}]+\}\}/g, currentInput)
                    : `${promptContent}\n\nGirdi: ${currentInput}`;

                const start = performance.now();
                const res = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: promptText, apiKey: openAiKey, systemPrompt, model: selectedModel })
                });
                const elapsed = Math.round(performance.now() - start);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setResults(prev => [...prev, {
                    stepLabel: step.data.label,
                    input: currentInput.slice(0, 200) + (currentInput.length > 200 ? '...' : ''),
                    output: data.result,
                    time: elapsed,
                }]);

                currentInput = data.result;
            }
            showToast('Görsel İş Akışı tamamlandı!', 'success');
        } catch (err: any) {
            showToast(`İş akışı başarısız: ${err.message}`, 'error');
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm mt-6 overflow-hidden flex flex-col">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between hover:bg-zinc-100/50 transition-all"
            >
                <div className="flex items-center gap-2">
                    <Link2 size={18} className="text-cyan-500" />
                    <h2 className="font-semibold text-zinc-900">Görsel İş Akışı (Prompt Chaining)</h2>
                    <span className="text-[10px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded font-medium">{nodes.length} düğüm</span>
                </div>
                <span className="text-xs text-zinc-400">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="flex flex-col h-[700px]">
                    {/* Controls Bar */}
                    <div className="p-4 border-b border-zinc-100 flex items-center gap-3 bg-white z-10">
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    addNode(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            className="text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                            value=""
                        >
                            <option value="" disabled>+ Sahneye Prompt Ekle...</option>
                            {prompts.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <div className="h-6 w-px bg-zinc-200 mx-2"></div>
                        <input
                            type="text"
                            value={initialInput}
                            onChange={(e) => setInitialInput(e.target.value)}
                            placeholder="İlk (Başlangıç) giriş verisi..."
                            className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                        />
                        <button
                            onClick={runWorkflow}
                            disabled={running || nodes.length === 0}
                            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:from-cyan-700 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50 text-sm"
                        >
                            {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                            {running ? 'Çalışıyor...' : 'Akışı Başlat'}
                        </button>
                    </div>

                    {/* Editor & Results Split */}
                    <div className="flex-1 flex flex-col md:flex-row h-full">
                        {/* React Flow Canvas */}
                        <div className="flex-[2] h-full border-r border-zinc-100 relative bg-slate-50">
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                nodeTypes={nodeTypes}
                                fitView
                            >
                                <Background color="#cbd5e1" gap={16} />
                                <Controls />
                            </ReactFlow>
                            {nodes.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-zinc-400 font-medium bg-white/50 px-4 py-2 rounded-full border border-zinc-200 shadow-sm backdrop-blur-sm">
                                        Yukarıdan düğüm ekleyerek iş akışını oluşturmaya başlayın.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Execution Results */}
                        {results.length > 0 && (
                            <div className="flex-1 bg-white p-4 overflow-y-auto">
                                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2">Çıktı Sonuçları</h3>
                                <div className="space-y-4">
                                    {results.map((r, i) => (
                                        <div key={i} className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                                            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-3 py-2 flex items-center justify-between border-b border-zinc-100">
                                                <span className="text-xs font-bold text-cyan-800 flex items-center gap-2">
                                                    <span className="w-5 h-5 bg-cyan-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">{i + 1}</span>
                                                    {r.stepLabel}
                                                </span>
                                                <span className="text-[10px] bg-white border border-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded font-bold shadow-sm">
                                                    {r.time}ms
                                                </span>
                                            </div>
                                            <div className="p-3">
                                                {i === 0 && (
                                                    <>
                                                        <div className="text-[10px] text-zinc-400 mb-1 uppercase font-bold tracking-wider">Girdi</div>
                                                        <div className="text-[11px] text-zinc-600 mb-3 bg-zinc-50 p-2 rounded border border-zinc-100 truncate">{r.input}</div>
                                                    </>
                                                )}
                                                <div className="text-[10px] text-indigo-400 mb-1 uppercase font-bold tracking-wider">Çıktı</div>
                                                <div className="text-xs text-zinc-800 prose prose-xs max-w-none bg-slate-50 p-3 rounded border border-slate-100 max-h-48 overflow-y-auto custom-scrollbar">
                                                    <ReactMarkdown>{r.output}</ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
