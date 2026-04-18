import { create } from 'zustand'

export const useOrderStore = create((set, get) => ({
  cart: [],
  activeOrder: null,
  orderHistory: [],
  selectedStand: null,
  deliveryType: 'pickup',
  seatNumber: '',

  addToCart: (item) => set((state) => {
    const existing = state.cart.find(i => i.id === item.id)
    if (existing) {
      return { cart: state.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) }
    }
    return { cart: [...state.cart, { ...item, quantity: 1 }] }
  }),

  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter(i => i.id !== itemId)
  })),

  updateQuantity: (itemId, qty) => set((state) => ({
    cart: qty > 0
      ? state.cart.map(i => i.id === itemId ? { ...i, quantity: qty } : i)
      : state.cart.filter(i => i.id !== itemId)
  })),

  clearCart: () => set({ cart: [] }),
  setActiveOrder: (order) => set({ activeOrder: order }),
  setOrderHistory: (orders) => set({ orderHistory: orders }),
  setSelectedStand: (stand) => set({ selectedStand: stand }),
  setDeliveryType: (type) => set({ deliveryType: type }),
  setSeatNumber: (seat) => set({ seatNumber: seat }),

  getTotal: () => {
    const { cart } = get()
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
  }
}))
