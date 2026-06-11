import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status) => {
    if (status === 'paid') return { bg: '#D1FAE5', text: '#065F46' }
    if (status === 'pending') return { bg: '#FEF3C7', text: '#92400E' }
    return { bg: '#F3F4F6', text: '#374151' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Orders</h1>
          <p style={styles.subtitle}>{orders.length} total orders</p>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading orders...</div>
      ) : (
        <div style={styles.body}>
          <div style={styles.tableWrapper}>
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
                {orders.map(order => {
                  const colors = getStatusColor(order.payment_status)
                  return (
                    <tr key={order.id} style={styles.tableRow}>
                      <td style={styles.td}>#{order.id}</td>
                      <td style={styles.td}>{formatDate(order.created_at)}</td>
                      <td style={styles.td}>
                        <span style={styles.paymentBadge}>
                          {order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {order.customer_phone || 'Walk-in'}
                      </td>
                      <td style={styles.tdBold}>
                        KES {parseFloat(order.total).toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: colors.bg,
                          color: colors.text,
                        }}>
                          {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.viewBtn}
                          onClick={() => fetchOrderDetails(order.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {selected && (
            <div style={styles.detailPanel}>
              <div style={styles.detailHeader}>
                <h3 style={styles.detailTitle}>Order #{selected.order.id}</h3>
                <button
                  style={styles.closeBtn}
                  onClick={() => setSelected(null)}
                >
                  ✕
                </button>
              </div>
              <div style={styles.detailInfo}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Date</span>
                  <span style={styles.detailValue}>
                    {formatDate(selected.order.created_at)}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Payment</span>
                  <span style={styles.detailValue}>
                    {selected.order.payment_method}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Status</span>
                  <span style={styles.detailValue}>
                    {selected.order.payment_status}
                  </span>
                </div>
                {selected.order.customer_phone && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Customer</span>
                    <span style={styles.detailValue}>
                      {selected.order.customer_phone}
                    </span>
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
    marginBottom: '24px',
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
    cursor: 'pointer',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
  },
  tdBold: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#0A1F44',
    fontWeight: '700',
  },
  paymentBadge: {
    fontSize: '13px',
    color: '#374151',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  viewBtn: {
    backgroundColor: '#0A1F44',
    color: '#fff',
    border: 'none',
    padding: '6px 14px',
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
    marginBottom: '4px',
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