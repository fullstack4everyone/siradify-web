import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [filter, setFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders')
      setOrders(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetails = async (id) => {
    try {
      const res = await api.get(`/orders/${id}`)
      setSelected(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const markAsPaid = async (orderId) => {
    setUpdating(orderId)
    try {
      await api.put(`/orders/${orderId}/payment`, { payment_status: 'paid' })
      setOrders(orders.map(o =>
        o.id === orderId ? { ...o, payment_status: 'paid' } : o
      ))
      if (selected && selected.order.id === orderId) {
        setSelected({
          ...selected,
          order: { ...selected.order, payment_status: 'paid' }
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true
    if (filter === 'pending') return o.payment_status === 'pending'
    if (filter === 'paid') return o.payment_status === 'paid'
    if (filter === 'mpesa') return o.payment_method === 'mpesa'
    if (filter === 'cash') return o.payment_method === 'cash'
    return true
  })

  const pendingCount = orders.filter(o => o.payment_status === 'pending').length
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0)

  if (selected) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setSelected(null)}
            style={{ background: '#F3F4F6', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#374151' }}
          >
            ← Back
          </button>
          <h2 style={{ color: '#0A1F44', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            Order #{selected.order.id}
          </h2>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Date</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{formatDate(selected.order.created_at)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Payment</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'capitalize' }}>
              {selected.order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Status</span>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              backgroundColor: selected.order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
              color: selected.order.payment_status === 'paid' ? '#065F46' : '#92400E',
            }}>
              {selected.order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
            </span>
          </div>
          {selected.order.customer_phone && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Customer</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{selected.order.customer_phone}</span>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0A1F44', margin: '0 0 14px' }}>Items</h4>
          {selected.items && selected.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: index < selected.items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#374151' }}>{item.name}</span>
                <span style={{ fontSize: '11px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>x{item.quantity}</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0A1F44' }}>
                KES {(parseFloat(item.price) * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '2px solid #E5E7EB' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Total</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#0A1F44' }}>
              KES {parseFloat(selected.order.total).toLocaleString()}
            </span>
          </div>
        </div>

        {selected.order.payment_status === 'pending' && (
          <button
            style={{ width: '100%', backgroundColor: '#10B981', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
            onClick={() => markAsPaid(selected.order.id)}
            disabled={updating === selected.order.id}
          >
            {updating === selected.order.id ? 'Updating...' : '✓ Mark as Paid'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ color: '#0A1F44', fontSize: isMobile ? '18px' : '22px', fontWeight: '700', margin: '0 0 2px' }}>Orders</h1>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>{orders.length} total orders</p>
        </div>
        {pendingCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FEF3C7', color: '#92400E', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} />
            {pendingCount} pending
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '120px', backgroundColor: '#fff', borderRadius: '10px', padding: '14px', borderLeft: '4px solid #F5A623', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 4px', fontWeight: '500' }}>Total Revenue</p>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#0A1F44', margin: 0 }}>KES {totalRevenue.toLocaleString()}</p>
        </div>
        <div style={{ flex: 1, minWidth: '80px', backgroundColor: '#fff', borderRadius: '10px', padding: '14px', borderLeft: '4px solid #0A1F44', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 4px', fontWeight: '500' }}>Total Orders</p>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#0A1F44', margin: 0 }}>{orders.length}</p>
        </div>
        <div style={{ flex: 1, minWidth: '80px', backgroundColor: '#fff', borderRadius: '10px', padding: '14px', borderLeft: '4px solid #EF4444', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 4px', fontWeight: '500' }}>Pending</p>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#EF4444', margin: 0 }}>{pendingCount}</p>
        </div>
        <div style={{ flex: 1, minWidth: '80px', backgroundColor: '#fff', borderRadius: '10px', padding: '14px', borderLeft: '4px solid #10B981', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 4px', fontWeight: '500' }}>Paid</p>
          <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#10B981', margin: 0 }}>{orders.filter(o => o.payment_status === 'paid').length}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'paid', 'mpesa', 'cash'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid #E5E7EB',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              backgroundColor: filter === f ? '#0A1F44' : '#fff',
              color: filter === f ? '#fff' : '#374151',
            }}
          >
            {f === 'all' ? 'All Orders' :
             f === 'pending' ? `Pending (${pendingCount})` :
             f === 'paid' ? 'Paid' :
             f === 'mpesa' ? 'M-Pesa' : 'Cash'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#6B7280' }}>No orders found.</div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredOrders.map(order => (
            <div
              key={order.id}
              style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: order.payment_status === 'pending' ? '4px solid #F59E0B' : '4px solid #10B981' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0A1F44' }}>#{order.id}</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#0A1F44' }}>KES {parseFloat(order.total).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  {order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'} · {order.customer_phone || 'Walk-in'}
                </span>
                <span style={{ fontSize: '11px', color: '#6B7280' }}>{formatDate(order.created_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                  backgroundColor: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                  color: order.payment_status === 'paid' ? '#065F46' : '#92400E',
                }}>
                  {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => fetchOrderDetails(order.id)}
                    style={{ backgroundColor: '#0A1F44', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    View
                  </button>
                  {order.payment_status === 'pending' && (
                    <button
                      onClick={() => markAsPaid(order.id)}
                      disabled={updating === order.id}
                      style={{ backgroundColor: '#10B981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {updating === order.id ? '...' : 'Mark Paid'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={thStyle}>Order ID</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}>#{order.id}</td>
                    <td style={tdStyle}>{formatDate(order.created_at)}</td>
                    <td style={tdStyle}>{order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}</td>
                    <td style={tdStyle}>{order.customer_phone || 'Walk-in'}</td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: '#0A1F44' }}>KES {parseFloat(order.total).toLocaleString()}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                        backgroundColor: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                        color: order.payment_status === 'paid' ? '#065F46' : '#92400E',
                      }}>
                        {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => fetchOrderDetails(order.id)} style={{ backgroundColor: '#0A1F44', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          View
                        </button>
                        {order.payment_status === 'pending' && (
                          <button onClick={() => markAsPaid(order.id)} disabled={updating === order.id} style={{ backgroundColor: '#10B981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            {updating === order.id ? '...' : 'Mark Paid'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div style={{ width: '320px', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0A1F44', margin: 0 }}>Order #{selected.order.id}</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#6B7280' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Date</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{formatDate(selected.order.created_at)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Payment</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'capitalize' }}>{selected.order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Status</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', backgroundColor: selected.order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7', color: selected.order.payment_status === 'paid' ? '#065F46' : '#92400E' }}>
                    {selected.order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                  </span>
                </div>
                {selected.order.customer_phone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>Customer</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{selected.order.customer_phone}</span>
                  </div>
                )}
              </div>
              <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '12px 0' }} />
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0A1F44', margin: '0 0 10px' }}>Items</h4>
              {selected.items && selected.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{item.name}</span>
                    <span style={{ fontSize: '11px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>x{item.quantity}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#0A1F44' }}>KES {(parseFloat(item.price) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#0A1F44' }}>KES {parseFloat(selected.order.total).toLocaleString()}</span>
              </div>
              {selected.order.payment_status === 'pending' && (
                <button
                  style={{ width: '100%', backgroundColor: '#10B981', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '16px' }}
                  onClick={() => markAsPaid(selected.order.id)}
                  disabled={updating === selected.order.id}
                >
                  {updating === selected.order.id ? 'Updating...' : '✓ Mark as Paid'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
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