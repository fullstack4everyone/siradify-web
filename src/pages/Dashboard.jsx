import Products from './Products'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

const salesData = [
  { day: 'Mon', sales: 4200 },
  { day: 'Tue', sales: 6800 },
  { day: 'Wed', sales: 5200 },
  { day: 'Thu', sales: 8900 },
  { day: 'Fri', sales: 7600 },
  { day: 'Sat', sales: 11200 },
  { day: 'Sun', sales: 9400 },
]

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          api.get('/orders'),
          api.get('/products')
        ])
        setOrders(ordersRes.data)
        setProducts(productsRes.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0)

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
              <StatCard
                title="Total Revenue"
                value={`KES ${totalRevenue.toLocaleString()}`}
                sub="All time"
                color="#F5A623"
              />
              <StatCard
                title="Total Orders"
                value={orders.length}
                sub="All time"
                color="#0A1F44"
              />
              <StatCard
                title="Products"
                value={products.length}
                sub="In stock"
                color="#10B981"
              />
              <StatCard
                title="Pending Payments"
                value={orders.filter(o => o.payment_status === 'pending').length}
                sub="Needs attention"
                color="#EF4444"
              />
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
                Sales This Week
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
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#F5A623"
                    strokeWidth={2.5}
                    fill="url(#salesGrad)"
                  />
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
                  No orders yet. Orders will appear here once your POS starts processing sales.
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
                    {orders.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                        <td style={{ padding: '12px 0', fontSize: '14px', color: '#0A1F44', fontWeight: '600' }}>#{order.id}</td>
                        <td style={{ padding: '12px 0', fontSize: '14px', color: '#1A1A2E' }}>KES {parseFloat(order.total).toLocaleString()}</td>
                        <td style={{ padding: '12px 0', fontSize: '14px', color: '#1A1A2E', textTransform: 'capitalize' }}>{order.payment_method}</td>
                        <td style={{ padding: '12px 0' }}>
                          <span style={{
                            background: order.payment_status === 'paid' ? '#D1FAE5' : '#FEE2E2',
                            color: order.payment_status === 'paid' ? '#065F46' : '#DC2626',
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

        {activePage === 'orders' && (
          <div>
            <h1 style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>
              Orders
            </h1>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px' }}>
              Full orders management coming soon.
            </p>
          </div>
        )}

        {activePage === 'customers' && (
          <div>
            <h1 style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>
              Customers
            </h1>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px' }}>
              Customer management coming soon.
            </p>
          </div>
        )}

        {activePage === 'reports' && (
          <div>
            <h1 style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>
              Reports
            </h1>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px' }}>
              Detailed reports coming soon.
            </p>
          </div>
        )}

        {activePage === 'settings' && (
          <div>
            <h1 style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>
              Settings
            </h1>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px' }}>
              Business settings coming soon.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}