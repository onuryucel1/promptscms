'use client';

import { ChangeEvent, useRef } from 'react';

interface HighlightedTextareaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function HighlightedTextarea({ value, onChange, placeholder, className = '' }: HighlightedTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    const renderHighlightedText = () => {
        if (!value) {
            return <span className="text-zinc-400 pointer-events-none">{placeholder}</span>;
        }

        // Split by {{...}}
        const parts = value.split(/(\{\{[^}]+\}\})/g);
        return parts.map((part, i) => {
            if (part.startsWith('{{') && part.endsWith('}}')) {
                return (
                    <span key={i} className="bg-blue-100 text-blue-700 rounded-md px-1 py-0.5 -mx-1 font-semibold whitespace-pre-wrap break-words">
                        {part}
                    </span>
                );
            }
            return <span key={i} className="whitespace-pre-wrap break-words">{part}</span>;
        });
    };

    return (
        <div className={`relative flex flex-col ${className}`}>
            <div
                ref={backdropRef}
                className="absolute inset-0 px-4 py-4 font-mono text-sm overflow-auto pointer-events-none text-zinc-800 break-words whitespace-pre-wrap"
                aria-hidden="true"
            >
                {renderHighlightedText()}
                {/* Extra space at the bottom to match textarea scrolling behavior */}
                <br />
            </div>

            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
                onScroll={handleScroll}
                spellCheck="false"
                className="absolute inset-0 w-full h-full px-4 py-4 font-mono text-sm resize-none bg-transparent text-transparent caret-zinc-900 outline-none m-0 border-none ring-0 overflow-auto"
            />
        </div>
    );
}
