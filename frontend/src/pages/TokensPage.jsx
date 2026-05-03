import { useEffect, useState } from 'react'
import { getTokens } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

export default function TokensPage() {
  const [tokens,  setTokens]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTokens()
      .then(r => setTokens(r.data || []))
      .catch(() => setTokens([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="animate-slide-up space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyber-textLight">System API Keys & Access Tokens</h1>
          <p className="text-cyber-muted text-sm mt-1">Protected resource — Zero Trust access granted.</p>
        </div>
        <span className="status-approved">✓ Access Granted</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? <LoadingSpinner message="Fetching tokens..." /> :
          tokens.length === 0 ? (
            <div className="cyber-card text-center py-8 text-cyber-muted">No tokens found.</div>
          ) : tokens.map((token, i) => (
            <div key={i} className="cyber-card space-y-3">
              <div className="flex items-start justify-between">
                <p className="text-cyber-textLight font-semibold text-sm">{token.name || token.service || `Token ${i + 1}`}</p>
                <span className="status-approved text-xs">Active</span>
              </div>
              {Object.entries(token).map(([k, v]) => (
                <div key={k} className="flex gap-3 items-start">
                  <span className="text-xs text-cyber-muted font-mono w-32 flex-shrink-0">{k}:</span>
                  <span className="text-xs text-cyber-text font-mono break-all">{String(v)}</span>
                </div>
              ))}
            </div>
          ))
        }
      </div>
    </div>
  )
}
