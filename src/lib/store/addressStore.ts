import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedAddress {
    street: string;
    streetNumber?: string; // legacy — merged into street for new saves
    apartment?: string;
    betweenStreets: string;
    deliveryNotes?: string;
    coords?: { lat: number; lng: number };
    savedAt: number; // timestamp
}

interface AddressState {
    /** Map de tenant slug → última dirección usada */
    addresses: Record<string, SavedAddress>;
    saveAddress: (tenantSlug: string, address: SavedAddress) => void;
    getAddress: (tenantSlug: string) => SavedAddress | null;
    clearAddress: (tenantSlug: string) => void;
}

export const useAddressStore = create<AddressState>()(
    persist(
        (set, get) => ({
            addresses: {},
            saveAddress: (tenantSlug, address) =>
                set((state) => ({
                    addresses: { ...state.addresses, [tenantSlug]: address },
                })),
            getAddress: (tenantSlug) => get().addresses[tenantSlug] ?? null,
            clearAddress: (tenantSlug) =>
                set((state) => {
                    const { [tenantSlug]: _, ...rest } = state.addresses;
                    return { addresses: rest };
                }),
        }),
        { name: "saved-addresses" }
    )
);
