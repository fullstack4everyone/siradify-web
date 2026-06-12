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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ color: '#0A1F44', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>
            Products
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            {products.length} products in inventory
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditProduct(null)
            setForm({ name: '', price: '', stock: '', category: '', image_url: '' })
          }}
          style={{
            background: '#F5A623',
            color: '#0A1F44',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#FEE2E2', color: '#DC2626',
          padding: '12px 16px', borderRadius: '8px',
          fontSize: '14px', marginBottom: '16px'
        }}>{error}</div>
      )}

      {success && (
        <div style={{
          background: '#D1FAE5', color: '#065F46',
          padding: '12px 16px', borderRadius: '8px',
          fontSize: '14px', marginBottom: '16px'
        }}>{success}</div>
      )}

      {showForm && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ color: '#0A1F44', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>
            {editProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#1A1A2E', marginBottom: '6px' }}>
                  Product Name
                </label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Chai"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#1A1A2E', marginBottom: '6px' }}>
                  Price (KES)
                </label>
                <input
                  style={inputStyle}
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 50"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#1A1A2E', marginBottom: '6px' }}>
                  Stock Quantity
                </label>
                <input
                  style={inputStyle}
                  type="number"
                  value={form.stock}
                  onChange={e => setForm({ ...form, stock: e.target.value })}
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#1A1A2E', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  style={inputStyle}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#1A1A2E', marginBottom: '6px' }}>
                  Image URL (optional)
                </label>
                <input
                  style={inputStyle}
                  value={form.image_url}
                  onChange={e => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {form.image_url && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={form.image_url}
                  alt="preview"
                  style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E5E7EB' }}
                  onError={e => e.target.style.display = 'none'}
                />
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Image preview</p>
              </div>
            )}

            <button
              type="submit"
              style={{
                background: '#0A1F44',
                color: '#ffffff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {editProduct ? 'Update Product' : 'Save Product'}
            </button>
          </form>
        </div>
      )}

      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        {loading ? (
          <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px 0' }}>Loading products...</p>
        ) : products.length === 0 ? (
          <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px 0' }}>No products yet. Add your first product.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>IMAGE</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>NAME</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>PRICE</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>STOCK</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>CATEGORY</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td style={{ padding: '12px 0' }}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E5E7EB' }}
                        onError={e => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      backgroundColor: '#F9FAFB',
                      display: product.image_url ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      border: '1px solid #E5E7EB'
                    }}>
                      {getEmoji(product.category)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: '#0A1F44', fontWeight: '600' }}>{product.name}</td>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: '#1A1A2E' }}>KES {parseFloat(product.price).toLocaleString()}</td>
                  <td style={{ padding: '12px 0' }}>
                    <span style={{
                      background: product.stock > 10 ? '#D1FAE5' : '#FEE2E2',
                      color: product.stock > 10 ? '#065F46' : '#DC2626',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {product.stock} units
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: '#1A1A2E', textTransform: 'capitalize' }}>{product.category}</td>
                  <td style={{ padding: '12px 0' }}>
                    <button
                      onClick={() => handleEdit(product)}
                      style={{
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        marginRight: '8px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      style={{
                        background: '#FEE2E2',
                        color: '#DC2626',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}