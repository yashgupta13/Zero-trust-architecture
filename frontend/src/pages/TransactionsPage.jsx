import { useEffect, useState } from 'react'
import { getTransactions } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

export default function TransactionsPage() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    getTransactions()
      .then(r => setData(r.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = data.filter(t =>
    !search || JSON.stringify(t).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-slide-up space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyber-textLight">Mobile Money Transactions</h1>
          <p className="text-cyber-muted text-sm mt-1">Protected resource — Zero Trust access granted.</p>
        </div>
        <span className="status-approved">✓ Access Granted</span>
      </div>

      <div className="cyber-card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="section-title mb-0">Transaction Records</p>
          <input type="text" placeholder="Search..." value={search}
            onChange={e => setSearch(e.target.value)} className="cyber-input max-w-xs text-sm py-2" />
        </div>

        {loading ? <LoadingSpinner message="Fetching transactions..." /> : (
          <div className="overflow-x-auto rounded-xl border border-cyber-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyber-border bg-cyber-surface">
                  {Object.keys(filtered[0] || {}).map(k => (
                    <th key={k} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-cyber-muted whitespace-nowrap">
                      {k.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td className="px-4 py-8 text-center text-cyber-muted" colSpan={99}>No records.</td></tr>
                ) : filtered.map((row, i) => (
                  <tr key={i} className="border-b border-cyber-border/40 hover:bg-cyber-card/50 transition-colors">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-4 py-2.5 font-mono text-xs text-cyber-text whitespace-nowrap">{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-cyber-muted font-mono">Showing {filtered.length} records</p>
      </div>
    </div>
  )
}
