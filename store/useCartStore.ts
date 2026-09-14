import { create } from 'zustand'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: any) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  subtotal: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find(item => item.productId === product.id)
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return {
            items: state.items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          }
        }
        return state // Cannot exceed stock
      }
      return {
        items: [...state.items, {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stock: product.stock
        }]
      }
    })
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter(item => item.productId !== productId)
    }))
  },
  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map(item => {
        if (item.productId === productId) {
          const newQty = Math.max(1, Math.min(quantity, item.stock))
          return { ...item, quantity: newQty }
        }
        return item
      })
    }))
  },
  clearCart: () => set({ items: [] }),
  subtotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }
}))
