'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileDown, CheckCircle2, XCircle, PlaySquare, Download, Save, Loader2 } from 'lucide-react';
import { usePromptStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import ReactMarkdown from 'react-markdown';

interface BatchTesterProps {
    promptId: string;
    content: string;
    systemPrompt?: string;
}

interface TestRow {
    id: string;
    data: Record<string, string>;
    output: string;
    aiResponse?: string;
    isTesting?: boolean;
    isToxic?: boolean;
    ratings: Record<string, number>;
    tokens?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    responseTime?: number;
    status: 'pending' | 'success' | 'fail';
}

export default function BatchTester({ promptId, content, systemPrompt }: BatchTesterProps) {
    const { openAiKey, selectedModel, saveEvaluationBatch } = usePromptStore();
    const { showToast } = useToast();
    const [rows, setRows] = useState<TestRow[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [criteria, setCriteria] = useState<string[]>(['Tüketici Güven Algısı', 'Satın Alma Niyeti']);
    const [newCriterion, setNewCriterion] = useState('');
    const [testProgress, setTestProgress] = useState<{ current: number; total: number } | null>(null);
    const [isSavingBatch, setIsSavingBatch] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedData = results.data as Record<string, string>[];

                const newRows: TestRow[] = parsedData.map((row, idx) => {
                    let finalOutput = content;
                    // Extract variables enclosed in {{...}}
                    const extractedVars = Array.from(new Set(
                        Array.from(content.matchAll(/{{([^}]+)}}/g)).map(m => m[1].trim())
                    ));

                    extractedVars.forEach(v => {
                        const regex = new RegExp(`{{${v}}}`, 'g');
                        // use row[v] if available, otherwise leave it or use empty
                        finalOutput = finalOutput.replace(regex, row[v] || `{{${v}}}`);
                    });

                    return {
                        id: `row-${idx}`,
                        data: row,
                        output: finalOutput,
                        ratings: {},
                        status: 'pending'
                    };
                });

                setRows(newRows);
                showToast(`${newRows.length} satır başarıyla yüklendi!`, 'success');
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
                showToast('CSV dosyası işlenemedi.', 'error');
            }
        });
    };

    const updateRowRating = (id: string, criterion: string, rating: number) => {
        setRows(prev => prev.map(r => r.id === id ? {
            ...r,
            ratings: { ...r.ratings, [criterion]: rating }
        } : r));
    };

    const handleClear = () => {
        setRows([]);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleExport = () => {
        if (rows.length === 0) return;

        const exportData = rows.map(row => {
            const baseRow = { ...row.data };
            baseRow['Generated_Prompt'] = row.output;
            baseRow['AI_Response'] = row.aiResponse || '';

            // Add dynamic criteria columns
            criteria.forEach(c => {
                baseRow[`Rating_${c}`] = row.ratings[c] ? row.ratings[c].toString() : '';
            });

            baseRow['Safety_Violation'] = row.isToxic ? 'Yes' : 'No';
            return baseRow;
        });

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName ? `results-${fileName}` : "prompt-results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Sonuçlar CSV olarak indirildi!', 'success');
    };

    const handleTestRow = async (id: string, prompt: string) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, isTesting: true } : r));
        const startTime = performance.now();
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, apiKey: openAiKey, systemPrompt, model: selectedModel })
            });
            const elapsed = Math.round(performance.now() - startTime);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to generate');

            setRows(prev => prev.map(r => r.id === id ? {
                ...r,
                isTesting: false,
                aiResponse: data.result,
                isToxic: data.isToxic,
                tokens: data.usage || undefined,
                responseTime: elapsed,
            } : r));

        } catch (error: any) {
            const elapsed = Math.round(performance.now() - startTime);
            console.error(error);
            setRows(prev => prev.map(r => r.id === id ? { ...r, isTesting: false, aiResponse: `Error: ${error.message}`, responseTime: elapsed } : r));
        }
    };

    const handleTestAll = async () => {
        const pendingRows = rows.filter(r => !r.aiResponse && !r.isTesting);
        const total = pendingRows.length;
        if (total === 0) return;
        setTestProgress({ current: 0, total });
        let completed = 0;
        for (const row of pendingRows) {
            await handleTestRow(row.id, row.output);
            completed++;
            setTestProgress({ current: completed, total });
        }
        showToast(`${total} test tamamlandı!`, 'success');
        setTimeout(() => setTestProgress(null), 2000);
    };

    const handleSaveBatchResults = async () => {
        const completedRows = rows.filter(r => r.aiResponse);
        if (completedRows.length === 0) return;
        setIsSavingBatch(true);
        try {
            const resultsToSave = completedRows.map(r => ({
                input: r.output,
                output: r.output,
                aiResponse: r.aiResponse as string,
                tokens: r.tokens?.total_tokens,
                promptTokens: r.tokens?.prompt_tokens,
                completionTokens: r.tokens?.completion_tokens,
                responseTime: r.responseTime,
                isToxic: r.isToxic || false,
                ratings: r.ratings
            }));
            await saveEvaluationBatch(promptId, fileName || 'Toplu Test', criteria, resultsToSave);
            showToast('Toplu test sonuçları başarıyla kaydedildi!', 'success');
        } catch (error) {
            showToast('Kaydedilirken hata oluştu.', 'error');
        } finally {
            setIsSavingBatch(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col h-full mt-6">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PlaySquare size={18} className="text-orange-500" />
                    <h2 className="font-semibold text-zinc-900">Batch CSV Tester</h2>
                    {testProgress && (
                        <span className="text-xs text-zinc-500 font-medium ml-2">
                            {testProgress.current} / {testProgress.total} tamamlandı
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {rows.length > 0 && (
                        <>
                            <button
                                onClick={handleTestAll}
                                className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                            >
                                <PlaySquare size={14} />
                                Run All Tests
                            </button>
                            <button
                                onClick={handleExport}
                                className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                            >
                                <Download size={14} />
                                Export
                            </button>
                            {rows.some(r => r.aiResponse) && (
                                <button
                                    onClick={handleSaveBatchResults}
                                    disabled={isSavingBatch}
                                    className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {isSavingBatch ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {isSavingBatch ? 'Kaydediliyor...' : 'Sonuçları Kaydet'}
                                </button>
                            )}
                        </>
                    )}
                    {fileName && (
                        <button
                            onClick={handleClear}
                            className="text-xs text-zinc-500 hover:text-red-500 transition-all font-medium px-2"
                        >
                            Clear Data
                        </button>
                    )}
                    <div>
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg font-medium transition-all"
                        >
                            <Upload size={14} />
                            {fileName ? 'Upload New CSV' : 'Upload CSV'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {testProgress && (
                <div className="h-1.5 bg-zinc-100 w-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 ease-out rounded-r-full"
                        style={{ width: `${(testProgress.current / testProgress.total) * 100}%` }}
                    />
                </div>
            )}

            {/* Dynamic Criteria Manager */}
            <div className="bg-white border-b border-zinc-200 p-4 shrink-0 flex flex-col gap-3">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Değerlendirme Kriterleri</div>
                <div className="flex flex-wrap gap-2 items-center">
                    {criteria.map((c, idx) => (
                        <div key={idx} className="bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs px-2 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm">
                            <span className="font-medium">{c}</span>
                            <button
                                onClick={() => setCriteria(prev => prev.filter((_, i) => i !== idx))}
                                className="text-zinc-400 hover:text-red-500 transition-colors"
                            >
                                <XCircle size={14} />
                            </button>
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                        <input
                            type="text"
                            value={newCriterion}
                            onChange={(e) => setNewCriterion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newCriterion.trim()) {
                                    if (!criteria.includes(newCriterion.trim())) {
                                        setCriteria(prev => [...prev, newCriterion.trim()]);
                                    }
                                    setNewCriterion('');
                                }
                            }}
                            placeholder="Yeni Kriter Ekle..."
                            className="bg-white border border-zinc-200 rounded-md text-sm px-3 py-1.5 w-48 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all placeholder:text-zinc-400"
                        />
                        <button
                            onClick={() => {
                                if (newCriterion.trim() && !criteria.includes(newCriterion.trim())) {
                                    setCriteria(prev => [...prev, newCriterion.trim()]);
                                    setNewCriterion('');
                                }
                            }}
                            className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-200 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                        >
                            Ekle
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-0 overflow-x-auto">
                {rows.length === 0 ? (
                    <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
                            <FileDown size={24} className="text-zinc-300" />
                        </div>
                        <p className="text-sm font-medium text-zinc-600 mb-1">No data to test</p>
                        <p className="text-xs text-zinc-400 max-w-sm">Upload a CSV file containing columns that match your prompt variables (e.g. "degisken_adi").</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-zinc-600">
                        <thead className="bg-zinc-50/50 text-xs uppercase text-zinc-500 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold w-1/5">Variables</th>
                                <th className="px-6 py-3 font-semibold w-1/5">Prompt</th>
                                <th className="px-6 py-3 font-semibold w-[35%]">AI Response</th>
                                <th className="px-4 py-3 font-semibold w-[25%] text-center">Evaluation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {rows.map((row) => (
                                <tr key={row.id} className={`transition-colors ${row.isToxic ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-zinc-50/50'}`}>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                            {Object.entries(row.data).map(([key, val]) => (
                                                <div key={key} className="text-xs">
                                                    <span className="font-mono font-medium text-zinc-700">{key}:</span>{' '}
                                                    <span className="text-zinc-500 break-words">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="font-mono text-xs bg-zinc-950 text-zinc-200 p-3 rounded-lg whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                                            {row.output}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className={`text-xs border p-3 rounded-lg whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar relative ${row.isToxic
                                            ? 'bg-red-50/80 border-red-200 text-red-900'
                                            : 'bg-white border-zinc-200 text-zinc-800'
                                            }`}>
                                            {row.isTesting ? (
                                                <div className="flex items-center gap-2 text-indigo-500 animate-pulse">
                                                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                                                    Generating...
                                                </div>
                                            ) : row.aiResponse ? (
                                                <>
                                                    {row.isToxic && (
                                                        <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-100/80 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">
                                                            <XCircle size={12} />
                                                            Güvenlik İhlali
                                                        </div>
                                                    )}
                                                    <div className={`prose prose-xs max-w-none ${row.isToxic ? 'text-red-800' : ''}`}>
                                                        <ReactMarkdown>{row.aiResponse}</ReactMarkdown>
                                                    </div>
                                                    {/* Token & Time Badges */}
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        {row.tokens && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium" title={`Input: ${row.tokens.prompt_tokens} | Output: ${row.tokens.completion_tokens}`}>
                                                                🪙 {row.tokens.total_tokens} (IN: {row.tokens.prompt_tokens}, OUT: {row.tokens.completion_tokens})
                                                            </span>
                                                        )}
                                                        {row.responseTime !== undefined && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">
                                                                ⏱ {row.responseTime}ms
                                                            </span>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-zinc-400 italic">No response yet.</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex flex-col items-center justify-start gap-4 h-full pt-1">
                                            {!row.aiResponse && !row.isTesting ? (
                                                <button
                                                    onClick={() => handleTestRow(row.id, row.output)}
                                                    className="w-full justify-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                                >
                                                    <PlaySquare size={14} />
                                                    Test
                                                </button>
                                            ) : row.aiResponse ? (
                                                <div className="w-full space-y-3 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                                                    {criteria.length === 0 ? (
                                                        <div className="text-zinc-400 text-[10px] text-center italic">Değerlendirme kriteri eklenmedi.</div>
                                                    ) : (
                                                        criteria.map((criterion, idx) => (
                                                            <div key={idx} className="flex flex-col gap-2">
                                                                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-center">{criterion}</span>
                                                                <div className="flex justify-center gap-1">
                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                        <button
                                                                            key={`${criterion}-${star}`}
                                                                            onClick={() => updateRowRating(row.id, criterion, star)}
                                                                            className={`p-1 rounded-md transition-all ${(row.ratings[criterion] || 0) >= star
                                                                                ? 'text-yellow-400 hover:text-yellow-500 scale-110'
                                                                                : 'text-zinc-300 hover:text-yellow-200'
                                                                                }`}
                                                                        >
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                            </svg>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                {idx < criteria.length - 1 && <div className="h-px bg-zinc-200 w-full mt-1" />}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Score Summary Panel */}
            {rows.length > 0 && rows.some(r => r.aiResponse) && (
                <div className="p-4 border-t border-zinc-200 bg-zinc-50/50">
                    <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Sonuç Özeti</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-xl border border-zinc-200 p-3 text-center">
                            <div className="text-lg font-bold text-zinc-900">{rows.filter(r => r.aiResponse).length} / {rows.length}</div>
                            <div className="text-[10px] text-zinc-500 font-medium">Test Tamamlandı</div>
                        </div>
                        <div className="bg-white rounded-xl border border-zinc-200 p-3 text-center">
                            <div className="text-lg font-bold text-red-600">{rows.filter(r => r.isToxic).length}</div>
                            <div className="text-[10px] text-zinc-500 font-medium">Güvenlik İhlali</div>
                        </div>
                        {criteria.map(c => {
                            const rated = rows.filter(r => r.ratings[c] > 0);
                            const avg = rated.length > 0 ? (rated.reduce((s, r) => s + r.ratings[c], 0) / rated.length).toFixed(1) : '-';
                            return (
                                <div key={c} className="bg-white rounded-xl border border-zinc-200 p-3 text-center">
                                    <div className="text-lg font-bold text-amber-600">{avg} <span className="text-xs text-zinc-400">/ 5</span></div>
                                    <div className="text-[10px] text-zinc-500 font-medium truncate" title={c}>{c}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Helper styles for custom scrollbar embedded for simplicity */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #d4d4d8;
          border-radius: 10px;
        }
      `}} />
        </div>
    );
}
