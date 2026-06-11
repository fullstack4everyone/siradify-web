import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [filter, setFilter] = useState('all')

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Orders</h1>
          <p style={styles.subtitle}>{orders.length} total orders</p>
        </div>
        {pendingCount > 0 && (
          <div style={styles.pendingAlert}>
            <span style={styles.pendingAlertDot} />
            {pendingCount} payment{pendingCount > 1 ? 's' : ''} pending approval
          </div>
        )}
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Revenue</p>
          <p style={styles.statValue}>KES {totalRevenue.toLocaleString()}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Orders</p>
          <p style={styles.statValue}>{orders.length}</p>
        </div>
        <div style={{ ...styles.statCard, borderLeftColor: '#EF4444' }}>
          <p style={styles.statLabel}>Pending</p>
          <p style={{ ...styles.statValue, color: '#EF4444' }}>{pendingCount}</p>
        </div>
        <div style={{ ...styles.statCard, borderLeftColor: '#10B981' }}>
          <p style={styles.statLabel}>Paid</p>
          <p style={{ ...styles.statValue, color: '#10B981' }}>{orders.filter(o => o.payment_status === 'paid').length}</p>
        </div>
      </div>

      <div style={styles.filterRow}>
        {['all', 'pending', 'paid', 'mpesa', 'cash'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
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
        <div style={styles.loading}>Loading orders...</div>
      ) : (
        <div style={styles.body}>
          <div style={styles.tableWrapper}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                No orders found.
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Payment</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} style={styles.tableRow}>
                      <td style={styles.td}>#{order.id}</td>
                      <td style={styles.td}>{formatDate(order.created_at)}</td>
                      <td style={styles.td}>
                        {order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}
                      </td>
                      <td style={styles.td}>
                        {order.customer_phone || 'Walk-in'}
                      </td>
                      <td style={{ ...styles.td, fontWeight: '700', color: '#0A1F44' }}>
                        KES {parseFloat(order.total).toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                          color: order.payment_status === 'paid' ? '#065F46' : '#92400E',
                        }}>
                          {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            style={styles.viewBtn}
                            onClick={() => fetchOrderDetails(order.id)}
                          >
                            View
                          </button>
                          {order.payment_status === 'pending' && (
                            <button
                              style={styles.markPaidBtn}
                              onClick={() => markAsPaid(order.id)}
                              disabled={updating === order.id}
                            >
                              {updating === order.id ? '...' : 'Mark Paid'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selected && (
            <div style={styles.detailPanel}>
              <div style={styles.detailHeader}>
                <h3 style={styles.detailTitle}>Order #{selected.order.id}</h3>
                <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={styles.detailInfo}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Date</span>
                  <span style={styles.detailValue}>{formatDate(selected.order.created_at)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Payment</span>
                  <span style={styles.detailValue}>{selected.order.payment_method}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Status</span>
                  <span style={{
                    ...styles.detailValue,
                    color: selected.order.payment_status === 'paid' ? '#065F46' : '#92400E',
                    fontWeight: '700',
                  }}>
                    {selected.order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                  </span>
                </div>
                {selected.order.customer_phone && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Customer</span>
                    <span style={styles.detailValue}>{selected.order.customer_phone}</span>
                  </div>
                )}
              </div>

              <div style={styles.detailDivider} />
              <h4 style={styles.itemsTitle}>Items</h4>
              {selected.items && selected.items.map((item, index) => (
                <div key={index} style={styles.itemRow}>
                  <div style={styles.itemInfo}>
                    <span style={styles.itemName}>{item.name}</span>
                    <span style={styles.itemQty}>x{item.quantity}</span>
                  </div>
                  <span style={styles.itemTotal}>
                    KES {(parseFloat(item.price) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div style={styles.detailDivider} />
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total</span>
                <span style={styles.totalValue}>
                  KES {parseFloat(selected.order.total).toLocaleString()}
                </span>
              </div>

              {selected.order.payment_status === 'pending' && (
                <button
                  style={{ ...styles.markPaidBtn, width: '100%', marginTop: '16px', padding: '12px', fontSize: '14px' }}
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

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#F9FAFB',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0A1F44',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '4px 0 0 0',
  },
  pendingAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  pendingAlertDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#F59E0B',
    display: 'inline-block',
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '140px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '16px 20px',
    borderLeft: '4px solid #F5A623',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6B7280',
    margin: '0 0 4px',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0A1F44',
    margin: 0,
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '7px 16px',
    borderRadius: '20px',
    border: '1px solid #E5E7EB',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6B7280',
  },
  body: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
  },
  tableWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHead: {
    backgroundColor: '#F9FAFB',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    borderBottom: '1px solid #E5E7EB',
  },
  tableRow: {
    borderBottom: '1px solid #F3F4F6',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
  },
  viewBtn: {
    backgroundColor: '#0A1F44',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  markPaidBtn: {
    backgroundColor: '#10B981',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  detailPanel: {
    width: '320px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  detailTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0A1F44',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#6B7280',
  },
  detailInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  detailDivider: {
    height: '1px',
    backgroundColor: '#E5E7EB',
    margin: '12px 0',
  },
  itemsTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0A1F44',
    margin: '0 0 10px 0',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  itemInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  itemName: {
    fontSize: '13px',
    color: '#374151',
  },
  itemQty: {
    fontSize: '11px',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  itemTotal: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0A1F44',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0A1F44',
  },
}