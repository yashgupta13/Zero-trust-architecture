import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateSecretKey } from '../api/client'

export default function SecretKeyPage() {
  const navigate = useNavigate()
  const [key,       setKey]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      params.append('secret_key', key.trim())
      const res = await fetch('/hidden_resource', {
        method: 'POST',
        body: params,
        credentials: 'include',
      })
      const text = await res.text()
      if (text.trim() === 'Valid') {
        navigate('/configure-policies')
      } else {
        setError('Invalid secret key. Please check your key and try again.')
      }
    } catch {
      setError('Network error. Ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-slide-up flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-3xl mx-auto mb-4 animate-glow">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-cyber-textLight">Enter Secret Key</h1>
          <p className="text-cyber-muted text-sm mt-1">
            Enter the reconstructed secret key to unlock the privileged resource.
          </p>
        </div>

        <div className="cyber-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm">
                ⛔ {error}
              </div>
            )}
            <div>
              <label className="cyber-label">Reconstructed Secret Key</label>
              <input
                type="text"
                className="cyber-input font-mono"
                placeholder="Paste the reconstructed secret key..."
                value={key}
                onChange={e => setKey(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Validating...' : 'Unlock Resource'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-cyber-muted mt-4 font-mono">
          Key validated against the PAM Policy Engine
        </p>
      </div>
    </div>
  )
}
