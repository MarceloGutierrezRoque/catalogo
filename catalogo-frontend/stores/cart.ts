import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  plushie_id: number;
  name: string;
  price: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (plushieId: number) => void;
  updateQuantity: (plushieId: number, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        const existing = items.find((i) => i.plushie_id === item.plushie_id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.plushie_id === item.plushie_id
                ? { ...i, quantity: Math.min(i.quantity + (item.quantity ?? 1), 1000) }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { ...item, quantity: item.quantity ?? 1 }],
          });
        }
      },

      removeItem: (plushieId) => {
        set({ items: get().items.filter((i) => i.plushie_id !== plushieId) });
      },

      updateQuantity: (plushieId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(plushieId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.plushie_id === plushieId
              ? { ...i, quantity: Math.min(quantity, 1000) }
              : i
          ),
        });
      },

      clear: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);
