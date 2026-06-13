import Products from './Products'
import Orders from './Orders'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

const StatCard = ({ title, value, sub, color }) => (
  <div style={{
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    flex: 1,
    minWidth: '140px',
    borderLeft: `4px solid ${color}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  }}>
    <p style={{ color: '#6B7280', fontSize: '12px', margin: '0 0 6px' }}>{title}</p>
    <p style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>{value}</p>
    <p style={{ color: color, fontSize: '11px', margin: '0' }}>{sub}</p>
  </div>
)

const MpesaModal = ({ total, onClose, onConfirm }) => {
  const [phone, setPhone] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px', boxSizing: 'border-box' }}>
        <h3 style={{ color: '#0A1F44', fontSize: '18px', fontWeight: '700', margin: '0 0 6px' }}>M-Pesa Payment</h3>
        <p style={{ color: '#F5A623', fontSize: '16px', fontWeight: '700', margin: '0 0 20px' }}>Total: KES {total.toLocaleString()}</p>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Customer Phone Number</label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="e.g. 0712345678"
          type="tel"
          inputMode="numeric"
          autoFocus
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '8px',
            border: '2px solid #0A1F44',
            fontSize: '20px',
            marginBottom: '16px',
            boxSizing: 'border-box',
            letterSpacing: '2px',
            minHeight: '60px',
            display: 'block',
            outline: 'none',
          }}
        />
        <button onClick={() => { if (phone) onConfirm(phone) }} style={{ width: '100%', backgroundColor: '#0A1F44', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px' }}>
          Send M-Pesa Request
        </button>
        <button onClick={onClose} style={{ width: '100%', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [activePage, setActivePage] = useState(user?.role === 'cashier' ? 'pos' : 'dashboard')
  const [salesData, setSalesData] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [cart, setCart] = useState([])
  const [placing, setPlacing] = useState(false)
  const [showMpesaModal, setShowMpesaModal] = useState(false)
  const [posReceipt, setPosReceipt] = useState(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => { fetchData() }, [activePage])

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([api.get('/orders'), api.get('/products')])
      setOrders(ordersRes.data)
      setProducts(productsRes.data)
      buildSalesData(ordersRes.data)
    } catch (err) { console.error(err) }
  }

  const buildSalesData = (ordersData) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const salesByDay = {}
    days.forEach(d => salesByDay[d] = 0)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    ordersData.forEach(order => {
      const orderDate = new Date(order.created_at)
      if (orderDate >= weekAgo) {
        const day = days[orderDate.getDay()]
        salesByDay[day] += parseFloat(order.total)
      }
    })
    setSalesData(days.map(day => ({ day, sales: salesByDay[day] })))
  }

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0)
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)
  const lowStockProducts = products.filter(p => parseInt(p.stock) <= 10)
  const pendingCount = orders.filter(o => o.payment_status === 'pending').length

  const handleLogout = () => { logout(); navigate('/') }

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    const existing = cart.find(item => item.id === productId)
    if (existing.quantity === 1) {
      setCart(cart.filter(item => item.id !== productId))
    } else {
      setCart(cart.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
    }
  }

  const removeItemCompletely = (productId) => setCart(cart.filter(item => item.id !== productId))
  const getTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const getCartQuantity = (productId) => { const item = cart.find(i => i.id === productId); return item ? item.quantity : 0 }
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0)

  const placeOrder = async (paymentMethod) => {
    if (cart.length === 0) return
    if (paymentMethod === 'mpesa') { setShowMpesaModal(true); return }
    setPlacing(true)
    try {
      const items = cart.map(item => ({ product_id: item.id, quantity: item.quantity, price: item.price }))
      const res = await api.post('/orders', { items, payment_method: paymentMethod })
      setCart([])
      setPosReceipt({ order: res.data.order, items: res.data.items })
      fetchData()
    } catch (err) { alert('Could not place order') }
    finally { setPlacing(false) }
  }

  const processMpesaPayment = async (phone) => {
    setShowMpesaModal(false)
    setPlacing(true)
    try {
      const items = cart.map(item => ({ product_id: item.id, quantity: item.quantity, price: item.price }))
      const orderRes = await api.post('/orders', { items, payment_method: 'mpesa', customer_phone: phone })
      const orderId = orderRes.data.order.id
      await api.post('/mpesa/stkpush', { phone, amount: getTotal(), order_id: orderId })
      setCart([])
      setPosReceipt({ order: { ...orderRes.data.order, payment_status: 'pending' }, items: orderRes.data.items })
      fetchData()
    } catch (err) { alert('Could not process M-Pesa payment') }
    finally { setPlacing(false) }
  }

  const handlePrintReceipt = (order, items) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    const total = parseFloat(order.total)
    const loyaltyPoints = Math.floor(total / 10)
    const itemsHTML = items.map(item => `
      <tr>
        <td style="padding:6px 0;font-size:13px;">${item.name}</td>
        <td style="padding:6px 0;font-size:13px;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 0;font-size:13px;text-align:right;">${parseFloat(item.price).toLocaleString()}</td>
        <td style="padding:6px 0;font-size:13px;font-weight:700;text-align:right;">${(parseFloat(item.price) * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('')
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;}
      .receipt{width:360px;margin:0 auto;padding:20px;}
      .header{background:#0A1F44;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;}
      .divider{border:none;border-top:2px solid #F5A623;margin:12px 0;}
      table{width:100%;border-collapse:collapse;margin:10px 0;}
      th{font-size:10px;color:#666;text-transform:uppercase;padding:6px 0;border-bottom:1px solid #eee;}
      .grand{display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:2px solid #F5A623;}
      .loyalty{background:#FEF3C7;border-radius:8px;padding:10px;margin:12px 0;text-align:center;}
      .footer{text-align:center;margin-top:16px;padding-top:12px;border-top:1px dashed #ddd;}
      @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}</style>
      </head><body><div class="receipt">
      <div class="header">
        <div style="width:50px;height:50px;background:#F5A623;border-radius:10px;margin:0 auto 10px;line-height:50px;text-align:center;font-size:24px;font-weight:800;color:#0A1F44;">S</div>
        <div style="font-size:18px;font-weight:800;letter-spacing:2px;">SIRADIFY POS</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Nairobi, Kenya</div>
      </div>
      <div style="background:#fff;padding:16px;border:1px solid #eee;border-top:none;">
        <hr class="divider">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;color:#666;">Order No.</span><span style="font-size:12px;font-weight:600;">#${order.id}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;color:#666;">Payment</span><span style="font-size:12px;font-weight:600;color:#F5A623;">${order.payment_method === 'mpesa' ? 'M-Pesa' : 'Cash'}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;color:#666;">Status</span><span style="font-size:12px;font-weight:600;color:${order.payment_status === 'paid' ? '#10B981' : '#F59E0B'}">${order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}</span></div>
        ${order.customer_phone ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;color:#666;">Customer</span><span style="font-size:12px;font-weight:600;">${order.customer_phone}</span></div>` : ''}
        <hr class="divider">
        <table><thead><tr><th style="text-align:left;">Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${itemsHTML}</tbody></table>
        <hr class="divider">
        <div class="grand"><span style="font-size:16px;font-weight:700;color:#0A1F44;">GRAND TOTAL</span><span style="font-size:20px;font-weight:800;color:#F5A623;">KES ${total.toLocaleString()}</span></div>
        <div class="loyalty"><div style="font-size:11px;color:#92400E;font-weight:600;">LOYALTY POINTS EARNED</div><div style="font-size:20px;font-weight:800;color:#F5A623;">+${loyaltyPoints} pts</div></div>
        <div class="footer"><div style="font-size:10px;color:#999;margin-bottom:4px;">Thank you for your purchase!</div><div style="font-size:11px;font-weight:700;color:#0A1F44;letter-spacing:2px;">FROM VISION TO REALITY</div></div>
      </div></div>
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}</script>
      </body></html>`)
    printWindow.document.close()
  }

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pos', label: 'POS', icon: '🛒' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'orders', label: 'Orders', icon: '🧾' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  const cashierNavItems = [
    { id: 'pos', label: 'POS', icon: '🛒' },
    { id: 'orders', label: 'Orders', icon: '🧾' },
  ]

  const navItems = user?.role === 'cashier' ? cashierNavItems : adminNavItems

  const ProductGrid = ({ cols }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px' }}>
      {products.map(product => {
        const qty = getCartQuantity(product.id)
        return (
          <div key={product.id} onClick={() => addToCart({ ...product, price: parseFloat(product.price), stock: parseInt(product.stock) })}
            style={{ background: qty > 0 ? '#FFFBF0' : '#fff', borderRadius: '14px', padding: cols === 2 ? '14px' : '16px', textAlign: 'center', borderWidth: '1px', borderStyle: 'solid', borderColor: qty > 0 ? '#F5A623' : '#E5E7EB', cursor: 'pointer', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {qty > 0 && (
              <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#F5A623', borderRadius: '10px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#0A1F44' }}>{qty}</span>
              </div>
            )}
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} style={{ width: cols === 2 ? '54px' : '60px', height: cols === 2 ? '54px' : '60px', borderRadius: '12px', objectFit: 'cover', marginBottom: '8px' }} />
            ) : (
              <div style={{ width: cols === 2 ? '54px' : '60px', height: cols === 2 ? '54px' : '60px', background: '#F4F6F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: cols === 2 ? '26px' : '28px' }}>
                {product.category === 'drinks' ? '🥤' : product.category === 'food' ? '🍽️' : product.category === 'electronics' ? '📱' : '📦'}
              </div>
            )}
            <p style={{ fontSize: cols === 2 ? '12px' : '13px', fontWeight: '600', color: '#1A1A2E', margin: '0 0 4px' }}>{product.name}</p>
            <p style={{ fontSize: cols === 2 ? '13px' : '14px', fontWeight: '700', color: '#0A1F44', margin: '0 0 2px' }}>KES {parseFloat(product.price).toLocaleString()}</p>
            <p style={{ fontSize: cols === 2 ? '10px' : '11px', color: '#6B7280', margin: 0 }}>{product.stock} left</p>
          </div>
        )
      })}
    </div>
  )

  const CartItems = () => (
    <>
      {cart.map(item => (
        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ flex: 1, marginRight: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A2E', margin: '0 0 2px' }}>{item.name}</p>
            <p style={{ fontSize: '12px', color: '#F5A623', fontWeight: '700', margin: 0 }}>KES {(item.price * item.quantity).toLocaleString()}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={() => removeFromCart(item.id)} style={{ width: '30px', height: '30px', background: '#F4F6F9', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '700', color: '#0A1F44' }}>-</button>
            <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
            <button onClick={() => addToCart(item)} style={{ width: '30px', height: '30px', background: '#F4F6F9', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '700', color: '#0A1F44' }}>+</button>
            <button onClick={() => removeItemCompletely(item.id)} style={{ width: '30px', height: '30px', background: '#FEE2E2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#DC2626' }}>✕</button>
          </div>
        </div>
      ))}
    </>
  )

  const ReceiptView = ({ onNew }) => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={onNew} style={{ background: '#F3F4F6', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#374151' }}>← New Order</button>
        <h2 style={{ color: '#0A1F44', fontSize: '18px', fontWeight: '700', margin: 0 }}>Order #{posReceipt.order.id}</h2>
        <button onClick={() => handlePrintReceipt(posReceipt.order, posReceipt.items)} style={{ marginLeft: 'auto', backgroundColor: '#F5A623', color: '#0A1F44', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>🖨️ Print Receipt</button>
      </div>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>Payment</span>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>{posReceipt.order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>Status</span>
          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: posReceipt.order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7', color: posReceipt.order.payment_status === 'paid' ? '#065F46' : '#92400E' }}>
            {posReceipt.order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
          </span>
        </div>
        {posReceipt.order.customer_phone && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Customer</span>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{posReceipt.order.customer_phone}</span>
          </div>
        )}
      </div>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0A1F44', margin: '0 0 14px' }}>Items</h4>
        {posReceipt.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: i < posReceipt.items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#374151' }}>{item.name}</span>
              <span style={{ fontSize: '11px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>x{item.quantity}</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0A1F44' }}>KES {(parseFloat(item.price) * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '2px solid #E5E7EB' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Total</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#0A1F44' }}>KES {parseFloat(posReceipt.order.total).toLocaleString()}</span>
        </div>
      </div>
      <button onClick={() => handlePrintReceipt(posReceipt.order, posReceipt.items)} style={{ width: '100%', backgroundColor: '#F5A623', color: '#0A1F44', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
        🖨️ Print Receipt
      </button>
    </div>
  )

  const POSPage = () => {
    if (posReceipt) return <ReceiptView onNew={() => setPosReceipt(null)} />
    return (
      <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 120px)' }}>
        {showMpesaModal && <MpesaModal total={getTotal()} onClose={() => setShowMpesaModal(false)} onConfirm={processMpesaPayment} />}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <h2 style={{ color: '#0A1F44', fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>Products</h2>
          <ProductGrid cols={3} />
        </div>
        <div style={{ width: '320px', background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <h2 style={{ color: '#0A1F44', fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>Cart {cart.length > 0 ? `(${getTotalItems()})` : ''}</h2>
          {cart.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</span>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Cart is empty</p>
              <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '4px 0 0' }}>Click a product to add</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}><CartItems /></div>
          )}
          <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>Total</span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#0A1F44' }}>KES {getTotal().toLocaleString()}</span>
            </div>
            <button onClick={() => placeOrder('cash')} disabled={placing || cart.length === 0} style={{ width: '100%', backgroundColor: cart.length === 0 ? '#E5E7EB' : '#F5A623', color: cart.length === 0 ? '#9CA3AF' : '#0A1F44', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', marginBottom: '10px' }}>
              {placing ? 'Processing...' : '💵 Cash Payment'}
            </button>
            <button onClick={() => placeOrder('mpesa')} disabled={placing || cart.length === 0} style={{ width: '100%', backgroundColor: cart.length === 0 ? '#E5E7EB' : '#0A1F44', color: cart.length === 0 ? '#9CA3AF' : '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
              {placing ? 'Processing...' : '📱 M-Pesa Payment'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const LowStockAlert = () => {
    if (lowStockProducts.length === 0) return null
    return (
      <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px', marginBottom: '20px', borderLeft: '4px solid #F59E0B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <h3 style={{ color: '#92400E', fontSize: '14px', fontWeight: '700', margin: 0 }}>
            {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {lowStockProducts.map(product => (
            <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '20px' }}>{product.category === 'drinks' ? '🥤' : product.category === 'food' ? '🍽️' : product.category === 'electronics' ? '📱' : '📦'}</span>
                )}
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#92400E' }}>{product.name}</span>
              </div>
              <span style={{ background: product.stock === 0 ? '#FEE2E2' : '#FEF3C7', color: product.stock === 0 ? '#DC2626' : '#92400E', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const Customers = () => {
    const customerMap = {}
    orders.forEach(order => {
      if (order.customer_phone) {
        if (!customerMap[order.customer_phone]) {
          customerMap[order.customer_phone] = { phone: order.customer_phone, orders: 0, spent: 0, lastOrder: order.created_at }
        }
        customerMap[order.customer_phone].orders += 1
        customerMap[order.customer_phone].spent += parseFloat(order.total)
        if (new Date(order.created_at) > new Date(customerMap[order.customer_phone].lastOrder)) {
          customerMap[order.customer_phone].lastOrder = order.created_at
        }
      }
    })
    const customers = Object.values(customerMap)
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ color: '#0A1F44', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>Customers</h1>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>{customers.length} customers from M-Pesa orders</p>
        </div>
        {customers.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#6B7280' }}>No customers yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {customers.sort((a, b) => b.spent - a.spent).map((c, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#0A1F44', margin: 0 }}>{c.phone}</p>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{Math.floor(c.spent / 10)} pts</span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{c.orders} orders</p>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#0A1F44', margin: 0 }}>KES {c.spent.toLocaleString()}</p>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{new Date(c.lastOrder).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const Reports = () => {
    const mpesaOrders = orders.filter(o => o.payment_method === 'mpesa')
    const cashOrders = orders.filter(o => o.payment_method === 'cash')
    const mpesaRevenue = mpesaOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)
    const cashRevenue = cashOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)
    const paymentData = [
      { name: 'M-Pesa', value: mpesaRevenue, orders: mpesaOrders.length },
      { name: 'Cash', value: cashRevenue, orders: cashOrders.length },
    ]
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ color: '#0A1F44', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>Reports</h1>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Business performance overview</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <StatCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} sub="All time" color="#F5A623" />
          <StatCard title="Today" value={`KES ${todayRevenue.toLocaleString()}`} sub="Today" color="#10B981" />
          <StatCard title="M-Pesa" value={`KES ${mpesaRevenue.toLocaleString()}`} sub={`${mpesaOrders.length} orders`} color="#0A1F44" />
          <StatCard title="Cash" value={`KES ${cashRevenue.toLocaleString()}`} sub={`${cashOrders.length} orders`} color="#6366F1" />
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#0A1F44', fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>Sales This Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="sales" fill="#F5A623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#0A1F44', fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>Payment Methods</h3>
          {paymentData.map((item, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{item.name}</span>
                <span style={{ fontSize: '13px', color: '#0A1F44', fontWeight: '700' }}>KES {item.value.toLocaleString()}</span>
              </div>
              <div style={{ background: '#F3F4F6', borderRadius: '4px', height: '8px' }}>
                <div style={{ background: i === 0 ? '#0A1F44' : '#F5A623', height: '8px', borderRadius: '4px', width: totalRevenue > 0 ? `${(item.value / totalRevenue * 100).toFixed(0)}%` : '0%' }} />
              </div>
              <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0 0' }}>{item.orders} orders</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const Settings = () => {
    const [businessName, setBusinessName] = useState('Siradify POS')
    const [saved, setSaved] = useState(false)
    const [staff, setStaff] = useState([])
    const [showAddStaff, setShowAddStaff] = useState(false)
    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newRole, setNewRole] = useState('cashier')
    const [adding, setAdding] = useState(false)
    const [addError, setAddError] = useState('')

    useEffect(() => { fetchStaff() }, [])

    const fetchStaff = async () => {
      try { const res = await api.get('/auth/staff'); setStaff(res.data) }
      catch (err) { console.error(err) }
    }

    const handleAddStaff = async () => {
      if (!newName || !newEmail || !newPassword) { setAddError('All fields are required'); return }
      setAdding(true); setAddError('')
      try {
        await api.post('/auth/register-cashier', { name: newName, email: newEmail, password: newPassword, role: newRole })
        setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('cashier')
        setShowAddStaff(false); fetchStaff()
      } catch (err) {
        setAddError(err.response?.data?.message || 'Could not create account')
      } finally { setAdding(false) }
    }

    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ color: '#0A1F44', fontSize: '20px', fontWeight: '700', margin: '0 0 4px' }}>Settings</h1>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Manage your business settings</p>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ color: '#0A1F44', fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>Business Info</h3>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Business Name</label>
                <input value={businessName} onChange={e => setBusinessName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#374151', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Name</label>
                <input value={user?.name} readOnly style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#6B7280', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Email</label>
                <input value={user?.email} readOnly style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#6B7280', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }} />
              </div>
              <button onClick={() => setSaved(true)} style={{ backgroundColor: saved ? '#10B981' : '#0A1F44', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {saved ? '✓ Saved' : 'Save Changes'}
              </button>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ color: '#0A1F44', fontSize: '15px', fontWeight: '600', margin: '0 0 14px' }}>Account</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: 0 }}>Role</p>
                  <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0' }}>Your access level</p>
                </div>
                <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>{user?.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: 0 }}>API Status</p>
                  <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0' }}>Live on Railway</p>
                </div>
                <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Online</span>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#0A1F44', fontSize: '15px', fontWeight: '600', margin: 0 }}>Staff</h3>
                <button onClick={() => { setShowAddStaff(!showAddStaff); setAddError('') }} style={{ backgroundColor: '#0A1F44', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  {showAddStaff ? 'Cancel' : '+ Add Staff'}
                </button>
              </div>
              {showAddStaff && (
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', padding: '14px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
                  {addError && <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px' }}>{addError}</div>}
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full Name" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box', marginBottom: '10px' }} />
                  <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box', marginBottom: '10px' }} />
                  <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password" type="password" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box', marginBottom: '10px' }} />
                  <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box', marginBottom: '12px' }}>
                    <option value="cashier">Cashier</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={handleAddStaff} disabled={adding} style={{ width: '100%', backgroundColor: '#10B981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: adding ? 0.6 : 1 }}>
                    {adding ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              )}
              {staff.length === 0 ? (
                <p style={{ color: '#6B7280', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No staff yet.</p>
              ) : (
                <div>
                  {staff.map((member, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < staff.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: 0 }}>{member.name}</p>
                        <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0' }}>{member.email}</p>
                      </div>
                      <span style={{ background: member.role === 'admin' ? '#EDE9FE' : '#DBEAFE', color: member.role === 'admin' ? '#5B21B6' : '#1D4ED8', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', textTransform: 'capitalize' }}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const MobileHeader = () => (
    <div style={{ background: '#0A1F44', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '34px', height: '34px', background: '#F5A623', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#0A1F44', fontWeight: '800', fontSize: '16px' }}>S</span>
        </div>
        <div>
          <p style={{ color: '#fff', fontWeight: '700', fontSize: '14px', margin: 0 }}>Siradify</p>
          <p style={{ color: '#F5A623', fontSize: '9px', margin: 0 }}>FROM VISION TO REALITY</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {lowStockProducts.length > 0 && user?.role === 'admin' && (
          <div style={{ background: '#EF4444', borderRadius: '20px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px' }}>⚠️</span>
            <span style={{ color: '#fff', fontSize: '10px', fontWeight: '700' }}>{lowStockProducts.length} low</span>
          </div>
        )}
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>{user?.name}</p>
        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(245,166,35,0.5)', color: '#F5A623', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
          Logout
        </button>
      </div>
    </div>
  )

  const BottomNav = () => (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0A1F44', display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
      {navItems.map(item => (
        <button key={item.id} onClick={() => setActivePage(item.id)} style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 4px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', borderTop: activePage === item.id ? '2px solid #F5A623' : '2px solid transparent', position: 'relative' }}>
          <span style={{ fontSize: '18px' }}>{item.icon}</span>
          {item.id === 'products' && lowStockProducts.length > 0 && user?.role === 'admin' && (
            <span style={{ position: 'absolute', top: '6px', right: '8px', background: '#EF4444', color: '#fff', fontSize: '8px', fontWeight: '700', borderRadius: '10px', padding: '1px 5px' }}>{lowStockProducts.length}</span>
          )}
          <span style={{ color: activePage === item.id ? '#F5A623' : 'rgba(255,255,255,0.5)', fontSize: '9px', fontWeight: activePage === item.id ? '700' : '400' }}>{item.label}</span>
        </button>
      ))}
    </div>
  )

  const MobilePOS = () => {
    const [mobileView, setMobileView] = useState('products')

    if (posReceipt) {
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button onClick={() => setPosReceipt(null)} style={{ background: '#F3F4F6', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#374151' }}>← New Order</button>
            <h2 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '700', margin: 0 }}>Order #{posReceipt.order.id}</h2>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Payment</span>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>{posReceipt.order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Status</span>
              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: posReceipt.order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7', color: posReceipt.order.payment_status === 'paid' ? '#065F46' : '#92400E' }}>
                {posReceipt.order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
              </span>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0A1F44', margin: '0 0 12px' }}>Items</h4>
            {posReceipt.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: i < posReceipt.items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <span style={{ fontSize: '13px', color: '#374151' }}>{item.name} x{item.quantity}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#0A1F44' }}>KES {(parseFloat(item.price) * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid #E5E7EB' }}>
              <span style={{ fontSize: '15px', fontWeight: '600' }}>Total</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#0A1F44' }}>KES {parseFloat(posReceipt.order.total).toLocaleString()}</span>
            </div>
          </div>
          <button onClick={() => handlePrintReceipt(posReceipt.order, posReceipt.items)} style={{ width: '100%', backgroundColor: '#F5A623', color: '#0A1F44', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            🖨️ Print Receipt
          </button>
        </div>
      )
    }

    if (mobileView === 'cart') {
      return (
        <div>
          {showMpesaModal && <MpesaModal total={getTotal()} onClose={() => setShowMpesaModal(false)} onConfirm={processMpesaPayment} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: '#0A1F44', fontSize: '18px', fontWeight: '700', margin: 0 }}>Cart ({getTotalItems()})</h2>
            <button onClick={() => setMobileView('products')} style={{ background: '#F3F4F6', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#374151' }}>← Products</button>
          </div>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🛒</p>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Cart is empty</p>
            </div>
          ) : (
            <>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <CartItems />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '2px solid #E5E7EB', marginTop: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>Total</span>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: '#0A1F44' }}>KES {getTotal().toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => placeOrder('cash')} disabled={placing} style={{ width: '100%', backgroundColor: '#F5A623', color: '#0A1F44', border: 'none', padding: '15px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px' }}>
                {placing ? 'Processing...' : '💵 Cash Payment'}
              </button>
              <button onClick={() => placeOrder('mpesa')} disabled={placing} style={{ width: '100%', backgroundColor: '#0A1F44', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                {placing ? 'Processing...' : '📱 M-Pesa Payment'}
              </button>
            </>
          )}
        </div>
      )
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: '#0A1F44', fontSize: '18px', fontWeight: '700', margin: 0 }}>Products</h2>
          {cart.length > 0 && (
            <button onClick={() => setMobileView('cart')} style={{ backgroundColor: '#F5A623', color: '#0A1F44', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
              Cart ({getTotalItems()})
            </button>
          )}
        </div>
        <ProductGrid cols={2} />
      </div>
    )
  }

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Inter, sans-serif' }}>
        <MobileHeader />
        <div style={{ padding: '16px', paddingBottom: '80px' }}>
          {activePage === 'pos' && <MobilePOS />}
          {activePage === 'dashboard' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h1 style={{ color: '#0A1F44', fontSize: '18px', fontWeight: '700', margin: '0 0 2px' }}>Good day, {user?.name}</h1>
                <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Business overview for today.</p>
              </div>
              <LowStockAlert />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <StatCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} sub="All time" color="#F5A623" />
                <StatCard title="Today" value={`KES ${todayRevenue.toLocaleString()}`} sub="Today only" color="#10B981" />
                <StatCard title="Products" value={products.length} sub="In stock" color="#0A1F44" />
                <StatCard title="Pending" value={pendingCount} sub="Needs attention" color="#EF4444" />
              </div>
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ color: '#0A1F44', fontSize: '14px', fontWeight: '600', margin: '0 0 14px' }}>Sales This Week</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="sales" stroke="#F5A623" strokeWidth={2} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ color: '#0A1F44', fontSize: '14px', fontWeight: '600', margin: '0 0 14px' }}>Recent Orders</h3>
                {orders.length === 0 ? (
                  <p style={{ color: '#6B7280', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No orders yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: '#0A1F44', margin: '0 0 2px' }}>#{order.id}</p>
                          <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: '#0A1F44', margin: '0 0 4px' }}>KES {parseFloat(order.total).toLocaleString()}</p>
                          <span style={{ background: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7', color: order.payment_status === 'paid' ? '#065F46' : '#92400E', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>
                            {order.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          {activePage === 'products' && <Products />}
          {activePage === 'orders' && <Orders />}
          {activePage === 'customers' && <Customers />}
          {activePage === 'reports' && <Reports />}
          {activePage === 'settings' && <Settings />}
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '240px', background: '#0A1F44', display: 'flex', flexDirection: 'column', padding: '24px 0', position: 'fixed', height: '100vh', top: 0, left: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 24px 32px' }}>
          <div style={{ width: '40px', height: '40px', background: '#F5A623', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#0A1F44', fontWeight: '800', fontSize: '18px' }}>S</span>
          </div>
          <div>
            <p style={{ color: '#ffffff', fontWeight: '700', fontSize: '16px', margin: 0 }}>Siradify</p>
            <p style={{ color: '#F5A623', fontSize: '10px', margin: 0, letterSpacing: '0.05em' }}>FROM VISION TO REALITY</p>
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setActivePage(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', cursor: 'pointer', background: activePage === item.id ? 'rgba(245,166,35,0.15)' : 'transparent', borderRight: activePage === item.id ? '3px solid #F5A623' : '3px solid transparent', transition: 'all 0.2s', position: 'relative' }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ color: activePage === item.id ? '#F5A623' : 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: activePage === item.id ? '600' : '400' }}>{item.label}</span>
              {item.id === 'products' && lowStockProducts.length > 0 && user?.role === 'admin' && (
                <span style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', fontSize: '10px', fontWeight: '700', borderRadius: '10px', padding: '2px 7px' }}>{lowStockProducts.length}</span>
              )}
            </div>
          ))}
        </nav>
        <div style={{ padding: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
            <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600', margin: '0 0 2px' }}>{user?.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>{user?.role}</p>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', background: 'transparent', border: '1.5px solid rgba(245,166,35,0.5)', color: '#F5A623', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginLeft: '240px', flex: 1, padding: activePage === 'pos' ? '24px' : '32px' }}>
        {activePage === 'pos' && <POSPage />}
        {activePage === 'dashboard' && (
          <>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Good day, {user?.name}</h1>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Here is your business overview for today.</p>
            </div>
            <LowStockAlert />
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <StatCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} sub="All time" color="#F5A623" />
              <StatCard title="Today Revenue" value={`KES ${todayRevenue.toLocaleString()}`} sub="Today only" color="#10B981" />
              <StatCard title="Products" value={products.length} sub="In stock" color="#0A1F44" />
              <StatCard title="Pending Payments" value={pendingCount} sub="Needs attention" color="#EF4444" />
              <StatCard title="Low Stock" value={lowStockProducts.length} sub="Need restocking" color="#F59E0B" />
            </div>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Sales This Week (Real Data)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="sales" stroke="#F5A623" strokeWidth={2.5} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Recent Orders</h3>
              {orders.length === 0 ? (
                <p style={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No orders yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>ORDER ID</th>
                      <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>TOTAL</th>
                      <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>PAYMENT</th>
                      <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>STATUS</th>
                      <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                        <td style={{ padding: '12px 0', fontSize: '14px', color: '#0A1F44', fontWeight: '600' }}>#{order.id}</td>
                        <td style={{ padding: '12px 0', fontSize: '14px', color: '#1A1A2E' }}>KES {parseFloat(order.total).toLocaleString()}</td>
                        <td style={{ padding: '12px 0', fontSize: '14px', color: '#1A1A2E', textTransform: 'capitalize' }}>{order.payment_method}</td>
                        <td style={{ padding: '12px 0' }}>
                          <span style={{ background: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7', color: order.payment_status === 'paid' ? '#065F46' : '#92400E', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 0', fontSize: '13px', color: '#6B7280' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
        {activePage === 'products' && <Products />}
        {activePage === 'orders' && <Orders />}
        {activePage === 'customers' && <Customers />}
        {activePage === 'reports' && <Reports />}
        {activePage === 'settings' && <Settings />}
      </div>
    </div>
  )
}