'use client';

import { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    variant = 'danger',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: 'text-red-500 bg-red-50',
            button: 'bg-red-600 hover:bg-red-700 text-white',
        },
        warning: {
            icon: 'text-amber-500 bg-amber-50',
            button: 'bg-amber-500 hover:bg-amber-600 text-white',
        },
    };

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
                style={{ animation: 'fadeIn 0.2s ease-out' }}
            />
            {/* Dialog */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-md w-full mx-4 overflow-hidden"
                style={{ animation: 'scaleIn 0.2s ease-out' }}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-xl ${colors[variant].icon}`}>
                            <AlertTriangle size={22} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-zinc-900 mb-1">{title}</h3>
                            <div className="text-sm text-zinc-500 leading-relaxed">{message}</div>
                        </div>
                        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>
                <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm ${colors[variant].button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}} />
        </div>
    );
}
