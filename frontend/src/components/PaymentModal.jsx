import { useState } from 'react'

const API_BASE = 'http://localhost:8000'

export default function PaymentModal({ event, onClose, onPaid }) {
  const [txn, setTxn]         = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!txn.trim()) { setErr('Transaction reference is required.'); return }
    setLoading(true)
    try {
      await onPaid(txn.trim())
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const qrUrl = event.qr_image_path ? `${API_BASE}${event.qr_image_path}` : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-[rgba(200,169,110,0.2)] rounded-2xl w-full max-w-sm p-6 shadow-2xl">

        <h2 className="font-display text-lg text-white mb-1">Complete Payment</h2>
        <p className="text-muted text-sm mb-5">
          Scan the QR or pay via UPI, then enter your transaction reference below.
        </p>

        {/* Payment info */}
        <div className="bg-surface2 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Amount</span>
            <span className="text-gold font-semibold">₹{event.fee}</span>
          </div>
          {event.upi_id && (
            <div className="flex justify-between items-center">
              <span className="text-muted">UPI ID</span>
              <span className="text-white font-mono text-xs select-all">{event.upi_id}</span>
            </div>
          )}
          {event.payee_name && (
            <div className="flex justify-between">
              <span className="text-muted">Payee</span>
              <span className="text-white">{event.payee_name}</span>
            </div>
          )}
        </div>

        {/* QR code */}
        <div className="flex justify-center mb-5">
          {qrUrl ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={qrUrl}
                alt="UPI QR Code"
                className="w-44 h-44 object-contain rounded-xl border border-[rgba(200,169,110,0.25)] bg-white p-2 shadow-md"
              />
              <p className="text-muted text-xs">Scan with any UPI app</p>
            </div>
          ) : (
            <div className="w-36 h-36 bg-surface2 border border-[rgba(255,255,255,0.07)] rounded-xl flex flex-col items-center justify-center gap-2 text-muted">
              <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-xs">No QR uploaded</span>
              <span className="text-xs opacity-60">Use UPI ID above</span>
            </div>
          )}
        </div>

        {/* Transaction reference form */}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Transaction Reference / UTR</label>
            <input
              className="input font-mono"
              required
              placeholder="e.g. 426789123456"
              value={txn}
              onChange={e => setTxn(e.target.value)}
            />
            <p className="text-muted text-xs mt-1">
              Find this in your UPI app under payment history.
            </p>
          </div>
          {err && <p className="text-evred text-xs bg-evred/10 px-3 py-2 rounded-lg">{err}</p>}

          <div className="bg-evamber/10 border border-evamber/20 rounded-lg px-3 py-2 text-xs text-evamber">
            ⏳ Your registration will show as <b>Pending</b> until the organizer verifies your payment.
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[rgba(255,255,255,0.1)] text-muted text-sm hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 btn-gold py-2.5 disabled:opacity-60">
              {loading ? 'Submitting…' : "I've Paid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
