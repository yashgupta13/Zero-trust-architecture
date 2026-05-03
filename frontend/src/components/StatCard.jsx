export default function StatCard({ title, value, sub, icon, accent = 'cyan', glow = false }) {
  const colors = {
    cyan:    { text: 'text-cyber-cyan',    bg: 'bg-cyber-cyan/10',    border: 'border-cyber-cyan/20' },
    emerald: { text: 'text-cyber-emerald', bg: 'bg-cyber-emerald/10', border: 'border-cyber-emerald/20' },
    red:     { text: 'text-cyber-red',     bg: 'bg-cyber-red/10',     border: 'border-cyber-red/20' },
    yellow:  { text: 'text-cyber-yellow',  bg: 'bg-cyber-yellow/10',  border: 'border-cyber-yellow/20' },
    purple:  { text: 'text-purple-400',    bg: 'bg-purple-400/10',    border: 'border-purple-400/20' },
  }
  const c = colors[accent] || colors.cyan

  return (
    <div className={`cyber-card flex flex-col gap-3 animate-fade-in ${glow ? 'animate-glow' : ''}`}>
      <div className="flex items-start justify-between">
        <p className="section-title">{title}</p>
        <span className={`w-9 h-9 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center text-lg`}>
          {icon}
        </span>
      </div>
      <p className={`text-3xl font-bold font-mono ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-cyber-muted">{sub}</p>}
    </div>
  )
}
