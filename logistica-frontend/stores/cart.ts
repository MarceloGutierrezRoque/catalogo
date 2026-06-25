import { create } from "zustand"
import type { Product } from "@/types/api"

export interface CartItem {
  product_id: number
  name: string
  unit_price: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalCents: () => number
}

const CART_STORAGE_KEY = "cart_items"

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

function parsePrice(product: Product): number {
  return Math.round(parseFloat(product.unit_price ?? "0") * 100)
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadCart(),

  addItem: (product, quantity = 1) => {
    const items = get().items
    const existing = items.find((i) => i.product_id === product.id)
    let newItems: CartItem[]
    if (existing) {
      newItems = items.map((i) =>
        i.product_id === product.id
          ? { ...i, quantity: i.quantity + quantity }
          : i,
      )
    } else {
      newItems = [
        ...items,
        {
          product_id: product.id,
          name: product.name,
          unit_price: parsePrice(product),
          quantity,
        },
      ]
    }
    saveCart(newItems)
    set({ items: newItems })
  },

  removeItem: (productId) => {
    const items = get().items.filter((i) => i.product_id !== productId)
    saveCart(items)
    set({ items })
  },

  updateQuantity: (productId, quantity) => {
    if (quantity < 1) return
    const items = get().items.map((i) =>
      i.product_id === productId ? { ...i, quantity } : i,
    )
    saveCart(items)
    set({ items })
  },

  clearCart: () => {
    saveCart([])
    set({ items: [] })
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  totalCents: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
}))
