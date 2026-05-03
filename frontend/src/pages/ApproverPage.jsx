import { useEffect, useState } from 'react'
import { approveRequest } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ApproverPage({ user }) {
  const [secretShare, setSecretShare] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [result,      setResult]      = useState(null)
  const [error,       setError]       = useState(null)

  const handleAction = async (action) => {
    if (!secretShare.trim()) { setError('Please paste your secret share from the email.'); return }
    setSubmitting(true); setError(null)
    try {
      const r = await approveRequest({
        action,
        approverId: user?.user_id,
        secretShare: secretShare.trim(),
      })
      setResult({ action, message: r.data || 'Action recorded.' })
    } catch {
      setError('Failed to submit approval. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (user?.user_role !== 'Approver') {
    return (
      <div className="animate-slide-up cyber-card text-center py-12">
        <p className="text-cyber-red text-lg">⛔ Access Restricted</p>
        <p className="text-cyber-muted text-sm mt-2">Only users with the Approver role can access this page.</p>
      </div>
    )
  }

  return (
    <div className="animate-slide-up space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cyber-textLight">Approve PAM Request</h1>
        <p className="text-cyber-muted text-sm mt-1">Review and approve or deny privileged access requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 cyber-card space-y-6">
          <p className="section-title">Your Decision</p>

          {result ? (
            <div className={`p-4 rounded-lg border text-sm ${
              result.action === 'approve'
                ? 'bg-cyber-emerald/10 border-cyber-emerald/30 text-cyber-emerald'
                : 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red'
            }`}>
              {result.action === 'approve' ? '✅ Approved!' : '❌ Denied.'} Your decision has been recorded.
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="cyber-label">Your Secret Share (from email)</label>
                <textarea
                  className="cyber-textarea font-mono text-sm"
                  rows={5}
                  placeholder="Paste the Base64 secret share you received via email..."
                  value={secretShare}
                  onChange={e => setSecretShare(e.target.value)}
                />
                <p className="text-xs text-cyber-muted mt-1">This is the cryptographic share sent to your email for this request.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('approve')}
                  className="btn-success flex-1"
                  disabled={submitting}
                >
                  {submitting ? '...' : '✅ Approve'}
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  className="btn-danger flex-1"
                  disabled={submitting}
                >
                  {submitting ? '...' : '❌ Deny'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="cyber-card space-y-3">
          <p className="section-title">Your Identity</p>
          <div className="space-y-2 text-xs font-mono">
            {[
              { label: 'Name',  val: user?.username },
              { label: 'Email', val: user?.email },
              { label: 'Role',  val: user?.user_role },
              { label: 'ID',    val: user?.user_id?.substring(0, 20) + '...' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-cyber-muted">{f.label}</p>
                <p className="text-cyber-text">{f.val}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-cyber-yellow/10 border border-cyber-yellow/30 text-xs text-cyber-yellow">
            ⚠️ Your approval is bound to your secret share. Do not share it.
          </div>
        </div>
      </div>
    </div>
  )
}
