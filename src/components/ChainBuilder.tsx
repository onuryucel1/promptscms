'use client';

import { useState, useCallback, memo, useEffect } from 'react';
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
import {
    Link2, Play, Loader2, Trash2, Save, FolderOpen, Clock,
    GitBranch, ArrowRightLeft, Combine, FileOutput, ChevronDown
} from 'lucide-react';
import { usePromptStore, Prompt } from '@/lib/store';
import { useToast } from '@/components/Toast';
import ReactMarkdown from 'react-markdown';

interface ChainBuilderProps {
    prompts: Prompt[];
    systemPrompt?: string;
}

interface SavedWorkflow {
    id: string;
    name: string;
    description?: string;
    nodes: string;
    edges: string;
    updatedAt: string;
    _count?: { runs: number };
}

interface RunResult {
    stepLabel: string;
    input: string;
    output: string;
    time: number;
    model?: string;
    status: 'success' | 'error' | 'skipped';
}

const MODEL_OPTIONS = [
    { id: '', label: 'Varsayılan Model' },
    { id: 'gpt-5.2', label: 'GPT-5.2' },
    { id: 'gpt-5.2-pro', label: 'GPT-5.2 Pro' },
    { id: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'o3', label: 'o3' },
    { id: 'o4-mini', label: 'o4-mini' },
];

// ─── NODE COMPONENTS ───────────────────────────────────

// Prompt Node — calls AI
const PromptNode = memo(({ data }: any) => (
    <div className={`bg-white border-2 rounded-xl shadow-lg min-w-[220px] max-w-[260px] overflow-hidden transition-all duration-300 ${data.execStatus === 'running' ? 'border-green-400 shadow-green-200 animate-pulse' :
        data.execStatus === 'done' ? 'border-green-500 shadow-green-100' :
            data.execStatus === 'error' ? 'border-red-400 shadow-red-100' :
                'border-cyan-400'
        }`}>
        <div className="bg-cyan-50 p-2 border-b border-cyan-100 flex justify-between items-center">
            <span className="text-xs font-bold text-cyan-800 flex items-center gap-1.5">
                {data.execStatus === 'done' && <span className="text-green-500">✓</span>}
                {data.execStatus === 'error' && <span className="text-red-500">✗</span>}
                {data.execStatus === 'running' && <Loader2 size={10} className="animate-spin text-green-500" />}
                {data.label}
            </span>
            <button onClick={data.onDelete} className="text-zinc-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors">
                <Trash2 size={12} />
            </button>
        </div>
        <div className="p-2 text-[10px] text-zinc-500 line-clamp-2">{data.content}</div>
        <div className="px-2 pb-2">
            <select
                value={data.model || ''}
                onChange={(e) => data.onModelChange?.(e.target.value)}
                className="w-full text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 focus:outline-none focus:border-cyan-400"
                onClick={(e) => e.stopPropagation()}
            >
                {MODEL_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
        </div>
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-cyan-500 border-2 border-white" />
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-cyan-500 border-2 border-white" />
    </div>
));
PromptNode.displayName = 'PromptNode';

// Condition Node — branches based on output content
const ConditionNode = memo(({ data }: any) => (
    <div className={`bg-white border-2 rounded-xl shadow-lg min-w-[220px] max-w-[260px] overflow-hidden transition-all duration-300 ${data.execStatus === 'running' ? 'border-green-400 shadow-green-200 animate-pulse' :
        data.execStatus === 'done' ? 'border-green-500 shadow-green-100' :
            data.execStatus === 'error' ? 'border-red-400 shadow-red-100' :
                'border-violet-400'
        }`}>
        <div className="bg-violet-50 p-2 border-b border-violet-100 flex justify-between items-center">
            <span className="text-xs font-bold text-violet-800 flex items-center gap-1.5">
                <GitBranch size={12} />
                {data.execStatus === 'done' && <span className="text-green-500">✓</span>}
                Koşul
            </span>
            <button onClick={data.onDelete} className="text-zinc-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors">
                <Trash2 size={12} />
            </button>
        </div>
        <div className="p-2 space-y-1.5">
            <div className="text-[9px] text-violet-600 font-bold uppercase tracking-wider">Koşul Kuralı</div>
            <select
                value={data.conditionType || 'contains'}
                onChange={(e) => data.onConditionTypeChange?.(e.target.value)}
                className="w-full text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 focus:outline-none focus:border-violet-400"
                onClick={(e) => e.stopPropagation()}
            >
                <option value="contains">İçeriyorsa (contains)</option>
                <option value="not_contains">İçermiyorsa</option>
                <option value="equals">Tam eşitse (equals)</option>
                <option value="starts_with">İle başlıyorsa</option>
                <option value="regex">Regex eşleşirse</option>
            </select>
            <input
                type="text"
                value={data.conditionValue || ''}
                onChange={(e) => data.onConditionValueChange?.(e.target.value)}
                placeholder='örn: "evet" veya "positive"'
                className="w-full text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 focus:outline-none focus:border-violet-400"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-violet-500 border-2 border-white" />
        <Handle type="source" position={Position.Right} id="yes" style={{ top: '35%' }} className="w-3 h-3 bg-green-500 border-2 border-white" />
        <Handle type="source" position={Position.Right} id="no" style={{ top: '75%' }} className="w-3 h-3 bg-red-500 border-2 border-white" />
        <div className="absolute right-[-42px] text-[9px] font-bold" style={{ top: '28%' }}>
            <span className="text-green-600 bg-green-50 px-1 rounded">Evet</span>
        </div>
        <div className="absolute right-[-42px] text-[9px] font-bold" style={{ top: '68%' }}>
            <span className="text-red-600 bg-red-50 px-1 rounded">Hayır</span>
        </div>
    </div>
));
ConditionNode.displayName = 'ConditionNode';

// Transform Node — JS-free text manipulation
const TransformNode = memo(({ data }: any) => (
    <div className={`bg-white border-2 rounded-xl shadow-lg min-w-[220px] max-w-[260px] overflow-hidden transition-all duration-300 ${data.execStatus === 'running' ? 'border-green-400 animate-pulse' :
        data.execStatus === 'done' ? 'border-green-500' : 'border-amber-400'
        }`}>
        <div className="bg-amber-50 p-2 border-b border-amber-100 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <ArrowRightLeft size={12} />
                {data.execStatus === 'done' && <span className="text-green-500">✓</span>}
                Dönüştür
            </span>
            <button onClick={data.onDelete} className="text-zinc-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors">
                <Trash2 size={12} />
            </button>
        </div>
        <div className="p-2 space-y-1.5">
            <select
                value={data.transformType || 'prefix'}
                onChange={(e) => data.onTransformTypeChange?.(e.target.value)}
                className="w-full text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 focus:outline-none focus:border-amber-400"
                onClick={(e) => e.stopPropagation()}
            >
                <option value="prefix">Başına Metin Ekle</option>
                <option value="suffix">Sonuna Metin Ekle</option>
                <option value="replace">Bul & Değiştir</option>
                <option value="uppercase">BÜYÜK HARFE Çevir</option>
                <option value="lowercase">küçük harfe çevir</option>
                <option value="trim">Kırp (ilk 500 karakter)</option>
                <option value="template">Şablon ile Sar</option>
            </select>
            {['prefix', 'suffix', 'template'].includes(data.transformType || 'prefix') && (
                <input
                    type="text"
                    value={data.transformValue || ''}
                    onChange={(e) => data.onTransformValueChange?.(e.target.value)}
                    placeholder={data.transformType === 'template' ? 'Şablon: {{input}} şeklinde' : 'Eklenecek metin...'}
                    className="w-full text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 focus:outline-none focus:border-amber-400"
                    onClick={(e) => e.stopPropagation()}
                />
            )}
            {data.transformType === 'replace' && (
                <>
                    <input type="text" value={data.transformFind || ''} onChange={(e) => data.onTransformFindChange?.(e.target.value)}
                        placeholder="Bul..." className="w-full text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 focus:outline-none" onClick={(e) => e.stopPropagation()} />
                    <input type="text" value={data.transformReplace || ''} onChange={(e) => data.onTransformReplaceChange?.(e.target.value)}
                        placeholder="Değiştir..." className="w-full text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 focus:outline-none" onClick={(e) => e.stopPropagation()} />
                </>
            )}
        </div>
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500 border-2 border-white" />
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-amber-500 border-2 border-white" />
    </div>
));
TransformNode.displayName = 'TransformNode';

// Merge Node — combines inputs
const MergeNode = memo(({ data }: any) => (
    <div className={`bg-white border-2 rounded-xl shadow-lg min-w-[180px] max-w-[220px] overflow-hidden transition-all duration-300 ${data.execStatus === 'done' ? 'border-green-500' : 'border-emerald-400'
        }`}>
        <div className="bg-emerald-50 p-2 border-b border-emerald-100 flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Combine size={12} />
                Birleştir
            </span>
            <button onClick={data.onDelete} className="text-zinc-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors">
                <Trash2 size={12} />
            </button>
        </div>
        <div className="p-2 text-[10px] text-zinc-500">Birden fazla girdiyi birleştirir.</div>
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
    </div>
));
MergeNode.displayName = 'MergeNode';

// ─── nodeTypes ─────────────────────────────────────────

const nodeTypes = {
    promptNode: PromptNode,
    conditionNode: ConditionNode,
    transformNode: TransformNode,
    mergeNode: MergeNode,
};

// ─── HELPERS ───────────────────────────────────────────

function evaluateCondition(output: string, type: string, value: string): boolean {
    const lower = output.toLowerCase().trim();
    const val = value.toLowerCase().trim();
    switch (type) {
        case 'contains': return lower.includes(val);
        case 'not_contains': return !lower.includes(val);
        case 'equals': return lower === val;
        case 'starts_with': return lower.startsWith(val);
        case 'regex': try { return new RegExp(value, 'i').test(output); } catch { return false; }
        default: return false;
    }
}

function applyTransform(input: string, type: string, value: string, find?: string, replace?: string): string {
    switch (type) {
        case 'prefix': return (value || '') + input;
        case 'suffix': return input + (value || '');
        case 'replace': return input.replaceAll(find || '', replace || '');
        case 'uppercase': return input.toUpperCase();
        case 'lowercase': return input.toLowerCase();
        case 'trim': return input.slice(0, 500);
        case 'template': return (value || '{{input}}').replace(/\{\{input\}\}/g, input);
        default: return input;
    }
}

// ─── MAIN COMPONENT ────────────────────────────────────

export default function ChainBuilder({ prompts, systemPrompt }: ChainBuilderProps) {
    const { openAiKey, selectedModel } = usePromptStore();
    const { showToast } = useToast();

    const [initialInput, setInitialInput] = useState('');
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<RunResult[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Save/Load state
    const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);
    const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
    const [workflowName, setWorkflowName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [runHistory, setRunHistory] = useState<any[]>([]);

    // Load saved workflows on mount
    useEffect(() => {
        fetch('/api/workflows').then(r => r.ok ? r.json() : []).then(setSavedWorkflows).catch(() => { });
    }, []);

    // ─── React Flow callbacks ──────────────────────────
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []
    );
    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge({
            ...params, animated: true,
            style: {
                stroke: (params as any).sourceHandle === 'yes' ? '#22c55e' :
                    (params as any).sourceHandle === 'no' ? '#ef4444' : '#06b6d4',
                strokeWidth: 2
            }
        }, eds)), []
    );

    // ─── Node CRUD ─────────────────────────────────────

    const handleDeleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    }, []);

    const updateNodeData = useCallback((nodeId: string, key: string, value: any) => {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, [key]: value } } : n));
    }, []);

    const addPromptNode = (promptId: string) => {
        const prompt = prompts.find(p => p.id === promptId);
        if (!prompt) return;
        const id = crypto.randomUUID();
        const newNode: Node = {
            id, type: 'promptNode',
            position: { x: 100 + (nodes.length * 280), y: 150 },
            data: {
                label: prompt.title, content: prompt.content, promptId: prompt.id, model: '',
                onDelete: () => handleDeleteNode(id),
                onModelChange: (v: string) => updateNodeData(id, 'model', v),
            }
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const addConditionNode = () => {
        const id = crypto.randomUUID();
        const newNode: Node = {
            id, type: 'conditionNode',
            position: { x: 100 + (nodes.length * 280), y: 150 },
            data: {
                conditionType: 'contains', conditionValue: '',
                onDelete: () => handleDeleteNode(id),
                onConditionTypeChange: (v: string) => updateNodeData(id, 'conditionType', v),
                onConditionValueChange: (v: string) => updateNodeData(id, 'conditionValue', v),
            }
        };
        setNodes(nds => [...nds, newNode]);
    };

    const addTransformNode = () => {
        const id = crypto.randomUUID();
        const newNode: Node = {
            id, type: 'transformNode',
            position: { x: 100 + (nodes.length * 280), y: 150 },
            data: {
                transformType: 'prefix', transformValue: '', transformFind: '', transformReplace: '',
                onDelete: () => handleDeleteNode(id),
                onTransformTypeChange: (v: string) => updateNodeData(id, 'transformType', v),
                onTransformValueChange: (v: string) => updateNodeData(id, 'transformValue', v),
                onTransformFindChange: (v: string) => updateNodeData(id, 'transformFind', v),
                onTransformReplaceChange: (v: string) => updateNodeData(id, 'transformReplace', v),
            }
        };
        setNodes(nds => [...nds, newNode]);
    };

    const addMergeNode = () => {
        const id = crypto.randomUUID();
        const newNode: Node = {
            id, type: 'mergeNode',
            position: { x: 100 + (nodes.length * 280), y: 150 },
            data: { onDelete: () => handleDeleteNode(id) }
        };
        setNodes(nds => [...nds, newNode]);
    };

    // ─── Workflow execution helpers ─────────────────

    const setNodeExecStatus = (nodeId: string, status: string) => {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, execStatus: status } } : n));
    };

    const clearExecStatus = () => {
        setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, execStatus: undefined } })));
    };

    // ─── Detect dynamic variables from prompt nodes ────

    const getNodeVariables = (nodeId: string): string[] => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.type !== 'promptNode') return [];
        const content = node.data.content || '';
        const vars: string[] = [];
        const matches = content.matchAll(/\{\{([^}]+)\}\}/g);
        for (const m of matches) {
            const v = m[1].trim();
            if (!vars.includes(v)) vars.push(v);
        }
        return vars;
    };

    const allVariables = (() => {
        const vars = new Set<string>();
        nodes.filter(n => n.type === 'promptNode').forEach(n => {
            const content = n.data.content || '';
            const matches = content.matchAll(/\{\{([^}]+)\}\}/g);
            for (const m of matches) vars.add(m[1].trim());
        });
        return Array.from(vars);
    })();

    const hasVariables = allVariables.length > 0;
    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
    const selectedNodeVars = selectedNodeId ? getNodeVariables(selectedNodeId) : [];

    // Per-node variable map: { nodeId: [var1, var2] }
    const nodesWithVars = nodes
        .filter(n => n.type === 'promptNode')
        .map(n => ({ id: n.id, label: n.data.label, vars: getNodeVariables(n.id) }))
        .filter(n => n.vars.length > 0);

    const hasVariablesForSelected = selectedNodeVars.length > 0;

    const buildInputFromVariables = (): string => {
        if (!hasVariables) return initialInput;
        return JSON.stringify(variableValues);
    };

    const substituteVariables = (content: string, prevOutput: string): string => {
        if (hasVariables) {
            let result = content;
            for (const [key, val] of Object.entries(variableValues)) {
                result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
            }
            // Replace any remaining {{input}} or {{output}} type vars with previous step output
            result = result.replace(/\{\{[^}]+\}\}/g, prevOutput);
            return result;
        }
        // No variables detected — use classic substitution
        if (content.includes('{{')) {
            return content.replace(/\{\{[^}]+\}\}/g, prevOutput);
        }
        return `${content}\n\nGirdi: ${prevOutput}`;
    };

    const runWorkflow = async () => {
        const inputReady = hasVariables
            ? allVariables.some(v => variableValues[v]?.trim())
            : initialInput.trim();
        if (nodes.length === 0 || !inputReady) {
            showToast('Lütfen düğümleri ve giriş değerlerini doldurun.', 'error');
            return;
        }

        // Find start nodes (no incoming edges)
        const targets = new Set(edges.map(e => e.target));
        const startNodes = nodes.filter(n => !targets.has(n.id));
        if (startNodes.length === 0) {
            showToast('Başlangıç düğümü bulunamadı.', 'error');
            return;
        }
        if (startNodes.length > 1) {
            showToast('Birden fazla başlangıç düğümü var. Tek bir giriş noktası olmalı.', 'error');
            return;
        }

        setRunning(true);
        setResults([]);
        clearExecStatus();
        const allResults: RunResult[] = [];
        const startTime = performance.now();
        const startInput = hasVariables ? JSON.stringify(variableValues) : initialInput;

        const executeNode = async (nodeId: string, input: string): Promise<void> => {
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;

            setNodeExecStatus(nodeId, 'running');

            try {
                if (node.type === 'promptNode') {
                    const promptContent = node.data.content;
                    const promptText = substituteVariables(promptContent, input);

                    const model = node.data.model || selectedModel;
                    const start = performance.now();
                    const res = await fetch('/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: promptText, apiKey: openAiKey, systemPrompt, model })
                    });
                    const elapsed = Math.round(performance.now() - start);
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);

                    const result: RunResult = {
                        stepLabel: node.data.label, input: input.slice(0, 300),
                        output: data.result, time: elapsed, model, status: 'success'
                    };
                    allResults.push(result);
                    setResults([...allResults]);
                    setNodeExecStatus(nodeId, 'done');

                    // Follow outgoing edges
                    const outEdges = edges.filter(e => e.source === nodeId);
                    for (const edge of outEdges) {
                        await executeNode(edge.target, data.result);
                    }
                }
                else if (node.type === 'conditionNode') {
                    const condType = node.data.conditionType || 'contains';
                    const condValue = node.data.conditionValue || '';
                    const isTrue = evaluateCondition(input, condType, condValue);

                    allResults.push({
                        stepLabel: `Koşul: "${condValue}" → ${isTrue ? 'EVET' : 'HAYIR'}`,
                        input: input.slice(0, 300), output: isTrue ? '✅ Koşul sağlandı → Evet dalı' : '❌ Koşul sağlanmadı → Hayır dalı',
                        time: 0, status: 'success'
                    });
                    setResults([...allResults]);
                    setNodeExecStatus(nodeId, 'done');

                    // Branch: follow "yes" or "no" handle edges
                    const branchId = isTrue ? 'yes' : 'no';
                    const branchEdges = edges.filter(e => e.source === nodeId && e.sourceHandle === branchId);
                    // Fallback: if no handle-specific edges, follow all
                    const fallbackEdges = branchEdges.length > 0 ? branchEdges : edges.filter(e => e.source === nodeId);
                    for (const edge of fallbackEdges) {
                        await executeNode(edge.target, input);
                    }
                }
                else if (node.type === 'transformNode') {
                    const tType = node.data.transformType || 'prefix';
                    const output = applyTransform(input, tType, node.data.transformValue || '', node.data.transformFind, node.data.transformReplace);

                    allResults.push({
                        stepLabel: `Dönüştür: ${tType}`, input: input.slice(0, 300),
                        output: output.slice(0, 500), time: 0, status: 'success'
                    });
                    setResults([...allResults]);
                    setNodeExecStatus(nodeId, 'done');

                    const outEdges = edges.filter(e => e.source === nodeId);
                    for (const edge of outEdges) {
                        await executeNode(edge.target, output);
                    }
                }
                else if (node.type === 'mergeNode') {
                    // Merge just passes input through (real merge happens when multiple edges feed into it)
                    setNodeExecStatus(nodeId, 'done');
                    const outEdges = edges.filter(e => e.source === nodeId);
                    for (const edge of outEdges) {
                        await executeNode(edge.target, input);
                    }
                }
            } catch (err: any) {
                setNodeExecStatus(nodeId, 'error');
                allResults.push({
                    stepLabel: node.data.label || node.type || 'Hata',
                    input: input.slice(0, 300), output: `Hata: ${err.message}`,
                    time: 0, status: 'error'
                });
                setResults([...allResults]);
            }
        };

        try {
            await executeNode(startNodes[0].id, startInput);
            showToast('İş akışı tamamlandı!', 'success');
        } catch (err: any) {
            showToast(`İş akışı başarısız: ${err.message}`, 'error');
        }

        // Save run if workflow is persisted
        const totalTime = Math.round(performance.now() - startTime);
        if (currentWorkflowId) {
            fetch(`/api/workflows/${currentWorkflowId}/runs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: startInput, steps: allResults,
                    status: allResults.some(r => r.status === 'error') ? 'error' : 'completed',
                    totalTime
                })
            }).catch(() => { });
        }

        setRunning(false);
    };

    // ─── Save/Load ─────────────────────────────────────

    const serializeNodes = () => nodes.map(n => ({
        id: n.id, type: n.type, position: n.position,
        data: {
            label: n.data.label, content: n.data.content, promptId: n.data.promptId, model: n.data.model,
            conditionType: n.data.conditionType, conditionValue: n.data.conditionValue,
            transformType: n.data.transformType, transformValue: n.data.transformValue,
            transformFind: n.data.transformFind, transformReplace: n.data.transformReplace,
        }
    }));

    const deserializeNodes = (serialized: any[]) => {
        return serialized.map((n: any) => ({
            ...n,
            data: {
                ...n.data,
                execStatus: undefined,
                onDelete: () => handleDeleteNode(n.id),
                onModelChange: (v: string) => updateNodeData(n.id, 'model', v),
                onConditionTypeChange: (v: string) => updateNodeData(n.id, 'conditionType', v),
                onConditionValueChange: (v: string) => updateNodeData(n.id, 'conditionValue', v),
                onTransformTypeChange: (v: string) => updateNodeData(n.id, 'transformType', v),
                onTransformValueChange: (v: string) => updateNodeData(n.id, 'transformValue', v),
                onTransformFindChange: (v: string) => updateNodeData(n.id, 'transformFind', v),
                onTransformReplaceChange: (v: string) => updateNodeData(n.id, 'transformReplace', v),
            }
        }));
    };

    const handleSave = async () => {
        if (!workflowName.trim()) { showToast('Lütfen bir isim girin.', 'error'); return; }
        try {
            const serializedNodes = serializeNodes();
            if (currentWorkflowId) {
                await fetch(`/api/workflows/${currentWorkflowId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: workflowName, nodes: serializedNodes, edges })
                });
                showToast('İş akışı güncellendi!', 'success');
            } else {
                const res = await fetch('/api/workflows', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: workflowName, nodes: serializedNodes, edges })
                });
                const data = await res.json();
                setCurrentWorkflowId(data.id);
                showToast('İş akışı kaydedildi!', 'success');
            }
            const wfs = await fetch('/api/workflows').then(r => r.json());
            setSavedWorkflows(wfs);
            setShowSaveDialog(false);
        } catch { showToast('Kaydetme başarısız.', 'error'); }
    };

    const handleLoad = async (wf: SavedWorkflow) => {
        try {
            const parsedNodes = JSON.parse(wf.nodes);
            const parsedEdges = JSON.parse(wf.edges);
            setNodes(deserializeNodes(parsedNodes));
            setEdges(parsedEdges);
            setCurrentWorkflowId(wf.id);
            setWorkflowName(wf.name);
            setResults([]);
            setShowLoadDialog(false);
            showToast(`"${wf.name}" yüklendi.`, 'success');
        } catch { showToast('Yükleme başarısız.', 'error'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu iş akışını silmek istediğinize emin misiniz?')) return;
        await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
        setSavedWorkflows(prev => prev.filter(w => w.id !== id));
        if (currentWorkflowId === id) { setCurrentWorkflowId(null); setWorkflowName(''); }
        showToast('İş akışı silindi.', 'success');
    };

    const loadHistory = async () => {
        if (!currentWorkflowId) { showToast('Önce bir iş akışı kaydedin veya yükleyin.', 'error'); return; }
        const runs = await fetch(`/api/workflows/${currentWorkflowId}/runs`).then(r => r.json());
        setRunHistory(runs);
        setShowHistory(true);
    };

    // ─── RENDER ────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden rounded-2xl">
            {/* Toolbar */}
            <div className="p-3 border-b border-zinc-100 flex items-center gap-2 bg-white z-10 flex-wrap">
                {/* Add Prompt Node */}
                <select
                    onChange={(e) => { if (e.target.value) { addPromptNode(e.target.value); e.target.value = ''; } }}
                    className="text-xs bg-cyan-50 border border-cyan-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-cyan-700 font-medium"
                    value=""
                >
                    <option value="" disabled>+ Prompt Ekle</option>
                    {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>

                {/* Add special nodes */}
                <button onClick={addConditionNode} className="text-xs bg-violet-50 border border-violet-200 text-violet-700 px-2.5 py-1.5 rounded-lg font-medium hover:bg-violet-100 transition-all flex items-center gap-1">
                    <GitBranch size={12} /> Koşul
                </button>
                <button onClick={addTransformNode} className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1.5 rounded-lg font-medium hover:bg-amber-100 transition-all flex items-center gap-1">
                    <ArrowRightLeft size={12} /> Dönüştür
                </button>
                <button onClick={addMergeNode} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1.5 rounded-lg font-medium hover:bg-emerald-100 transition-all flex items-center gap-1">
                    <Combine size={12} /> Birleştir
                </button>

                <div className="h-5 w-px bg-zinc-200 mx-1" />

                {!hasVariables && (
                    <input
                        type="text" value={initialInput} onChange={(e) => setInitialInput(e.target.value)}
                        placeholder="İlk giriş verisi..."
                        className="flex-1 min-w-[150px] px-3 py-1.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    />
                )}

                <button onClick={runWorkflow} disabled={running || nodes.length === 0}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:from-cyan-700 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50 text-xs">
                    {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {running ? 'Çalışıyor...' : 'Başlat'}
                </button>

                <div className="h-5 w-px bg-zinc-200 mx-1" />

                {/* Save */}
                <button onClick={() => { setShowSaveDialog(true); if (!workflowName && currentWorkflowId) { const w = savedWorkflows.find(w => w.id === currentWorkflowId); if (w) setWorkflowName(w.name); } }}
                    className="flex items-center gap-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 py-1.5 rounded-lg font-medium transition-all">
                    <Save size={12} /> Kaydet
                </button>
                {/* Load */}
                <button onClick={() => { fetch('/api/workflows').then(r => r.json()).then(setSavedWorkflows); setShowLoadDialog(true); }}
                    className="flex items-center gap-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 py-1.5 rounded-lg font-medium transition-all">
                    <FolderOpen size={12} /> Yükle
                </button>
                {/* History */}
                <button onClick={loadHistory}
                    className="flex items-center gap-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 py-1.5 rounded-lg font-medium transition-all">
                    <Clock size={12} /> Geçmiş
                </button>
            </div>

            {/* Variable input panel — per node */}
            {selectedNodeId && hasVariablesForSelected && (
                <div className="p-3 border-b border-zinc-100 bg-indigo-50/30">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 bg-cyan-500 text-white rounded-md flex items-center justify-center text-[10px] font-bold">✎</span>
                        <span className="text-xs font-bold text-zinc-700">{selectedNode?.data.label}</span>
                        <span className="text-[10px] text-zinc-400">— değişkenleri doldurun</span>
                        <button onClick={() => setSelectedNodeId(null)} className="ml-auto text-zinc-400 hover:text-zinc-600 text-xs">✕</button>
                    </div>
                    <div className="flex flex-wrap gap-3 items-end">
                        {selectedNodeVars.map(v => (
                            <div key={v} className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                    <span className="text-indigo-400">{'{{'}</span>{v}<span className="text-indigo-400">{'}}'}</span>
                                </label>
                                <input
                                    type="text"
                                    value={variableValues[v] || ''}
                                    onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                                    placeholder={`${v} değerini girin...`}
                                    className="px-3 py-1.5 rounded-lg border border-indigo-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all min-w-[160px]"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Canvas + Results */}
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                {/* React Flow Canvas */}
                <div className="flex-[2] h-full relative bg-slate-50">
                    <ReactFlow
                        nodes={nodes} edges={edges}
                        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
                        onNodeClick={(_e, node) => {
                            if (node.type === 'promptNode' && getNodeVariables(node.id).length > 0) {
                                setSelectedNodeId(node.id);
                            }
                        }}
                        onPaneClick={() => setSelectedNodeId(null)}
                        nodeTypes={nodeTypes} fitView
                    >
                        <Background color="#cbd5e1" gap={16} />
                        <Controls />
                    </ReactFlow>
                    {nodes.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-zinc-400 font-medium bg-white/60 px-5 py-3 rounded-2xl border border-zinc-200 shadow-sm backdrop-blur-sm text-sm text-center max-w-sm">
                                Yukarıdan <strong>Prompt</strong>, <strong>Koşul</strong> veya <strong>Dönüştür</strong> düğümleri ekleyerek iş akışınızı oluşturmaya başlayın.
                            </div>
                        </div>
                    )}

                    {/* Current workflow indicator */}
                    {currentWorkflowId && (
                        <div className="absolute top-3 left-3 text-[10px] bg-white/80 backdrop-blur-sm border border-zinc-200 px-2 py-1 rounded-lg font-medium text-zinc-600 shadow-sm z-10">
                            📂 {workflowName || 'İsimsiz'}
                        </div>
                    )}
                </div>

                {/* Execution Results */}
                {results.length > 0 && (
                    <div className="w-full md:w-[340px] bg-white border-l border-zinc-100 p-4 overflow-y-auto">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 border-b border-zinc-100 pb-2">
                            Çıktı Sonuçları ({results.length} adım)
                        </h3>
                        <div className="space-y-3">
                            {results.map((r, i) => (
                                <div key={i} className={`border rounded-xl overflow-hidden shadow-sm ${r.status === 'error' ? 'border-red-200' : 'border-zinc-200'}`}>
                                    <div className={`px-3 py-1.5 flex items-center justify-between border-b ${r.status === 'error' ? 'bg-red-50 border-red-100' : 'bg-gradient-to-r from-cyan-50 to-blue-50 border-zinc-100'}`}>
                                        <span className="text-[10px] font-bold text-cyan-800 flex items-center gap-1.5">
                                            <span className={`w-4 h-4 ${r.status === 'error' ? 'bg-red-500' : 'bg-cyan-600'} text-white rounded-full flex items-center justify-center text-[9px] shadow-sm`}>{i + 1}</span>
                                            {r.stepLabel}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {r.model && <span className="text-[8px] bg-white border border-zinc-200 text-zinc-500 px-1 py-0.5 rounded font-mono">{r.model}</span>}
                                            {r.time > 0 && <span className="text-[9px] bg-white border border-cyan-100 text-cyan-700 px-1 py-0.5 rounded font-bold">{r.time}ms</span>}
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <div className={`text-[10px] prose prose-xs max-w-none ${r.status === 'error' ? 'text-red-700' : 'text-zinc-800'} bg-slate-50 p-2 rounded border border-slate-100 max-h-32 overflow-y-auto`}>
                                            <ReactMarkdown>{r.output}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Save Dialog ─── */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowSaveDialog(false)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-zinc-900 mb-4">İş Akışını Kaydet</h3>
                        <input type="text" value={workflowName} onChange={e => setWorkflowName(e.target.value)}
                            placeholder="İş akışı adı..." className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500" autoFocus />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowSaveDialog(false)} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 font-medium">İptal</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-medium hover:bg-cyan-700 transition-all">Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Load Dialog ─── */}
            {showLoadDialog && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowLoadDialog(false)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-zinc-900 mb-4">Kaydedilmiş İş Akışları</h3>
                        {savedWorkflows.length === 0 ? (
                            <p className="text-sm text-zinc-400 text-center py-8">Henüz kaydedilmiş iş akışı yok.</p>
                        ) : (
                            <div className="space-y-2">
                                {savedWorkflows.map(wf => (
                                    <div key={wf.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-cyan-300 transition-all group">
                                        <button onClick={() => handleLoad(wf)} className="flex-1 text-left">
                                            <div className="text-sm font-semibold text-zinc-900">{wf.name}</div>
                                            <div className="text-[10px] text-zinc-400">{wf._count?.runs || 0} çalışma · {new Date(wf.updatedAt).toLocaleDateString('tr-TR')}</div>
                                        </button>
                                        <button onClick={() => handleDelete(wf.id)} className="text-zinc-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── History Dialog ─── */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowHistory(false)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-zinc-900 mb-4">Çalışma Geçmişi</h3>
                        {runHistory.length === 0 ? (
                            <p className="text-sm text-zinc-400 text-center py-8">Henüz çalışma geçmişi yok.</p>
                        ) : (
                            <div className="space-y-3">
                                {runHistory.map((run: any) => {
                                    const steps = JSON.parse(run.steps || '[]');
                                    return (
                                        <div key={run.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${run.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {run.status === 'completed' ? '✅ Başarılı' : '❌ Hata'}
                                                </span>
                                                <span className="text-[10px] text-zinc-400">{new Date(run.createdAt).toLocaleString('tr-TR')} · {run.totalTime}ms</span>
                                            </div>
                                            <div className="text-xs text-zinc-500 mb-1">Girdi: <span className="text-zinc-700 font-medium">{run.input.slice(0, 100)}</span></div>
                                            <div className="text-[10px] text-zinc-400">{steps.length} adım çalıştırıldı</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
