import { NavLink, useNavigate } from 'react-router-dom'

async function doLogout(onLogout) {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' })
  } catch { /* ignore */ }
  onLogout()
}

const navItems = [
  { to: '/home',                label: 'Dashboard',            icon: '◈' },
  { to: '/resource-selection',  label: 'Access Resources',     icon: '🔐' },
  { to: '/logging',             label: 'Audit Logs',           icon: '📋' },
  { to: '/privileged-access',   label: 'PAM Request',          icon: '🛡️' },
  { to: '/approval-status',     label: 'Approval Status',      icon: '✅' },
  { to: '/approve',             label: 'Approve Requests',     icon: '👥' },
  { to: '/configure-policies',  label: 'Policy Config',        icon: '⚙️' },
]

export default function Sidebar({ user, onLogout }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-cyber-surface border-r border-cyber-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan text-sm font-bold">
            ZT
          </div>
          <div>
            <p className="text-cyber-textLight font-semibold text-sm">CyberDome</p>
            <p className="text-cyber-muted text-xs">Zero Trust Platform</p>
          </div>
        </div>
      </div>

      {/* User badge */}
      {user && (
        <div className="px-4 py-3 mx-3 mt-4 rounded-lg bg-cyber-card border border-cyber-border">
          <p className="text-cyber-textLight text-sm font-medium truncate">{user.username}</p>
          <p className="text-cyber-muted text-xs truncate">{user.email}</p>
          <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 font-mono">
            {user.user_role}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="section-title px-3">Navigation</p>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 font-medium'
                  : 'text-cyber-muted hover:text-cyber-textLight hover:bg-cyber-card'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-cyber-border">
        <button
          onClick={() => doLogout(onLogout)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/5 transition-all duration-150"
        >
          <span>⏻</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
