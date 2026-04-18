import { useState, useEffect } from 'react'
import { useOrderStore } from '../store/useOrderStore'
import { useOrderRealtime } from '../hooks/useRealtime'
import api from '../lib/api'

const VENUE_ID = '11111111-0000-0000-0000-000000000001'
const EVENT_ID = '66666666-0001-0000-0000-000000000001'

const CATEGORIES = [
  { key: null, label: 'All', icon: '🍽️' },
  { key: 'food', label: 'Food', icon: '🍔' },
  { key: 'drink', label: 'Drinks', icon: '🥤' },
  { key: 'snack', label: 'Snacks', icon: '🍿' },
]

const STATUS_STEPS = ['pending', 'preparing', 'ready', 'collected']
const STATUS_LABELS = { pending: '📝 Placed', preparing: '👨‍🍳 Preparing', ready: '✅ Ready!', collected: '🎉 Collected' }

export default function Order() {
  const { cart, activeOrder, addToCart, removeFromCart, updateQuantity, clearCart, setActiveOrder, deliveryType, setDeliveryType, seatNumber, setSeatNumber } = useOrderStore()
  const [menu, setMenu] = useState([])
  const [category, setCategory] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orderLoading, setOrderLoading] = useState(false)
  const [block, setBlock] = useState('')
  const [row, setRow] = useState('')
  const [seat, setSeat] = useState('')

  useEffect(() => {
    api.get(`/api/orders/menu?venue_id=${VENUE_ID}`).then(r => { setMenu(r.data.menu); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  useOrderRealtime(activeOrder?.id, (updated) => setActiveOrder(updated))

  const filteredMenu = category ? menu.filter(m => m.category === category) : menu
  const total = cart.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)

  const placeOrder = async () => {
    if (cart.length === 0) return
    setOrderLoading(true)
    const seatNum = `${block}-${row}-${seat}`.replace(/^-+|-+$/g, '')
    try {
      const res = await api.post('/api/orders', {
        stand_id: cart[0].stand_id,
        event_id: EVENT_ID,
        delivery_type: deliveryType,
        seat_number: seatNum || null,
        items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity }))
      })
      setActiveOrder(res.data.order)
      clearCart()
      setShowCart(false)
    } catch (err) { console.error(err) }
    setOrderLoading(false)
  }

  if (activeOrder) {
    const currentStep = STATUS_STEPS.indexOf(activeOrder.status)
    return (
      <div className="max-w-xl mx-auto px-6 py-10 space-y-8 animate-fade-in text-center pb-32">
        <h2 className="font-heading text-4xl font-bold tracking-wide text-gray-900">📦 ORDER TRACKER</h2>
        
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order Number</p>
          <p className="font-heading text-6xl text-blue-600 font-bold">{activeOrder.order_number}</p>
          <p className="text-xl font-bold text-gray-700 mt-4">₹{parseFloat(activeOrder.total_amount).toFixed(2)}</p>
          {activeOrder.seat_number && (
            <div className="inline-block bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mt-4 shadow-sm">
              Seat: {activeOrder.seat_number}
            </div>
          )}
        </div>

        <div className="space-y-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50 text-left">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${i <= currentStep ? 'bg-blue-50 border border-blue-100 shadow-sm transform scale-[1.02]' : 'bg-gray-50 border border-transparent'}`}>
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${i <= currentStep ? 'bg-blue-600 text-white shadow-blue-600/30' : 'bg-gray-200 text-gray-400'}`}>
                {i < currentStep ? '✓' : i + 1}
              </span>
              <span className={`font-bold text-base ${i <= currentStep ? 'text-blue-700' : 'text-gray-400'}`}>
                {STATUS_LABELS[step]}
              </span>
              {i === currentStep && <span className="ml-auto flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
              </span>}
            </div>
          ))}
        </div>

        <button onClick={() => setActiveOrder(null)}
          className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold py-4 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all font-heading text-lg">
          ← START NEW ORDER
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 animate-fade-in pb-32">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-4xl font-bold tracking-wide text-gray-900">🍔 STADIUM EATS</h2>
        <button onClick={() => setShowCart(true)}
          className="relative bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all text-sm group flex items-center gap-2">
          <span className="text-xl group-hover:-rotate-12 transition-transform">🛒</span> 
          <span className="font-heading tracking-wider">VIEW CART</span>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce shadow-md">
              {cart.reduce((s,i)=>s+i.quantity,0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {CATEGORIES.map(c => (
          <button key={c.label} onClick={() => setCategory(c.key)}
            className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shadow-sm snap-start flex items-center gap-2 ${category === c.key ? 'bg-gray-900 text-white shadow-gray-900/20 scale-105 border border-gray-900' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
          ><span className="text-xl">{c.icon}</span> <span>{c.label}</span></button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMenu.map(item => {
          const inCart = cart.find(c => c.id === item.id)
          return (
            <div key={item.id} className="bg-white rounded-3xl border border-gray-100 shadow-md shadow-gray-200/50 p-5 hover:shadow-xl hover:border-blue-200 transition-all group overflow-hidden relative">
              <div className="flex justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform">
                    {item.image_url || '🍽️'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg leading-tight pr-12">{item.name}</h4>
                    <p className="text-sm font-medium text-gray-500 mt-1">{item.description}</p>
                    <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md mt-2">{item.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                <p className="font-heading text-2xl font-bold text-gray-900">₹{parseFloat(item.price).toFixed(0)}</p>
                {inCart ? (
                  <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100 shadow-inner">
                    <button onClick={() => updateQuantity(item.id, inCart.quantity - 1)} className="w-8 h-8 rounded-lg bg-white text-gray-700 font-bold shadow-sm hover:text-red-500 transition-colors flex items-center justify-center">−</button>
                    <span className="font-bold w-8 text-center text-gray-900">{inCart.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, inCart.quantity + 1)} className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-colors flex items-center justify-center">+</button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(item)} className="bg-blue-50 border border-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-600/10 active:scale-95 text-sm uppercase tracking-wider">
                    Add to Cart
                  </button>
                )}
              </div>
              {item.concession_stands?.name && <p className="absolute top-4 right-4 text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-lg">📍 {item.concession_stands.name.split(' ')[0]}</p>}
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto animate-slide-left shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md p-6 border-b border-gray-100 flex items-center justify-between z-10">
              <h3 className="font-heading text-3xl font-bold text-gray-900">🛒 YOUR CART</h3>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full flex items-center justify-center transition-colors font-bold text-xl">✕</button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-6 opacity-40">🍱</div>
                  <p className="font-bold text-gray-400 text-xl font-heading tracking-wider">CART IS EMPTY</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 shadow-sm shadow-gray-200/50 rounded-2xl p-4 transition-all hover:border-blue-200">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl bg-gray-50 w-12 h-12 flex items-center justify-center rounded-xl border border-gray-100">{item.image_url}</div>
                          <div>
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <p className="text-sm font-bold text-gray-500">₹{parseFloat(item.price).toFixed(0)} <span className="font-medium text-gray-400">× {item.quantity}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-white text-gray-700 font-bold shadow-sm hover:text-red-500 flex items-center justify-center transition-colors">−</button>
                          <span className="font-bold w-6 text-center text-sm text-gray-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/30 hover:bg-blue-700 flex items-center justify-center transition-colors">+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-sm shadow-gray-200/30">
                    <p className="font-bold text-gray-900 mb-4 text-sm tracking-widest uppercase flex items-center gap-2">
                       <span>💺</span> Delivery Location
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Block</label>
                        <input value={block} onChange={e => setBlock(e.target.value)} placeholder="B"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-center font-bold text-gray-900 placeholder:text-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Row</label>
                        <input value={row} onChange={e => setRow(e.target.value)} placeholder="12"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-center font-bold text-gray-900 placeholder:text-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Seat</label>
                        <input value={seat} onChange={e => setSeat(e.target.value)} placeholder="34"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-center font-bold text-gray-900 placeholder:text-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-sm shadow-gray-200/30">
                    <p className="font-bold text-gray-900 mb-4 text-sm tracking-widest uppercase flex items-center gap-2">
                       <span>📦</span> Fulfillment
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {['pickup', 'delivery'].map(type => (
                        <button key={type} onClick={() => setDeliveryType(type)}
                          className={`py-4 rounded-2xl text-sm font-bold transition-all shadow-sm ${deliveryType === type ? 'bg-blue-600 text-white shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2' : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'}`}>
                          {type === 'pickup' ? '🏃 Pickup' : '🪑 Seat Delivery'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/60 p-6 mt-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
                    <div className="flex justify-between items-end mb-6 pt-2">
                      <span className="font-bold text-gray-400 uppercase tracking-widest text-xs">Amount Due</span>
                      <span className="font-heading text-5xl font-bold text-gray-900">₹{total.toFixed(2)}</span>
                    </div>
                    <button onClick={placeOrder} disabled={orderLoading || cart.length === 0}
                      className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-xl font-heading tracking-wider hover:bg-blue-700 shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 group">
                      {orderLoading ? (
                         <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                           SECURE CHECKOUT
                           <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
