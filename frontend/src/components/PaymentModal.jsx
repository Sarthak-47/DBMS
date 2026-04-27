import { useState } from 'react'

export default function PaymentModal({ event, onClose, onPaid }) {
  const [txn, setTxn]     = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]     = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!txn.trim()) { setErr('Transaction reference is required.'); return }
    setLoading(true)
    try {
      await onPaid(txn.trim())
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Payment verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-[rgba(200,169,110,0.2)] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h2 className="font-display text-lg text-white mb-1">Complete Payment</h2>
        <p className="text-muted text-sm mb-5">
          Scan the QR or pay via UPI, then enter your transaction reference.
        </p>

        <div className="bg-surface2 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Amount</span>
            <span className="text-gold font-medium">₹{event.fee}</span>
          </div>
          {event.upi_id && (
            <div className="flex justify-between">
              <span className="text-muted">UPI ID</span>
              <span className="text-white font-mono text-xs">{event.upi_id}</span>
            </div>
          )}
          {event.payee_name && (
            <div className="flex justify-between">
              <span className="text-muted">Payee</span>
              <span className="text-white">{event.payee_name}</span>
            </div>
          )}
        </div>

        {/* QR placeholder */}
        <div className="flex justify-center mb-5">
          <div className="w-32 h-32 bg-surface3 border border-[rgba(255,255,255,0.07)] rounded-xl flex items-center justify-center text-muted text-xs">
            QR Code
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Transaction Reference</label>
            <input className="input" required placeholder="e.g. TXN20260120ABC"
              value={txn} onChange={(e) => setTxn(e.target.value)} />
          </div>
          {err && <p className="text-evred text-xs bg-evred/10 px-3 py-2 rounded-lg">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[rgba(255,255,255,0.1)] text-muted text-sm hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 btn-gold py-2.5 disabled:opacity-60">
              {loading ? 'Verifying…' : "I've Paid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
