-- ── Habilitar RLS en las tablas (si no estaba habilitado) ──
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ── Políticas para CATEGORIES ──

-- SELECT: Todo el mundo puede ver las categorías (Storefront público)
CREATE POLICY "Public categories are viewable by everyone" ON public.categories
FOR SELECT USING (true);

-- INSERT: Solo un usuario autenticado y perteneciente al mismo tenant_id en tenant_users
CREATE POLICY "Users can insert categories to their tenants" ON public.categories
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users WHERE tenant_users.tenant_id = categories.tenant_id
  )
);

-- UPDATE: Solo un usuario autenticado y perteneciente al mismo tenant_id
CREATE POLICY "Users can update their own categories" ON public.categories
FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users WHERE tenant_users.tenant_id = categories.tenant_id
  )
);

-- DELETE: Solo un usuario autenticado y perteneciente al mismo tenant_id
CREATE POLICY "Users can delete their own categories" ON public.categories
FOR DELETE USING (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users WHERE tenant_users.tenant_id = categories.tenant_id
  )
);


-- ── Políticas para PRODUCTS ──

-- SELECT: Todo el mundo puede ver los productos (Storefront público)
CREATE POLICY "Public products are viewable by everyone" ON public.products
FOR SELECT USING (true);

-- INSERT: Solo un usuario autenticado y perteneciente al mismo tenant_id
CREATE POLICY "Users can insert products to their tenants" ON public.products
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users WHERE tenant_users.tenant_id = products.tenant_id
  )
);

-- UPDATE: Solo un usuario autenticado y perteneciente al mismo tenant_id
CREATE POLICY "Users can update their own products" ON public.products
FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users WHERE tenant_users.tenant_id = products.tenant_id
  )
);

-- DELETE: Solo un usuario autenticado y perteneciente al mismo tenant_id
CREATE POLICY "Users can delete their own products" ON public.products
FOR DELETE USING (
  auth.uid() IN (
    SELECT user_id FROM public.tenant_users WHERE tenant_users.tenant_id = products.tenant_id
  )
);
