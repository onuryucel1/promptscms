'use client';

import { ChangeEvent, useState } from 'react';
import { Type, FileText, Bot, Tag, X } from 'lucide-react';
import HighlightedTextarea from './HighlightedTextarea';

interface PromptEditorProps {
    title: string;
    content: string;
    systemPrompt?: string;
    tags?: string[];
    onTitleChange: (v: string) => void;
    onContentChange: (v: string) => void;
    onSystemPromptChange?: (v: string) => void;
    onTagsChange?: (tags: string[]) => void;
}

export default function PromptEditor({ title, content, systemPrompt, tags = [], onTitleChange, onContentChange, onSystemPromptChange, onTagsChange }: PromptEditorProps) {
    const [tagInput, setTagInput] = useState('');
    return (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                <h2 className="font-semibold text-zinc-900">Editor</h2>
            </div>

            <div className="p-6 flex flex-col gap-5 flex-1">
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                        <Type size={16} className="text-zinc-400" />
                        Prompt Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => onTitleChange(e.target.value)}
                        placeholder="e.g. Code Review Assistant"
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                    />
                </div>

                {/* Tags */}
                {onTagsChange && (
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                            <Tag size={16} className="text-amber-500" />
                            Etiketler
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2 py-1 rounded-lg border border-amber-200">
                                    {tag}
                                    <button onClick={() => onTagsChange(tags.filter(t => t !== tag))} className="text-amber-400 hover:text-amber-700 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && tagInput.trim()) {
                                    e.preventDefault();
                                    if (!tags.includes(tagInput.trim())) {
                                        onTagsChange([...tags, tagInput.trim()]);
                                    }
                                    setTagInput('');
                                }
                            }}
                            placeholder="Etiket yazıp Enter'a basın..."
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-xs text-zinc-700 placeholder:text-zinc-400"
                        />
                    </div>
                )}

                {/* System Prompt */}
                {onSystemPromptChange && (
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                            <Bot size={16} className="text-violet-500" />
                            Sistem Talimatı
                            <span className="text-[10px] text-zinc-400 font-normal bg-zinc-100 px-1.5 py-0.5 rounded">opsiyonel</span>
                        </label>
                        <textarea
                            value={systemPrompt || ''}
                            onChange={(e) => onSystemPromptChange(e.target.value)}
                            placeholder="AI'a bir rol veya davranış tanımlayın. Örn: 'Sen bir e-ticaret uzmanısın. Yanıtlarını Türkçe ver.'"
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm text-zinc-900 placeholder:text-zinc-400 resize-none"
                        />
                    </div>
                )}

                <div className="flex-1 flex flex-col min-h-[250px]">
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                            <FileText size={16} className="text-zinc-400" />
                            Template Content
                        </label>
                        <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md mb-2">
                            Use {'{{var}}'} for variables
                        </span>
                    </div>
                    <div className="relative flex-1 rounded-xl border border-zinc-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all bg-white min-h-[250px]">
                        <HighlightedTextarea
                            value={content}
                            onChange={onContentChange}
                            placeholder="Write your prompt here... Use {{variable_name}} to add dynamic inputs."
                            className="absolute inset-0 w-full h-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
