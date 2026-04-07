"use client";

import { useState } from "react";
import { X, Edit3, Loader2 } from "lucide-react";

interface AdjustmentOrder {
    id: string;
    order_number: number;
    total_amount: number;
    extra_charge?: number;
    internal_notes?: string | null;
}

interface AdjustmentModalProps {
    order: AdjustmentOrder;
    onClose: () => void;
    onSave: (orderId: string, extraCharge: number, notes: string, newTotal: number) => Promise<boolean>;
}

export function AdjustmentModal({ order, onClose, onSave }: AdjustmentModalProps) {
    const [extraChargeAmount, setExtraChargeAmount] = useState(order.extra_charge?.toString() || "");
    const [notes, setNotes] = useState(order.internal_notes || "");
    const [isSaving, setIsSaving] = useState(false);

    const originalTotal = order.total_amount - (order.extra_charge || 0);
    const extraCharge = parseFloat(extraChargeAmount) || 0;
    const newTotal = originalTotal + extraCharge;

    const handleSubmit = async () => {
        setIsSaving(true);
        const success = await onSave(order.id, extraCharge, notes, newTotal);
        if (!success) setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-md mx-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Edit3 size={18} className="text-primary" />
                        Ajustar Pedido #{order.order_number}
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="rounded-xl bg-zinc-900/50 p-4 border border-zinc-800 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Pedido original</span>
                            <span className="text-sm font-bold text-zinc-300 font-mono">
                                ${originalTotal.toLocaleString("es-AR")}
                            </span>
                        </div>
                        {extraCharge > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-amber-500 uppercase tracking-widest">+ Recargo</span>
                                <span className="text-sm font-bold text-amber-400 font-mono">
                                    + ${extraCharge.toLocaleString("es-AR")}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Monto extra a sumar ($)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={extraChargeAmount}
                                onChange={(e) => setExtraChargeAmount(e.target.value)}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Detalle o Motivos (Interno)</label>
                            <textarea
                                placeholder="Ej: +1 Papas grandes pedidas por WhatsApp"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-sm"
                            />
                        </div>

                        <div className="pt-2">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-bold text-zinc-300">NUEVO TOTAL:</span>
                                <span className="text-2xl font-black text-primary font-mono scale-110">
                                    ${newTotal.toLocaleString("es-AR")}
                                </span>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="w-full py-4 rounded-xl bg-primary text-[#09090b] font-black uppercase tracking-widest shadow-[0_4px_14px_0_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={18} className="animate-spin" /> Guardando...
                                    </span>
                                ) : "Confirmar Ajuste"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
