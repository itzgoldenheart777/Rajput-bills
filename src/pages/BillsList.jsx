import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllBills, deleteBill } from '../lib/supabase'

export default function BillsList() {
  const navigate = useNavigate()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { loadBills() }, [])

  async function loadBills() {
    try {
      const data = await getAllBills()
      setBills(data || [])
    } catch (e) {
      setError(`Failed to load bills: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this bill?')) return
    setDeleting(id)
    try {
      await deleteBill(id)
      setBills(b => b.filter(bill => bill.id !== id))
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = bills.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (b.client_name || '').toLowerCase().includes(q) ||
      (b.bill_no || '').includes(search) ||
      (b.route || '').toLowerCase().includes(q) ||
      (b.car_no || '').toLowerCase().includes(q)
    )
  })

  const totalRevenue = bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)

  const now = new Date()
  const thisMonthCount = bills.filter(b => {
    if (!b.created_at) return false
    const d = new Date(b.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 3, height: 28, background: 'var(--accent)', borderRadius: 2 }} />
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700 }}>All Bills</h1>
        </div>
        <p style={{ color: 'var(--text2)', marginLeft: 15, paddingLeft: 12 }}>
          {bills.length} bills · Total Revenue: ₹{totalRevenue.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Bills" value={bills.length} icon="📋" />
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon="💰" />
        <StatCard label="This Month" value={thisMonthCount} icon="📅" />
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by client name, bill no., route or car no..."
          style={{ maxWidth: 440 }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ color: 'var(--text2)', textAlign: 'center', padding: 60 }}>Loading bills...</div>
      ) : error ? (
        <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid var(--red)', borderRadius: 12, padding: 24, color: 'var(--red)' }}>
          <strong>Error:</strong> {error}
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)' }}>
            Make sure your Supabase credentials are set in the <code>.env</code> file and the <code>bills</code> table exists (run <code>supabase_schema.sql</code>).
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
          {search ? 'No bills match your search.' : 'No bills yet. Create your first bill!'}
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '130px 1fr 1fr 110px 110px 90px 60px',
            padding: '12px 20px',
            background: 'var(--surface2)',
            borderBottom: '1px solid var(--border)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text3)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
          }}>
            <span>Bill No.</span>
            <span>Client</span>
            <span>Route</span>
            <span>Car No.</span>
            <span>Date</span>
            <span>Amount</span>
            <span></span>
          </div>

          {filtered.map((bill, i) => (
            <div
              key={bill.id}
              onClick={() => navigate(`/bill/${bill.id}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '130px 1fr 1fr 110px 110px 90px 60px',
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.12s',
                alignItems: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent2)' }}>
                #{bill.bill_no}
              </span>
              <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                {bill.client_name}
              </span>
              <span style={{ color: 'var(--text2)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                {bill.route}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{bill.car_no}</span>
              <span style={{ color: 'var(--text2)', fontSize: 12 }}>{bill.date}</span>
              <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 14 }}>
                {bill.amount ? `₹${Number(bill.amount).toLocaleString('en-IN')}` : '—'}
              </span>
              <button
                onClick={e => handleDelete(bill.id, e)}
                disabled={deleting === bill.id}
                style={{
                  background: 'rgba(224,85,85,0.1)',
                  border: '1px solid rgba(224,85,85,0.3)',
                  color: 'var(--red)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {deleting === bill.id ? '...' : 'Del'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div>
        <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-head)' }}>{value}</div>
      </div>
    </div>
  )
}
