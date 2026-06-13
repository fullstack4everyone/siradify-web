import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({
    name: '', price: '', stock: '', category: '', image_url: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, form)
        setSuccess('Product updated successfully')
      } else {
        await api.post('/products', form)
        setSuccess('Product added successfully')
      }
      setForm({ name: '', price: '', stock: '', category: '', image_url: '' })
      setShowForm(false)
      setEditProduct(null)
      fetchProducts()
    } catch (err) {
      setError('Something went wrong. Try again.')
    }
  }

  const handleEdit = (product) => {
    setEditProduct(product)
    setForm({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      image_url: product.image_url || ''
    })
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await api.delete(`/products/${id}`)
      setSuccess('Product deleted')
      fetchProducts()
    } catch (err) {
      setError('Could not delete product')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1A1A2E'
  }

  const categories = ['food', 'drinks', 'electronics', 'clothing', 'other']

  const getEmoji = (category) => {
    if (category === 'drinks') return '🥤'
    if (category === 'food') return '🍽️'
    if (category === 'electronics') return '📱'
    return '📦'
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#0A1F44', fontSize: isMobile ? '18px' : '22px', fontWeight: '700', margin: '0 0 2px' }}>Products</h1>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>{products.length} products in inventory</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditProduct(null)
            setForm({ name: '', price: '', stock: '', category: '', image_url: '' })
          }}
          style={{ background: '#F5A623', color: '#0A1F44', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>
      )}
      {success && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{success}</div>
      )}

      {showForm && (
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#0A1F44', fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>
            {editProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#1A1A2E', marginBottom: '6px' }}>Product Name</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chai" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#1A1A2E', marginBottom: '6px' }}>Price (KES)</label>
                <input style={inputStyle} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 50" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#1A1A2E', marginBottom: '6px' }}>Stock Quantity</label>
                <input style={inputStyle} type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="e.g. 100" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#1A1A2E', marginBottom: '6px' }}>Category</label>
                <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#1A1A2E', marginBottom: '6px' }}>Image URL (optional)</label>
                <input style={inputStyle} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://example.com/image.jpg" />
              </div>
            </div>

            {form.image_url && (
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={form.image_url} alt="preview" style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E5E7EB' }} onError={e => e.target.style.display = 'none'} />
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Image preview</p>
              </div>
            )}

            <button type="submit" style={{ background: '#0A1F44', color: '#ffffff', border: 'none', padding: '11px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              {editProduct ? 'Update Product' : 'Save Product'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px 0' }}>Loading products...</p>
      ) : products.length === 0 ? (
        <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px 0' }}>No products yet. Add your first product.</p>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {products.map(product => (
            <div key={product.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flexShrink: 0 }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                ) : null}
                <div style={{ width: '52px', height: '52px', borderRadius: '10px', backgroundColor: '#F9FAFB', display: product.image_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '1px solid #E5E7EB' }}>
                  {getEmoji(product.category)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#0A1F44', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#F5A623', margin: '0 0 4px' }}>KES {parseFloat(product.price).toLocaleString()}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: product.stock > 10 ? '#D1FAE5' : '#FEE2E2', color: product.stock > 10 ? '#065F46' : '#DC2626', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                    {product.stock} units
                  </span>
                  <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'capitalize' }}>{product.category}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => handleEdit(product)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(product.id)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                <th style={thStyle}>Image</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td style={tdStyle}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E5E7EB' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                    ) : null}
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#F9FAFB', display: product.image_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid #E5E7EB' }}>
                      {getEmoji(product.category)}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: '600', color: '#0A1F44' }}>{product.name}</td>
                  <td style={tdStyle}>KES {parseFloat(product.price).toLocaleString()}</td>
                  <td style={tdStyle}>
                    <span style={{ background: product.stock > 10 ? '#D1FAE5' : '#FEE2E2', color: product.stock > 10 ? '#065F46' : '#DC2626', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                      {product.stock} units
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{product.category}</td>
                  <td style={tdStyle}>
                    <button onClick={() => handleEdit(product)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', marginRight: '8px' }}>Edit</button>
                    <button onClick={() => handleDelete(product.id)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Delete</button>
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

const thStyle = {
  textAlign: 'left',
  padding: '10px 0',
  fontSize: '12px',
  color: '#6B7280',
  fontWeight: '600',
}

const tdStyle = {
  padding: '12px 0',
  fontSize: '14px',
  color: '#374151',
}