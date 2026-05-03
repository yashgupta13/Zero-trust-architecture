import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApprovers } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

export default function PAMPage({ user }) {
  const navigate = useNavigate()
  const [approvers, setApprovers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState(null)

  const [form, setForm] = useState({
    resource_name:      'Resource 1',
    reason_for_access:  '',
    access_duration:    '',
    approvers:          [],
  })

  useEffect(() => {
    getApprovers()
      .then(r => setApprovers(r.data?.approvers || []))
      .catch(() => setError('Could not load approvers list.'))
      .finally(() => setLoading(false))
  }, [])

  const toggleApprover = (email) => {
    setForm(f => ({
      ...f,
      approvers: f.approvers.includes(email)
        ? f.approvers.filter(a => a !== email)
        : [...f.approvers, email],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.approvers.length < 1) { setError('Select at least one approver.'); return }
    setSubmitting(true); setError(null)
    try {
      const body = new URLSearchParams()
      body.append('resource_name',     form.resource_name)
      body.append('reason_for_access', form.reason_for_access)
      body.append('access_duration',   form.access_duration)
      form.approvers.forEach(a => body.append('approvers', a))

      const res = await fetch('/privilegedAccess', { method: 'POST', body, credentials: 'include' })
      if (res.ok || res.redirected) navigate('/approval-status')
      else setError('Submission failed. Ensure the backend is running.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-slide-up space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cyber-textLight">Privileged Access Management</h1>
        <p className="text-cyber-muted text-sm mt-1">Request Just-In-Time access to privileged tasks and resources.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="cyber-card space-y-6">
            <p className="section-title">PAM Request Form</p>

            {error && (
              <div className="p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="cyber-label">Privileged Resource / Task</label>
              <select
                className="cyber-select"
                value={form.resource_name}
                onChange={e => setForm(f => ({ ...f, resource_name: e.target.value }))}
                required
              >
                <option value="Resource 1">System Security Policies Configuration</option>
              </select>
            </div>

            <div>
              <label className="cyber-label">Reason for Access</label>
              <textarea
                className="cyber-textarea"
                rows={4}
                placeholder="Describe why you need this access..."
                value={form.reason_for_access}
                onChange={e => setForm(f => ({ ...f, reason_for_access: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="cyber-label">Access Duration (minutes, 1–100)</label>
              <input
                type="number" min="1" max="100"
                className="cyber-input"
                placeholder="e.g. 30"
                value={form.access_duration}
                onChange={e => setForm(f => ({ ...f, access_duration: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="cyber-label">Select Approvers (min. 1)</label>
              {loading ? (
                <LoadingSpinner message="Loading approvers..." />
              ) : approvers.length === 0 ? (
                <p className="text-cyber-muted text-sm font-mono">No approvers found.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {approvers.map(email => (
                    <label key={email} className="flex items-center gap-3 p-3 rounded-lg bg-cyber-surface border border-cyber-border hover:border-cyber-cyan/30 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        className="accent-[#00d4ff] w-4 h-4"
                        checked={form.approvers.includes(email)}
                        onChange={() => toggleApprover(email)}
                      />
                      <span className="text-sm text-cyber-text font-mono">{email}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit PAM Request'}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <div className="cyber-card space-y-3">
            <p className="section-title">How PAM Works</p>
            {[
              { step: '01', text: 'Submit your request with a reason and duration.' },
              { step: '02', text: 'Selected approvers receive email notifications with secret shares.' },
              { step: '03', text: 'At least 80% of approvers must approve to reconstruct the key.' },
              { step: '04', text: 'Enter the reconstructed key to access the privileged resource.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3 text-sm">
                <span className="text-cyber-cyan font-mono font-bold text-xs mt-0.5 flex-shrink-0">{s.step}</span>
                <p className="text-cyber-muted">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="cyber-card space-y-2">
            <p className="section-title">Session</p>
            <div className="text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-cyber-muted">User</span>
                <span className="text-cyber-text">{user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Role</span>
                <span className="text-cyber-cyan">{user?.user_role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-muted">Approvers selected</span>
                <span className="text-cyber-yellow">{form.approvers.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
