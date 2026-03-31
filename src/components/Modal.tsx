import { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`bg-slate-800 rounded-xl border border-slate-700 w-full ${maxWidth} shadow-2xl overflow-hidden flex flex-col`}>
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>
    );
}
