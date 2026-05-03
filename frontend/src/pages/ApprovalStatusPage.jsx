import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApprovalStatus, reconstructSecret } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ApprovalStatusPage() {
  const navigate = useNavigate()
  const [status, setStatus]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [timeLeft, setTimeLeft] = useState(null)
  const [secret, setSecret]     = useState('')
  const intervalRef = useRef(null)

  const fetchStatus = async () => {
    try {
      const r = await getApprovalStatus()
      setStatus(r.data)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 5000)
    return () => clearInterval(intervalRef.current)
  }, [])

  // Countdown
  useEffect(() => {
    if (!status?.expiration_time) return
    const target = new Date(status.expiration_time).getTime()
    const tick = setInterval(() => {
      const diff = target - Date.now()
      if (diff <= 0) {
        setTimeLeft('Expired')
        clearInterval(tick)
      } else {
        const m = Math.floor(diff / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${m}m ${s}s`)
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [status?.expiration_time])

  const handleReconstruct = async () => {
    try {
      const r = await reconstructSecret()
      if (r.data?.reconstructed_secret) {
        setSecret(r.data.reconstructed_secret)
      } else if (r.data?.ERR_THRESH) {
        alert('Approval threshold not yet reached!')
      }
    } catch {
      alert('Error reconstructing secret.')
    }
  }

  if (loading) return <LoadingSpinner message="Fetching approval status..." />

  if (!status) return (
    <div className="animate-slide-up">
      <div className="cyber-card text-center py-12">
        <p className="text-cyber-muted text-lg">No active PAM requests found.</p>
        <button onClick={() => navigate('/privileged-access')} className="btn-primary mt-4">
          Submit a PAM Request
        </button>
      </div>
    </div>
  )

  const approved = parseInt(status.approval_info?.split('/')[0]) || 0
  const total    = parseInt(status.approval_info?.split('/')[1]) || 0
  const pct      = total > 0 ? Math.round((approved / total) * 100) : 0

  return (
    <div className="animate-slide-up space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cyber-textLight">PAM Approval Status</h1>
        <p className="text-cyber-muted text-sm mt-1">Monitor real-time approval progress for your privileged access request.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Approval progress */}
        <div className="md:col-span-2 cyber-card space-y-4">
          <p className="section-title">Approval Progress</p>
          <div className="flex justify-between items-center">
            <span className="text-cyber-textLight font-semibold">{status.approval_info}</span>
            <span className="text-xs font-mono text-cyber-cyan">{pct}%</span>
          </div>
          <div className="w-full h-3 bg-cyber-surface rounded-full overflow-hidden border border-cyber-border">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-cyber-emerald' : 'bg-cyber-cyan'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-cyber-muted">
            At least <span className="text-cyber-yellow font-semibold">{status.threshold}</span> approvals (80%) needed to reconstruct the secret key.
          </p>

          {status.message && (
            <div className="p-3 rounded-lg bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald text-sm">
              ✅ {status.message}
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button onClick={fetchStatus} className="btn-secondary text-sm">
              ↻ Refresh
            </button>
            {pct >= 80 && (
              <button onClick={handleReconstruct} className="btn-success text-sm">
                🔐 Reconstruct Secret Key
              </button>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className="cyber-card space-y-4">
          <p className="section-title">Access Window</p>
          <div className="text-center py-4">
            <p className={`text-4xl font-bold font-mono ${timeLeft === 'Expired' ? 'text-cyber-red' : 'text-cyber-cyan'}`}>
              {timeLeft || '—'}
            </p>
            <p className="text-xs text-cyber-muted mt-2">Time remaining</p>
          </div>
          {timeLeft === 'Expired' && (
            <div className="p-2 rounded bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-xs text-center">
              Access window expired
            </div>
          )}
        </div>
      </div>

      {/* Secret Key */}
      {(secret || status.reconstructed_secret) && (
        <div className="cyber-card space-y-4">
          <p className="section-title">Reconstructed Secret Key</p>
          <textarea
            readOnly
            rows={3}
            className="cyber-textarea font-mono text-cyber-emerald bg-cyber-emerald/5 border-cyber-emerald/30"
            value={secret || status.reconstructed_secret}
          />
          <button
            onClick={() => navigate('/enter-secret')}
            className="btn-primary"
          >
            🔓 Enter Secret Key to Access Resource
          </button>
        </div>
      )}
    </div>
  )
}
