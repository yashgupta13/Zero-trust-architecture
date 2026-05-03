export default function TrustScoreBar({ score }) {
  const pct = Math.round((score || 0) * 100)
  const color =
    pct >= 75 ? 'bg-cyber-emerald' :
    pct >= 50 ? 'bg-cyber-cyan'    :
    pct >= 30 ? 'bg-cyber-yellow'  : 'bg-cyber-red'

  const label =
    pct >= 75 ? 'High Trust'   :
    pct >= 50 ? 'Medium Trust' :
    pct >= 30 ? 'Low Trust'    : 'Untrusted'

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-cyber-muted font-mono uppercase tracking-wider">Trust Score</span>
        <span className={`text-xs font-bold font-mono ${
          pct >= 75 ? 'text-cyber-emerald' :
          pct >= 50 ? 'text-cyber-cyan'    :
          pct >= 30 ? 'text-cyber-yellow'  : 'text-cyber-red'
        }`}>{pct}% — {label}</span>
      </div>
      <div className="w-full h-2 bg-cyber-surface rounded-full overflow-hidden border border-cyber-border">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
