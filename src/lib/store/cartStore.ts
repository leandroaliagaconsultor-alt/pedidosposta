import { create } from "zustand";

export interface CartItem {
    id: string; // unique ID for this cart entry
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    modifiersText?: string;
}

interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
}

import { persist } from "zustand/middleware";

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
    items: [],
    addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),
    removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
    updateQuantity: (id, quantity) =>
        set((state) => ({
            items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
            ),
        })),
    clearCart: () => set({ items: [] }),
        }),
        { name: "cart-storage" }
    )
);

// Derived selectors (no re-render unless items change)
export const useCartSubtotal = () =>
    useCartStore((state) => state.items.reduce((acc, i) => acc + i.price * i.quantity, 0));
export const useCartTotalItems = () =>
    useCartStore((state) => state.items.reduce((acc, i) => acc + i.quantity, 0));
