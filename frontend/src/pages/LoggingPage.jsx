import { useEffect, useState } from 'react'
import { getAccessRequests } from '../api/client'
import AccessRequestTable from '../components/AccessRequestTable'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'

export default function LoggingPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    getAccessRequests()
      .then(r => setRequests(r.data || []))
      .catch(() => setError('Failed to load access logs.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = requests.filter(r =>
    search === '' ||
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  )

  const devices   = [...new Set(requests.map(r => r.device_type))].length
  const locations = [...new Set(requests.map(r => r.location))].length

  return (
    <div className="animate-slide-up space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cyber-textLight">Audit Logs</h1>
        <p className="text-cyber-muted text-sm mt-1">Real-time access request monitoring and forensic audit trail.</p>
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Events"   value={requests.length} sub="All access attempts"   icon="📊" accent="cyan" />
          <StatCard title="Unique Devices" value={devices}          sub="Distinct device types" icon="💻" accent="purple" />
          <StatCard title="Locations"      value={locations}         sub="Distinct geographies"  icon="🌍" accent="emerald" />
          <StatCard title="Last Request"   value={requests.length ? requests[requests.length-1]?.access_request_time?.split(' ')[1] || '—' : '—'} sub="Most recent" icon="⏱️" accent="yellow" />
        </div>
      )}

      <div className="cyber-card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="section-title mb-0">Access Request Log</p>
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="cyber-input max-w-xs text-sm py-2"
          />
        </div>

        {loading && <LoadingSpinner message="Fetching audit logs..." />}
        {error   && <p className="text-cyber-red text-sm">{error}</p>}
        {!loading && !error && <AccessRequestTable requests={filtered} />}

        {!loading && !error && (
          <p className="text-xs text-cyber-muted font-mono">
            Showing {filtered.length} of {requests.length} records
          </p>
        )}
      </div>
    </div>
  )
}
