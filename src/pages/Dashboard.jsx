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
    padding: '24px',
    flex: 1,
    minWidth: '180px',
    borderLeft: `4px solid ${color}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  }}>
    <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 8px' }}>{title}</p>
    <p style={{ color: '#0A1F44', fontSize: '26px', fontWeight: '700', margin: '0 0 4px' }}>{value}</p>
    <p style={{ color: color, fontSize: '12px', margin: '0' }}>{sub}</p>
  </div>
)

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [activePage, setActivePage] = useState('dashboard')
  const [salesData, setSalesData] = useState([])

  useEffect(() => {
    fetchData()
  }, [activePage])

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products')
      ])
      setOrders(ordersRes.data)
      setProducts(productsRes.data)
      buildSalesData(ordersRes.data)
    } catch (err) {
      console.error(err)
    }
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
  const todayOrders = orders.filter(o => {
    const today = new Date()
    const orderDate = new Date(o.created_at)
    return orderDate.toDateString() === today.toDateString()
  })
  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'orders', label: 'Orders', icon: '🧾' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  const Customers = () => {
    const customerMap = {}
    orders.forEach(order => {
      if (order.customer_phone) {
        if (!customerMap[order.customer_phone]) {
          customerMap[order.customer_phone] = {
            phone: order.customer_phone,
            orders: 0,
            spent: 0,
            lastOrder: order.created_at,
          }
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
          <h1 style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Customers</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{customers.length} customers from M-Pesa orders</p>
        </div>
        {customers.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#6B7280' }}>
            No customers yet. Customers appear when M-Pesa payments are made.
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Orders</th>
                  <th style={thStyle}>Total Spent</th>
                  <th style={thStyle}>Last Order</th>
                  <th style={thStyle}>Loyalty Points</th>
                </tr>
              </thead>
              <tbody>
                {customers.sort((a, b) => b.spent - a.spent).map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}>{c.phone}</td>
                    <td style={tdStyle}>{c.orders}</td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: '#0A1F44' }}>KES {c.spent.toLocaleString()}</td>
                    <td style={tdStyle}>{new Date(c.lastOrder).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {Math.floor(c.spent / 10)} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <h1 style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Reports</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Business performance overview</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <StatCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} sub="All time" color="#F5A623" />
          <StatCard title="Today Revenue" value={`KES ${todayRevenue.toLocaleString()}`} sub="Today" color="#10B981" />
          <StatCard title="M-Pesa Revenue" value={`KES ${mpesaRevenue.toLocaleString()}`} sub={`${mpesaOrders.length} orders`} color="#0A1F44" />
          <StatCard title="Cash Revenue" value={`KES ${cashRevenue.toLocaleString()}`} sub={`${cashOrders.length} orders`} color="#6366F1" />
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Sales This Week</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="sales" fill="#F5A623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ width: '280px', background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Payment Methods</h3>
            {paymentData.map((item, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{item.name}</span>
                  <span style={{ fontSize: '13px', color: '#0A1F44', fontWeight: '700' }}>KES {item.value.toLocaleString()}</span>
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: '4px', height: '8px' }}>
                  <div style={{
                    background: i === 0 ? '#0A1F44' : '#F5A623',
                    height: '8px',
                    borderRadius: '4px',
                    width: totalRevenue > 0 ? `${(item.value / totalRevenue * 100).toFixed(0)}%` : '0%'
                  }} />
                </div>
                <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0 0' }}>{item.orders} orders</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const Settings = () => {
    const [businessName, setBusinessName] = useState('Siradify POS')
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Settings</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Manage your business settings</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '560px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Business Info</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Business Name</label>
              <input
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#374151', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Cashier Name</label>
              <input
                value={user?.name}
                readOnly
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#6B7280', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Email</label>
              <input
                value={user?.email}
                readOnly
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#6B7280', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
              />
            </div>
            <button
              onClick={handleSave}
              style={{ backgroundColor: saved ? '#10B981' : '#0A1F44', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              {saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>Account</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>Role</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>Your access level</p>
              </div>
              <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>
                {user?.role}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>API Status</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>Live on Railway</p>
              </div>
              <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    borderBottom: '1px solid #E5E7EB',
  }

  const tdStyle = {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6F9', fontFamily: 'Inter, sans-serif' }}>

      <div style={{
        width: '240px',
        background: '#0A1F44',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'fixed',
        height: '100vh',
        top: 0,
        left: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 24px 32px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#F5A623',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: '#0A1F44', fontWeight: '800', fontSize: '18px' }}>S</span>
          </div>
          <div>
            <p style={{ color: '#ffffff', fontWeight: '700', fontSize: '16px', margin: 0 }}>Siradify</p>
            <p style={{ color: '#F5A623', fontSize: '10px', margin: 0, letterSpacing: '0.05em' }}>FROM VISION TO REALITY</p>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <div
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                cursor: 'pointer',
                background: activePage === item.id ? 'rgba(245,166,35,0.15)' : 'transparent',
                borderRight: activePage === item.id ? '3px solid #F5A623' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{
                color: activePage === item.id ? '#F5A623' : 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                fontWeight: activePage === item.id ? '600' : '400'
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </nav>

        <div style={{ padding: '24px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600', margin: '0 0 2px' }}>{user?.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1.5px solid rgba(245,166,35,0.5)',
              color: '#F5A623',
              padding: '10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginLeft: '240px', flex: 1, padding: '32px' }}>

        {activePage === 'dashboard' && (
          <>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>
                Good day, {user?.name}
              </h1>
              <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
                Here is your business overview for today.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <StatCard title="Total Revenue" value={`KES ${totalRevenue.toLocaleString()}`} sub="All time" color="#F5A623" />
              <StatCard title="Today Revenue" value={`KES ${todayRevenue.toLocaleString()}`} sub="Today only" color="#10B981" />
              <StatCard title="Products" value={products.length} sub="In stock" color="#0A1F44" />
              <StatCard title="Pending Payments" value={orders.filter(o => o.payment_status === 'pending').length} sub="Needs attention" color="#EF4444" />
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
                Sales This Week (Real Data)
              </h3>
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

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
                Recent Orders
              </h3>
              {orders.length === 0 ? (
                <p style={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  No orders yet.
                </p>
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
                          <span style={{
                            background: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                            color: order.payment_status === 'paid' ? '#065F46' : '#92400E',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 0', fontSize: '13px', color: '#6B7280' }}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
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