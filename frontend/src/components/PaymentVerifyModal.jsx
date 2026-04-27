import { useState, useEffect } from 'react'
import client from '../api/client'

function fmtTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function PaymentVerifyModal({ event, onClose }) {
  const [payments, setPayments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [processing, setProcessing] = useState(null)

  function load() {
    setLoading(true)
    client.get(`/events/${event.event_id}/pending-payments`)
      .then(r => setPayments(r.data))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [event.event_id])

  async function verify(regId) {
    setProcessing(regId)
    try {
      await client.patch(`/registrations/${regId}/verify-payment`)
      setPayments(p => p.filter(x => x.registration_id !== regId))
    } catch (ex) {
      alert(ex.response?.data?.detail || 'Failed to verify payment.')
    } finally { setProcessing(null) }
  }

  async function reject(regId, name) {
    if (!confirm(`Reject payment from ${name}? Their registration will be cancelled.`)) return
    setProcessing(regId)
    try {
      await client.patch(`/registrations/${regId}/reject-payment`)
      setPayments(p => p.filter(x => x.registration_id !== regId))
    } catch (ex) {
      alert(ex.response?.data?.detail || 'Failed to reject payment.')
    } finally { setProcessing(null) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-[rgba(200,169,110,0.2)] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[rgba(255,255,255,0.07)]">
          <div>
            <h2 className="font-display text-lg text-white">Verify Payments</h2>
            <p className="text-muted text-xs mt-0.5 truncate max-w-xs">{event.title}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white text-xl leading-none px-1 mt-0.5">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-evgreen/10 border border-evgreen/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-evgreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white text-sm font-medium">All clear!</p>
              <p className="text-muted text-xs mt-1">No pending payments to verify.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted text-xs mb-4">
                {payments.length} payment{payments.length !== 1 ? 's' : ''} awaiting verification.
                Check each transaction reference in your UPI app before approving.
              </p>
              {payments.map(p => (
                <div
                  key={p.registration_id}
                  className="bg-surface2 rounded-xl p-4 border border-[rgba(255,255,255,0.05)]"
                >
                  {/* Student info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.full_name}</p>
                      <p className="text-muted text-xs">
                        {p.reg_no || 'External student'}
                        {p.team_name ? <span className="ml-2 text-gold/70">· Team: {p.team_name}</span> : ''}
                      </p>
                      <p className="text-muted text-xs mt-0.5">Submitted {fmtTime(p.created_at)}</p>
                    </div>
                  </div>

                  {/* Transaction reference */}
                  <div className="bg-bg/60 rounded-lg px-3 py-2.5 mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-muted text-[11px] uppercase tracking-wide mb-0.5">Transaction Reference</p>
                      {p.transaction_reference ? (
                        <p className="text-evamber font-mono text-sm font-medium select-all">
                          {p.transaction_reference}
                        </p>
                      ) : (
                        <p className="text-evred text-xs italic">No reference provided</p>
                      )}
                    </div>
                    {p.paid_at && (
                      <p className="text-muted text-xs whitespace-nowrap flex-shrink-0">{fmtTime(p.paid_at)}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => verify(p.registration_id)}
                      disabled={processing === p.registration_id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-evgreen/15 text-evgreen border border-evgreen/25 hover:bg-evgreen/25 transition-colors disabled:opacity-50"
                    >
                      {processing === p.registration_id ? (
                        <div className="w-3 h-3 border border-evgreen border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Verify & Confirm
                    </button>
                    <button
                      onClick={() => reject(p.registration_id, p.full_name)}
                      disabled={processing === p.registration_id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-evred/10 text-evred border border-evred/20 hover:bg-evred/20 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
