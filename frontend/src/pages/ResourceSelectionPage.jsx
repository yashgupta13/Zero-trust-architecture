import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitAccessRequest } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

const RESOURCES = [
  {
    id: 'Resource 1',
    title: '01. Mobile Money Transactions',
    desc: 'View and audit mobile money transaction records',
    icon: '💳',
    route: '/resource-1',
  },
  {
    id: 'Resource 2',
    title: '02. System API Keys & Tokens',
    desc: 'Securely access system API keys and fintech service tokens',
    icon: '🔑',
    route: '/resource-2',
  },
]

export default function ResourceSelectionPage({ user }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [error, setError]     = useState(null)

  const handleRequest = async (resource) => {
    if (loading) return
    setLoading(resource.id)
    setError(null)

    const ua     = navigator.userAgent
    const osRaw  = navigator.platform
    const device = /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/.test(ua) ? 'Mobile' : 'Desktop'

    const payload = {
      userId:          user?.user_id || '',
      intent:          'Access Request',
      resource:        resource.id,
      time:            new Date().toLocaleString(),
      userAgent:       ua,
      operatingSystem: osRaw,
      deviceType:      device,
      public_ip:       '',      // populated server-side
      location:        '',      // populated server-side
      device_mac:      '',      // populated server-side
      device_vendor:   '',      // populated server-side
    }

    try {
      const { data } = await submitAccessRequest(payload)
      if (data.verdict === 1) {
        navigate(resource.route)
      } else {
        setError(`Access Denied for "${resource.title}". Your trust score did not meet the required threshold.`)
      }
    } catch (e) {
      setError('An error occurred while processing your access request. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="animate-slide-up space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cyber-textLight">Resource Access</h1>
        <p className="text-cyber-muted text-sm mt-1">
          Select a protected resource — your request will be evaluated in real-time by the ZTA Policy Engine.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="cyber-card">
        <p className="section-title mb-3">Zero Trust Access Flow</p>
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          {['Web UI', '→ Access Proxy', '→ Trust Engine', '→ Policy Engine', '→ Decision'].map((step, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-md ${
              i === 0 ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20' :
              i === 4 ? 'bg-cyber-emerald/10 text-cyber-emerald border border-cyber-emerald/20' :
              'bg-cyber-surface text-cyber-muted border border-cyber-border'
            }`}>{step}</span>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm flex items-start gap-3">
          <span>⛔</span>
          <p>{error}</p>
        </div>
      )}

      {/* Resource cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {RESOURCES.map(res => (
          <button
            key={res.id}
            onClick={() => handleRequest(res)}
            disabled={!!loading}
            className="cyber-card text-left group cursor-pointer hover:border-cyber-cyan/40 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-cyber-cyan/20 transition-colors">
                {res.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-cyber-textLight group-hover:text-cyber-cyan transition-colors mb-1">
                  {res.title}
                </h3>
                <p className="text-xs text-cyber-muted">{res.desc}</p>
                <div className="mt-3 flex items-center gap-2">
                  {loading === res.id ? (
                    <span className="flex items-center gap-2 text-xs text-cyber-cyan font-mono">
                      <span className="w-3 h-3 border border-cyber-cyan border-t-transparent rounded-full animate-spin" />
                      Evaluating trust score...
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-md bg-cyber-surface border border-cyber-border text-cyber-muted font-mono group-hover:border-cyber-cyan/30 group-hover:text-cyber-cyan transition-all">
                      Request Access →
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Device info */}
      <div className="cyber-card">
        <p className="section-title mb-3">Your Device Context (sent with request)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
          {[
            { label: 'Browser',     val: navigator.userAgent.split(')')[0].split('(')[1] },
            { label: 'Platform',    val: navigator.platform },
            { label: 'Device Type', val: /Mobile/.test(navigator.userAgent) ? 'Mobile' : 'Desktop' },
          ].map(f => (
            <div key={f.label}>
              <p className="text-cyber-muted mb-1">{f.label}</p>
              <p className="text-cyber-text truncate">{f.val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
