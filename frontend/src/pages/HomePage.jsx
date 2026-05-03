import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { getMe, getAccessRequests } from '../api/client'

const ROLE_OPTIONS = {
  'Policy Administrator': [
    { id: 'resource-selection', label: '01. Access Protected Resources', desc: 'Securely access sensitive data and services based on zero trust principles.', icon: '🔐', accent: 'cyan',   enabled: true },
    { id: 'privileged-access', label: '02. Configure Security Policies',  desc: 'Request Just-In-Time privileged access to configure security policies.',   icon: '🛡️', accent: 'purple', enabled: true },
    { id: 'logging',           label: '03. Monitoring & Logging',         desc: 'Get full visibility into system logs and access events.',                   icon: '📋', accent: 'emerald',enabled: false },
    { id: 'approve',           label: '04. Approve PAM Requests',         desc: 'Facilitate Just-in-Time access by approving PAM requests.',                icon: '👥', accent: 'yellow', enabled: false },
  ],
  'Security Viewer': [
    { id: 'resource-selection', label: '01. Access Protected Resources', desc: 'Securely access sensitive data and services.', icon: '🔐', accent: 'cyan',    enabled: false },
    { id: 'privileged-access', label: '02. Configure Security Policies',  desc: 'Configure contextual security policies.',     icon: '🛡️', accent: 'purple',  enabled: false },
    { id: 'logging',           label: '03. Monitoring & Logging',         desc: 'Get full visibility into system logs.',       icon: '📋', accent: 'emerald', enabled: true },
    { id: 'approve',           label: '04. Approve PAM Requests',         desc: 'Approve PAM requests.',                       icon: '👥', accent: 'yellow',  enabled: false },
  ],
  'Approver': [
    { id: 'resource-selection', label: '01. Access Protected Resources', desc: 'Securely access sensitive data and services.', icon: '🔐', accent: 'cyan',    enabled: true },
    { id: 'privileged-access', label: '02. Configure Security Policies',  desc: 'Configure contextual security policies.',     icon: '🛡️', accent: 'purple',  enabled: false },
    { id: 'logging',           label: '03. Monitoring & Logging',         desc: 'Get full visibility into system logs.',       icon: '📋', accent: 'emerald', enabled: false },
    { id: 'approve',           label: '04. Approve PAM Requests',         desc: 'Approve PAM requests.',                       icon: '👥', accent: 'yellow',  enabled: true },
  ],
}

const accentClasses = {
  cyan:    { icon: 'text-cyber-cyan    bg-cyber-cyan/10    border-cyber-cyan/20',    title: 'text-cyber-cyan',    hover: 'hover:border-cyber-cyan/50' },
  emerald: { icon: 'text-cyber-emerald bg-cyber-emerald/10 border-cyber-emerald/20', title: 'text-cyber-emerald', hover: 'hover:border-cyber-emerald/50' },
  purple:  { icon: 'text-purple-400    bg-purple-400/10    border-purple-400/20',    title: 'text-purple-400',    hover: 'hover:border-purple-400/50' },
  yellow:  { icon: 'text-cyber-yellow  bg-cyber-yellow/10  border-cyber-yellow/20',  title: 'text-cyber-yellow',  hover: 'hover:border-cyber-yellow/50' },
}

export default function HomePage({ user }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, recent: 0 })

  useEffect(() => {
    getAccessRequests().then(r => {
      const data = r.data || []
      const now = Date.now()
      const recent = data.filter(req => {
        try {
          const t = new Date(req.access_request_time).getTime()
          return now - t < 86400000
        } catch { return false }
      })
      setStats({ total: data.length, recent: recent.length })
    }).catch(() => {})
  }, [])

  const role = user?.user_role || 'Approver'
  const options = ROLE_OPTIONS[role] || ROLE_OPTIONS['Approver']

  return (
    <div className="animate-slide-up space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyber-textLight">
            Welcome back, <span className="text-cyber-cyan">{user?.username}</span>
          </h1>
          <p className="text-cyber-muted text-sm mt-1">Zero Trust Access and Configuration Dashboard</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-emerald/10 border border-cyber-emerald/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-emerald animate-pulse-slow" />
          <span className="text-cyber-emerald text-xs font-semibold">System Active</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Role"           value={role.split(' ')[0]}      sub={role}                   icon="👤" accent="cyan" />
        <StatCard title="Total Requests" value={stats.total}              sub="All time access requests" icon="📊" accent="purple" />
        <StatCard title="Last 24h"       value={stats.recent}             sub="Recent access attempts"  icon="⚡" accent="yellow" />
        <StatCard title="ZTA Status"     value="Active"                   sub="All nodes running"       icon="🛡️" accent="emerald" glow />
      </div>

      {/* Options */}
      <div>
        <p className="section-title mb-4">Select an option</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map(opt => {
            const ac = accentClasses[opt.accent] || accentClasses.cyan
            return (
              <button
                key={opt.id}
                onClick={() => opt.enabled && navigate(`/${opt.id}`)}
                disabled={!opt.enabled}
                className={`cyber-card text-left transition-all duration-200 group ${
                  opt.enabled
                    ? `cursor-pointer ${ac.hover}`
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xl flex-shrink-0 ${ac.icon}`}>
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm ${opt.enabled ? ac.title : 'text-cyber-muted'} mb-1`}>
                      {opt.label}
                    </h3>
                    <p className="text-xs text-cyber-muted leading-relaxed">{opt.desc}</p>
                  </div>
                  {!opt.enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-border text-cyber-muted border border-cyber-border/50 flex-shrink-0">
                      Restricted
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Identity panel */}
      <div className="cyber-card">
        <p className="section-title">Session Identity</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          {[
            { label: 'Username',  val: user?.username },
            { label: 'Email',     val: user?.email },
            { label: 'Role',      val: user?.user_role },
            { label: 'User ID',   val: user?.user_id ? user.user_id.substring(0, 16) + '...' : '—' },
          ].map(f => (
            <div key={f.label}>
              <p className="text-xs text-cyber-muted mb-1">{f.label}</p>
              <p className="text-sm text-cyber-textLight font-mono truncate">{f.val || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
