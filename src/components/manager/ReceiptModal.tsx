"use client";

import { X, Receipt } from "lucide-react";

interface ReceiptModalProps {
    receiptUrl: string;
    onClose: () => void;
}

export function ReceiptModal({ receiptUrl, onClose }: ReceiptModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="relative max-h-[90vh] max-w-lg w-full mx-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Receipt size={16} className="text-amber-400" />
                        Comprobante de Transferencia
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-4 overflow-auto max-h-[calc(90vh-60px)]">
                    {receiptUrl.endsWith(".pdf") ? (
                        <iframe src={receiptUrl} className="w-full h-[70vh] rounded-lg" />
                    ) : (
                        <img src={receiptUrl} alt="Comprobante" className="w-full rounded-lg object-contain" />
                    )}
                </div>
                <div className="border-t border-zinc-800 px-5 py-3">
                    <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/10 py-2.5 text-xs font-bold text-amber-400 ring-1 ring-inset ring-amber-500/20 transition hover:bg-amber-500/20"
                    >
                        Abrir en nueva pestaña
                    </a>
                </div>
            </div>
        </div>
    );
}
