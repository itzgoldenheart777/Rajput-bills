import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveBill } from '../lib/supabase'
import BillPreview from '../components/BillPreview'
import { useReactToPrint } from 'react-to-print'

const CAR_TYPES = ['Sedan', 'SUV', 'Luxury', 'Mini', 'Tempo Traveller', 'Bus']

function Field({ label, children, half }) {
  return (
    <div style={{ gridColumn: half ? 'span 1' : 'span 2', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ color: 'var(--text2)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SmallField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
      <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
        {children}
      </span>
      <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
    </div>
  )
}

export default function CreateBill() {
  const navigate = useNavigate()
  const printRef = useRef()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const today = new Date()
  const dateStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`
  
  // Auto-generate Bill No via formatted date block
  const randNumStr = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  const defaultBillNo = `${String(today.getFullYear()).slice(-2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${randNumStr}`

  const defaultCarNo = localStorage.getItem('defaultCarNo') || ''

  const [form, setForm] = useState({
    bill_no: defaultBillNo,
    date: dateStr,
    client_name: '',
    route: '',
    duty_slip: '',
    car_type: 'Sedan',
    car_no: defaultCarNo,
    amount: '',
    total_kms: '',
    extra_kms: '',
    extra_kms_rate: '',
    total_hrs: '',
    extra_hrs: '',
    extra_hrs_rate: '',
    outstation: '',
    outstation_extra: '',
    outstation_rate: '',
    toll_parking: '',
    toll_amount: '',
    driver_allowance: '',
    car_used_by: '',
    car_booked_by: '',
    particulars_rate: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Helper calculation to securely format sums
  const parseAmount = (val) => {
    const num = parseFloat(val)
    return isNaN(num) ? 0 : num
  }

  // Derive the total dynamically
  const calculatedTotal = 
    parseAmount(form.amount) + 
    (parseAmount(form.extra_kms) * parseAmount(form.extra_kms_rate)) + 
    (parseAmount(form.extra_hrs) * parseAmount(form.extra_hrs_rate)) + 
    (parseAmount(form.outstation_extra) * parseAmount(form.outstation_rate)) + 
    parseAmount(form.toll_amount) + 
    parseAmount(form.driver_allowance)

  // react-to-print v2 correct API
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Bill_${form.bill_no || 'Draft'}`,
  })

  const handleSave = async () => {
    if (!form.bill_no || !form.client_name) {
      setError('Bill No. and Client Name are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const saved_bill = await saveBill({
        bill_no: form.bill_no,
        date: form.date,
        client_name: form.client_name,
        route: form.route,
        duty_slip: form.duty_slip,
        car_type: form.car_type,
        car_no: form.car_no,
        amount: calculatedTotal,
        total_kms: form.total_kms,
        extra_kms: form.extra_kms,
        extra_kms_rate: form.extra_kms_rate,
        total_hrs: form.total_hrs,
        extra_hrs: form.extra_hrs,
        extra_hrs_rate: form.extra_hrs_rate,
        outstation: form.outstation,
        outstation_extra: form.outstation_extra,
        outstation_rate: form.outstation_rate,
        toll_parking: form.toll_parking,
        toll_amount: form.toll_amount ? parseFloat(form.toll_amount) : null,
        driver_allowance: form.driver_allowance,
        car_used_by: form.car_used_by,
        car_booked_by: form.car_booked_by,
        particulars_rate: form.particulars_rate,
      })
      setSaved(true)
      setTimeout(() => navigate(`/bill/${saved_bill.id}`), 1200)
    } catch (e) {
      setError(`Save failed: ${e.message}. Check your Supabase credentials in .env`)
    } finally {
      setSaving(false)
    }
  }

  const inp = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    padding: '10px 14px',
    borderRadius: 8,
    outline: 'none',
    width: '100%',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 3, height: 28, background: 'var(--accent)', borderRadius: 2 }} />
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700 }}>
            Generate New Bill
          </h1>
        </div>
        <p style={{ color: 'var(--text2)', marginLeft: 15, paddingLeft: 12 }}>
          Fill in the details below. Bill will be saved to the database.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, alignItems: 'start' }}>
        {/* ── FORM ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>

          <SectionTitle>Bill Information</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <Field label="Bill No." half>
              <input style={inp} value={form.bill_no} onChange={e => set('bill_no', e.target.value)} placeholder="e.g. 310326001" />
            </Field>
            <Field label="Date" half>
              <input style={inp} value={form.date} onChange={e => set('date', e.target.value)} placeholder="DD/MM/YYYY" />
            </Field>
            <Field label="Client Name (M/s.)">
              <input style={inp} value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Terravista Advisitory" />
            </Field>
            <Field label="Route">
              <input style={inp} value={form.route} onChange={e => set('route', e.target.value)} placeholder="Marol to Igatpuri - Shahapur" />
            </Field>
            <Field label="Duty Slip" half>
              <input style={inp} value={form.duty_slip} onChange={e => set('duty_slip', e.target.value)} placeholder="Slip No." />
            </Field>
            <Field label="Car Type" half>
              <select style={inp} value={form.car_type} onChange={e => set('car_type', e.target.value)}>
                {CAR_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Car Number" half>
              <input style={inp} value={form.car_no} onChange={e => set('car_no', e.target.value)} placeholder="MH48CQ3165" />
            </Field>
            <Field label="Base Amount (Rs.)" half>
              <input style={inp} type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="5000" />
            </Field>
            <Field label="Particulars (4Hrs/8Hrs label)">
              <input style={inp} value={form.particulars_rate} onChange={e => set('particulars_rate', e.target.value)} placeholder="4 Hrs. 40 Km. / 8Hrs. 80Km." />
            </Field>
          </div>

          <SectionTitle>Kilometers &amp; Hours</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
            <SmallField label="Total KMs">
              <input style={inp} value={form.total_kms} onChange={e => set('total_kms', e.target.value)} placeholder="430" />
            </SmallField>
            <SmallField label="Extra KMs">
              <input style={inp} value={form.extra_kms} onChange={e => set('extra_kms', e.target.value)} />
            </SmallField>
            <SmallField label="Extra KM Rate @">
              <input style={inp} value={form.extra_kms_rate} onChange={e => set('extra_kms_rate', e.target.value)} />
            </SmallField>
            <SmallField label="Total Hrs.">
              <input style={inp} value={form.total_hrs} onChange={e => set('total_hrs', e.target.value)} />
            </SmallField>
            <SmallField label="Extra Hrs.">
              <input style={inp} value={form.extra_hrs} onChange={e => set('extra_hrs', e.target.value)} />
            </SmallField>
            <SmallField label="Extra Hr Rate @">
              <input style={inp} value={form.extra_hrs_rate} onChange={e => set('extra_hrs_rate', e.target.value)} />
            </SmallField>
          </div>

          <SectionTitle>Outstation</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
            <SmallField label="Outstation">
              <input style={inp} value={form.outstation} onChange={e => set('outstation', e.target.value)} />
            </SmallField>
            <SmallField label="Extra">
              <input style={inp} value={form.outstation_extra} onChange={e => set('outstation_extra', e.target.value)} />
            </SmallField>
            <SmallField label="Rate @">
              <input style={inp} value={form.outstation_rate} onChange={e => set('outstation_rate', e.target.value)} />
            </SmallField>
          </div>

          <SectionTitle>Extras &amp; Allowances</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <SmallField label="Toll / Parking Desc.">
              <input style={inp} value={form.toll_parking} onChange={e => set('toll_parking', e.target.value)} />
            </SmallField>
            <SmallField label="Toll / Parking Amount">
              <input style={inp} type="number" value={form.toll_amount} onChange={e => set('toll_amount', e.target.value)} />
            </SmallField>
            <SmallField label="Driver Food/Overnight Allowance">
              <input style={inp} value={form.driver_allowance} onChange={e => set('driver_allowance', e.target.value)} />
            </SmallField>
          </div>

          <SectionTitle>Car Usage</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <SmallField label="Car Used By">
              <input style={inp} value={form.car_used_by} onChange={e => set('car_used_by', e.target.value)} />
            </SmallField>
            <SmallField label="Car Booked By">
              <input style={inp} value={form.car_booked_by} onChange={e => set('car_booked_by', e.target.value)} />
            </SmallField>
          </div>

          {error && (
            <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid var(--red)', borderRadius: 10, padding: '12px 16px', color: 'var(--red)', fontSize: 13, marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ background: 'var(--surface2)', padding: '16px 20px', borderRadius: 12, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auto-Calculated Total</span>
             <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text1)' }}>₹ {calculatedTotal.toLocaleString('en-IN')}</span>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                background: saved ? 'var(--green)' : 'var(--accent)',
                color: '#000', border: 'none', borderRadius: 10,
                padding: '12px 28px', fontSize: 14, fontWeight: 700,
                opacity: saving ? 0.7 : 1, transition: 'all 0.2s',
                cursor: saving || saved ? 'not-allowed' : 'pointer',
              }}
            >
              {saved ? '✓ Saved!' : saving ? 'Saving...' : '💾 Save to Database'}
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: 'transparent', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: 10,
                padding: '12px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              🖨️ Print Bill
            </button>
          </div>
        </div>

        {/* ── LIVE PREVIEW PANEL ── */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ color: 'var(--text2)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
            Live Preview
          </div>
          {/* Scaled preview container - fixed overflow */}
          <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border)', background: '#fff' }}>
            <div style={{ transform: 'scale(0.60)', transformOrigin: 'top left', width: '167%', pointerEvents: 'none' }}>
              <div ref={printRef}>
                <BillPreview data={{ ...form, amount: calculatedTotal }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
