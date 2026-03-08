-- ── Crear tabla pivot faltante si no existía (product_modifiers) ──
CREATE TABLE IF NOT EXISTS public.product_modifiers (
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    modifier_id UUID REFERENCES public.modifiers(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, modifier_id)
);
