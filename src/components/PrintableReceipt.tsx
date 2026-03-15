import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PrintableReceiptProps {
    order: any;
    tenant: any;
    type: 'kitchen' | 'delivery';
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ order, tenant, type }) => {
    const isKitchen = type === 'kitchen';
    const shortId = order.id.split('-')[0].toUpperCase();

    return (
        <div className="printable-receipt font-mono text-black bg-white w-full max-w-[80mm] mx-auto text-sm p-4 leading-tight">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media screen {
                    .printable-receipt { display: none; }
                }
                @media print {
                    @page { margin: 0; size: auto; }
                    body * { visibility: hidden; }
                    .printable-receipt, .printable-receipt * { visibility: visible; }
                    .printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: block !important;
                    }
                    nav, sidebar, header, footer, button { display: none !important; }
                }
            `}} />

            <div className="text-center space-y-1 mb-4 border-b border-dashed border-black pb-2">
                {!isKitchen && (
                    <h1 className="text-xl font-black uppercase tracking-tighter">{tenant.name}</h1>
                )}
                <h2 className="text-lg font-bold">
                    {isKitchen ? 'COMANDA' : 'TICKET'} #{order.order_number || shortId}
                </h2>
                <p className="text-[10px]">
                    {format(new Date(), "dd/MM/yyyy HH:mm'hs'", { locale: es })}
                </p>
                {isKitchen && order.delivery_method && (
                    <p className="text-xs font-black border border-black inline-block px-2 py-0.5 mt-1">
                        {order.delivery_method === 'DELIVERY' ? 'PARA ENVÍO' : 'PARA RETIRAR'}
                    </p>
                )}
            </div>

            {!isKitchen && (
                <div className="mb-4 space-y-0.5 border-b border-dashed border-black pb-2">
                    <p><strong>Cliente:</strong> {order.first_name} {order.last_name}</p>
                    <p><strong>Tel:</strong> {order.customer_phone}</p>
                    {order.delivery_method === 'DELIVERY' && (
                        <>
                            <p><strong>Dirección:</strong> {order.customer_address}</p>
                            {order.cross_streets && <p className="text-[10px]">Esq: {order.cross_streets}</p>}
                        </>
                    )}
                    {order.customer_notes && (
                        <p className="italic text-[10px]">Nota: {order.customer_notes}</p>
                    )}
                </div>
            )}

            <div className="space-y-3 mb-4">
                <div className="grid grid-cols-12 font-bold border-b border-black pb-1 mb-1">
                    <div className="col-span-2">Cant</div>
                    <div className={isKitchen ? "col-span-10" : "col-span-7"}>Producto</div>
                    {!isKitchen && <div className="col-span-3 text-right">Total</div>}
                </div>
                {order.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 gap-x-1 items-start">
                        <div className="col-span-2 font-black">{item.quantity}x</div>
                        <div className={isKitchen ? "col-span-10" : "col-span-7"}>
                            <span className="font-bold uppercase">{item.product?.name}</span>
                            {item.notes && <p className="text-[10px] italic ml-2">- {item.notes}</p>}
                        </div>
                        {!isKitchen && (
                            <div className="col-span-3 text-right font-mono">
                                ${(item.total_price || (item.unit_price * item.quantity)).toLocaleString('es-AR')}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isKitchen && order.internal_notes && (
                <div className="mt-4 p-2 border-2 border-black">
                    <p className="text-[10px] font-bold uppercase mb-1">Notas Internas / Ajustes:</p>
                    <p className="text-xs font-black uppercase">{order.internal_notes}</p>
                </div>
            )}

            {!isKitchen && (
                <div className="space-y-1 border-t border-dashed border-black pt-2">
                    <div className="flex justify-between text-[10px]">
                        <span>Subtotal:</span>
                        <span>${(order.total_amount - (order.delivery_fee || 0) - (order.extra_charge || 0)).toLocaleString('es-AR')}</span>
                    </div>
                    {order.delivery_fee > 0 && (
                        <div className="flex justify-between text-[10px]">
                            <span>Envío:</span>
                            <span>${order.delivery_fee.toLocaleString('es-AR')}</span>
                        </div>
                    )}
                    {order.extra_charge > 0 && (
                        <div className="flex justify-between text-[10px]">
                            <span>Ajuste extra:</span>
                            <span>+${order.extra_charge}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-base font-black border-t border-black pt-1 mt-1">
                        <span>TOTAL:</span>
                        <span>${order.total_amount.toLocaleString('es-AR')}</span>
                    </div>
                    <p className="mt-2 text-center font-bold border border-black p-1 uppercase">
                        Pago: {order.payment_method}
                    </p>
                </div>
            )}

            <div className="mt-6 text-center text-[10px]">
                <p>¡Gracias por tu compra!</p>
                <p>pedidoposta.com</p>
            </div>
        </div>
    );
};
