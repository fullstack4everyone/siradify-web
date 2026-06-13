import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [filter, setFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
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

  const handlePrint = (order, items) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    const total = parseFloat(order.total)
    const tax = 0
    const discount = 0
    const loyaltyPoints = Math.floor(total / 10)

    const itemsHTML = items.map(item => `
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: #333;">${item.name}</td>
        <td style="padding: 6px 0; font-size: 13px; color: #333; text-align: center;">${item.quantity}</td>
        <td style="padding: 6px 0; font-size: 13px; color: #333; text-align: right;">${parseFloat(item.price).toLocaleString()}</td>
        <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0A1F44; text-align: right;">${(parseFloat(item.price) * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Order #${order.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; background: #fff; }
          .receipt { width: 360px; margin: 0 auto; padding: 20px; }
          .header { background: #0A1F44; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { width: 50px; height: 50px; background: #F5A623; border-radius: 10px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #0A1F44; line-height: 50px; }
          .brand { font-size: 18px; font-weight: 800; letter-spacing: 2px; margin-bottom: 4px; }
          .tagline { font-size: 9px; color: #F5A623; letter-spacing: 2px; }
          .divider { border: none; border-top: 2px solid #F5A623; margin: 12px 0; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .info-label { font-size: 12px; color: #666; }
          .info-value { font-size: 12px; font-weight: 600; color: #333; }
          .payment-value { font-size: 12px; font-weight: 600; color: #F5A623; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; padding: 6px 0; border-bottom: 1px solid #eee; }
          .totals { margin-top: 10px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .total-label { font-size: 12px; color: #666; }
          .total-value { font-size: 12px; color: #333; }
          .grand-total { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #F5A623; }
          .grand-label { font-size: 16px; font-weight: 700; color: #0A1F44; }
          .grand-value { font-size: 20px; font-weight: 800; color: #F5A623; }
          .loyalty { background: #FEF3C7; border-radius: 8px; padding: 10px; margin: 12px 0; text-align: center; }
          .loyalty-title { font-size: 11px; color: #92400E; font-weight: 600; margin-bottom: 2px; }
          .loyalty-points { font-size: 20px; font-weight: 800; color: #F5A623; }
          .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #ddd; }
          .footer-text { font-size: 10px; color: #999; margin-bottom: 4px; }
          .footer-brand { font-size: 11px; font-weight: 700; color: #0A1F44; letter-spacing: 2px; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">S</div>
            <div class="brand">SIRADIFY POS</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px;">Nairobi, Kenya</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.7);">support@siradify.com</div>
          </div>

          <div style="background: #fff; padding: 16px; border: 1px solid #eee; border-top: none;">
            <hr class="divider">
            <div class="info-row">
              <span class="info-label">Order No.</span>
              <span class="info-value">#${order.id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date</span>
              <span class="info-value">${formatDate(order.created_at)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment</span>
              <span class="payment-value">${order.payment_method === 'mpesa' ? 'M-Pesa' : 'Cash'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-value" style="color: ${order.payment_status === 'paid' ? '#10B981' : '#F59E0B'}">
                ${order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
              </span>
            </div>
            ${order.customer_phone ? `
            <div class="info-row">
              <span class="info-label">Customer</span>
              <span class="info-value">${order.customer_phone}</span>
            </div>` : ''}
            <hr class="divider">

            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <hr class="divider">

            <div class="totals">
              <div class="total-row">
                <span class="total-label">Subtotal</span>
                <span class="total-value">KES ${total.toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span class="total-label">Discount</span>
                <span class="total-value">KES ${discount}</span>
              </div>
              <div class="total-row">
                <span class="total-label">Tax</span>
                <span class="total-value">KES ${tax}</span>
              </div>
            </div>

            <div class="grand-total">
              <span class="grand-label">GRAND TOTAL</span>
              <span class="grand-value">KES ${total.toLocaleString()}</span>
            </div>

            <div class="loyalty">
              <div class="loyalty-title">LOYALTY POINTS EARNED</div>
              <div class="loyalty-points">+${loyaltyPoints} pts</div>
              <div style="font-size: 10px; color: #92400E; margin-top: 2px;">1 point per KES 10 spent</div>
            </div>

            <div class="footer">
              <div class="footer-text">Thank you for your purchase!</div>
              <div class="footer-text">Please come again</div>
              <div class="footer-brand">FROM VISION TO REALITY</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print()
            window.onafterprint = function() { window.close() }
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
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
          <button
            onClick={() => handlePrint(selected.order, selected.items)}
            style={{ marginLeft: 'auto', backgroundColor: '#F5A623', color: '#0A1F44', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
          >
            🖨️ Print Receipt
          </button>
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

        <div style={{ display: 'flex', gap: '12px' }}>
          {selected.order.payment_status === 'pending' && (
            <button
              style={{ flex: 1, backgroundColor: '#10B981', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
              onClick={() => markAsPaid(selected.order.id)}
              disabled={updating === selected.order.id}
            >
              {updating === selected.order.id ? 'Updating...' : '✓ Mark as Paid'}
            </button>
          )}
          <button
            style={{ flex: 1, backgroundColor: '#F5A623', color: '#0A1F44', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
            onClick={() => handlePrint(selected.order, selected.items)}
          >
            🖨️ Print Receipt
          </button>
        </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#0A1F44' }}>KES {parseFloat(selected.order.total).toLocaleString()}</span>
              </div>
              <button
                style={{ width: '100%', backgroundColor: '#F5A623', color: '#0A1F44', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginBottom: '8px' }}
                onClick={() => handlePrint(selected.order, selected.items)}
              >
                🖨️ Print Receipt
              </button>
              {selected.order.payment_status === 'pending' && (
                <button
                  style={{ width: '100%', backgroundColor: '#10B981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
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