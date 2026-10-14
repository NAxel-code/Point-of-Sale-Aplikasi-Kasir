import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
  imageUrl?: string
  note?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (product: any, note?: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateNote: (productId: string, note: string) => void
  clearCart: () => void
  subtotal: () => number
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, note) => {
        set((state) => {
          const existingItem = state.items.find(item => item.productId === product.id)
          if (existingItem) {
            if (existingItem.quantity < product.stock) {
              return {
                items: state.items.map(item =>
                  item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1, ...(note ? { note } : {}) }
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
              stock: product.stock,
              imageUrl: product.imageUrl,
              note: note || undefined,
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
      updateNote: (productId, note) => {
        set((state) => ({
          items: state.items.map(item =>
            item.productId === productId
              ? { ...item, note: note.trim() || undefined }
              : item
          )
        }))
      },
      clearCart: () => set({ items: [] }),
      subtotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      }
    }),
    {
      name: 'mrcoffee-pos-cart',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : noopStorage)),
    }
  )
)
