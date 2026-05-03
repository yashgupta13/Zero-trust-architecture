import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [show,    setShow]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
        return
      }
      onLogin(data)      // update App.jsx user state
      navigate('/home')
    } catch {
      setError('Network error — ensure Flask is running.')
    } finally {
      setLoading(false)
    }
  }

  const DEMO_USERS = [
    { label: 'Policy Admin', username: 'admin_user',     password: 'admin123' },
    { label: 'Approver',     username: 'approver_alice', password: 'alice123' },
    { label: 'Security Viewer', username: 'viewer_bob',  password: 'bob123'   },
  ]

  return (
    <div className="min-h-screen bg-cyber-bg grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center mx-auto mb-4 animate-glow">
            <span className="text-3xl font-black text-cyber-cyan font-mono">ZT</span>
          </div>
          <h1 className="text-3xl font-bold text-cyber-textLight text-glow-cyan">CyberDome</h1>
          <p className="text-cyber-muted text-sm mt-1">Zero Trust Network Access Platform</p>
        </div>

        {/* Card */}
        <div className="cyber-card space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-cyber-textLight">Sign In</h2>
            <p className="text-xs text-cyber-muted mt-0.5">Authenticate to access the ZTA dashboard</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm flex items-center gap-2">
              <span>⛔</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="cyber-label">Username</label>
              <input
                id="login-username"
                type="text"
                className="cyber-input"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="cyber-label">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={show ? 'text' : 'password'}
                  className="cyber-input pr-12"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-text text-xs"
                  tabIndex={-1}
                >
                  {show ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="border-t border-cyber-border pt-4">
            <p className="text-xs text-cyber-muted mb-2 font-mono">Quick fill — demo users:</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map(u => (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => setForm({ username: u.username, password: u.password })}
                  className="text-xs px-2 py-1.5 rounded-lg bg-cyber-surface border border-cyber-border hover:border-cyber-cyan/40 hover:text-cyber-cyan text-cyber-muted transition-all"
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-cyber-muted/60 mt-6 font-mono">
          Secured by Zero Trust Policy Engine · v1.0
        </p>
      </div>
    </div>
  )
}
