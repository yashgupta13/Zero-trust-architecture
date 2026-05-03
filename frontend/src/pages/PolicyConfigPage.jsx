import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { savePolicyConfig } from '../api/client'

const DEFAULT = {
  userIdentityWeight:      '0.5',
  authScoreWeight:         '0.5',
  contextScoreWeight:      '0.5',
  expScoreWeight:          '0.5',
  approverThreshold:       '0.9',
  adminThreshold:          '0.6',
  securityViewerThreshold: '0.4',
  signInRiskThreshold:     '0.5',
  periodStartInput:        '00:00:00',
  periodEndInput:          '06:00:00',
  highRiskLocations:       [''],
  mediumRiskLocations:     [''],
  lowRiskLocations:        [''],
}

export default function PolicyConfigPage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState(DEFAULT)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addLocation = (key) => setForm(f => ({ ...f, [key]: [...f[key], ''] }))
  const setLocation = (key, i, v) => setForm(f => {
    const arr = [...f[key]]; arr[i] = v; return { ...f, [key]: arr }
  })

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(false)
    try {
      await savePolicyConfig(form)
      setSuccess(true)
      setTimeout(() => navigate('/home'), 1500)
    } catch {
      setError('Failed to save configurations. Ensure the backend is running.')
    } finally {
      setSaving(false)
    }
  }

  const WeightRow = ({ label, id }) => (
    <div className="flex items-center justify-between py-3 border-b border-cyber-border/50 last:border-0">
      <span className="text-sm text-cyber-text">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="range" min="0" max="1" step="0.1"
          value={form[id]}
          onChange={e => set(id, e.target.value)}
          className="w-28 accent-[#00d4ff]"
        />
        <span className="text-cyber-cyan font-mono text-sm w-8 text-right">{parseFloat(form[id]).toFixed(1)}</span>
      </div>
    </div>
  )

  const ThresholdRow = ({ label, id, color = 'cyan' }) => {
    const cls = { cyan: 'text-cyber-cyan', yellow: 'text-cyber-yellow', emerald: 'text-cyber-emerald' }
    return (
      <div className="flex items-center justify-between py-3 border-b border-cyber-border/50 last:border-0">
        <span className="text-sm text-cyber-text">{label}</span>
        <div className="flex items-center gap-3">
          <input type="range" min="0" max="1" step="0.1"
            value={form[id]} onChange={e => set(id, e.target.value)}
            className="w-28 accent-[#00d4ff]" />
          <span className={`font-mono text-sm w-8 text-right ${cls[color]}`}>
            {parseFloat(form[id]).toFixed(1)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cyber-textLight">Policy Configuration</h1>
        <p className="text-cyber-muted text-sm mt-1">Configure ZTA security policies, trust score weights, and access thresholds.</p>
      </div>

      {success && (
        <div className="p-4 rounded-lg bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald text-sm">
          ✅ Configurations saved successfully! Redirecting...
        </div>
      )}
      {error && (
        <div className="p-4 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trust weights */}
        <div className="cyber-card space-y-1">
          <p className="section-title mb-2">Trust Algorithm Weights</p>
          <WeightRow label="User Identity Score Weight"    id="userIdentityWeight" />
          <WeightRow label="Authentication Score Weight"   id="authScoreWeight" />
          <WeightRow label="Contextual Score Weight"       id="contextScoreWeight" />
          <WeightRow label="Experience Score Weight"       id="expScoreWeight" />
        </div>

        {/* Role thresholds */}
        <div className="cyber-card space-y-1">
          <p className="section-title mb-2">Trust Score Thresholds by Role</p>
          <ThresholdRow label="Approver"              id="approverThreshold"       color="cyan" />
          <ThresholdRow label="Policy Administrator"  id="adminThreshold"          color="yellow" />
          <ThresholdRow label="Security Viewer"       id="securityViewerThreshold" color="emerald" />
          <ThresholdRow label="Sign-in Risk Threshold" id="signInRiskThreshold"    color="cyan" />
        </div>

        {/* Time window */}
        <div className="cyber-card space-y-4">
          <p className="section-title">Suspicious Access Time Window</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cyber-label">Period Start</label>
              <input type="text" className="cyber-input" placeholder="HH:MM:SS"
                value={form.periodStartInput} onChange={e => set('periodStartInput', e.target.value)} />
            </div>
            <div>
              <label className="cyber-label">Period End</label>
              <input type="text" className="cyber-input" placeholder="HH:MM:SS"
                value={form.periodEndInput} onChange={e => set('periodEndInput', e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-cyber-muted">Access requests within this window receive a lower context score.</p>
        </div>

        {/* Geolocation risk */}
        <div className="cyber-card space-y-4">
          <p className="section-title">Geolocation Risk</p>
          {[
            { key: 'highRiskLocations',   label: 'High Risk',   color: 'text-cyber-red'     },
            { key: 'mediumRiskLocations', label: 'Medium Risk', color: 'text-cyber-yellow'  },
            { key: 'lowRiskLocations',    label: 'Low Risk',    color: 'text-cyber-emerald' },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className={`cyber-label ${color}`}>{label} Locations (Country Codes)</label>
              <div className="space-y-2 mt-1">
                {form[key].map((val, i) => (
                  <input key={i} type="text" className="cyber-input" placeholder="e.g. KE, US"
                    value={val} onChange={e => setLocation(key, i, e.target.value)} />
                ))}
                <button type="button" onClick={() => addLocation(key)}
                  className="text-xs text-cyber-cyan hover:underline font-mono">
                  + Add location
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={() => setForm(DEFAULT)}>Reset Defaults</button>
        <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configurations'}
        </button>
      </div>
    </div>
  )
}
