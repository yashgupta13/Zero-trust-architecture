export default function AccessRequestTable({ requests = [] }) {
  const cols = [
    { key: 'ID',                   label: 'ID' },
    { key: 'user_id',              label: 'User ID' },
    { key: 'resource_requested',   label: 'Resource' },
    { key: 'access_request_time',  label: 'Time' },
    { key: 'public_ip_address',    label: 'IP' },
    { key: 'location',             label: 'Location' },
    { key: 'device_type',          label: 'Device' },
    { key: 'device_OS',            label: 'OS' },
  ]

  return (
    <div className="overflow-x-auto rounded-xl border border-cyber-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cyber-border bg-cyber-surface">
            {cols.map(c => (
              <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-cyber-muted whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={cols.length} className="px-4 py-8 text-center text-cyber-muted text-sm">
                No access requests found.
              </td>
            </tr>
          ) : requests.map((row, i) => (
            <tr key={row.ID || i} className="border-b border-cyber-border/50 hover:bg-cyber-card/50 transition-colors">
              {cols.map(c => (
                <td key={c.key} className="px-4 py-3 font-mono text-xs text-cyber-text whitespace-nowrap max-w-[180px] truncate">
                  {row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
