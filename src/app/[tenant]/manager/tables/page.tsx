"use client";

import React, { useState, use, useRef } from "react";
import { QrCode, Plus, Minus, Download, Printer, ExternalLink } from "lucide-react";

export default function TablesPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = use(params);
    const [tableCount, setTableCount] = useState(10);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://pedidosposta.vercel.app";

    const tables = Array.from({ length: tableCount }, (_, i) => ({
        number: i + 1,
        url: `${baseUrl}/${tenant}?mesa=${i + 1}`,
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${baseUrl}/${tenant}?mesa=${i + 1}`)}`,
    }));

    const downloadQR = (table: typeof tables[0]) => {
        const link = document.createElement("a");
        link.href = table.qrUrl;
        link.download = `mesa-${table.number}-${tenant}.png`;
        link.click();
    };

    const printAll = () => {
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.write(`
            <html><head><title>QRs - ${tenant}</title>
            <style>
                body { font-family: Arial, sans-serif; }
                .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
                .card { text-align: center; border: 1px solid #ddd; border-radius: 12px; padding: 16px; page-break-inside: avoid; }
                .card img { width: 180px; height: 180px; }
                .card h3 { margin: 8px 0 4px; font-size: 18px; }
                .card p { font-size: 10px; color: #666; word-break: break-all; }
                @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
            </style></head><body>
            <div class="grid">
                ${tables.map(t => `
                    <div class="card">
                        <img src="${t.qrUrl}" alt="Mesa ${t.number}" />
                        <h3>Mesa ${t.number}</h3>
                        <p>${t.url}</p>
                    </div>
                `).join("")}
            </div>
            <script>setTimeout(() => window.print(), 1000);</script>
            </body></html>
        `);
        w.document.close();
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        QR <span className="text-primary">Mesas</span>
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Generá códigos QR para que tus clientes pidan desde la mesa.
                    </p>
                </div>
                <button onClick={printAll} className="inline-flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl hover:brightness-110 transition shrink-0">
                    <Printer size={16} /> Imprimir Todos
                </button>
            </div>

            {/* Table count */}
            <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <p className="text-sm font-bold text-white">Cantidad de mesas:</p>
                <div className="flex items-center gap-2">
                    <button onClick={() => setTableCount(Math.max(1, tableCount - 1))} className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 transition">
                        <Minus size={14} />
                    </button>
                    <span className="text-xl font-black text-white w-10 text-center">{tableCount}</span>
                    <button onClick={() => setTableCount(Math.min(50, tableCount + 1))} className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 transition">
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* QR Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tables.map(table => (
                    <div key={table.number} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-center group hover:border-primary/30 transition">
                        <div className="bg-white rounded-xl p-3 mb-3 inline-block">
                            <img src={table.qrUrl} alt={`Mesa ${table.number}`} className="w-32 h-32 sm:w-36 sm:h-36" loading="lazy" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Mesa {table.number}</h3>
                        <p className="text-[9px] text-zinc-600 font-mono truncate mb-3">{table.url}</p>
                        <div className="flex gap-2">
                            <button onClick={() => downloadQR(table)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-bold hover:bg-zinc-700 hover:text-white transition">
                                <Download size={12} /> Descargar
                            </button>
                            <a href={table.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition">
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info */}
            <div className="mt-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><QrCode size={16} className="text-primary" /> ¿Cómo funciona?</h3>
                <ul className="space-y-1.5 text-xs text-zinc-400">
                    <li>1. Imprimí los QR y ponelos en cada mesa de tu local.</li>
                    <li>2. El cliente escanea con su celular y ve tu menú directamente.</li>
                    <li>3. Hace su pedido y te llega con el número de mesa indicado.</li>
                    <li>4. Sin app, sin descarga, sin complicaciones.</li>
                </ul>
            </div>
        </div>
    );
}
