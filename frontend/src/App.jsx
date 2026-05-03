import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getMe } from './api/client'

import Sidebar             from './components/Sidebar'
import LoadingSpinner      from './components/LoadingSpinner'

import LoginPage           from './pages/LoginPage'
import HomePage            from './pages/HomePage'
import ResourceSelectionPage from './pages/ResourceSelectionPage'
import TransactionsPage    from './pages/TransactionsPage'
import TokensPage          from './pages/TokensPage'
import LoggingPage         from './pages/LoggingPage'
import PAMPage             from './pages/PAMPage'
import ApprovalStatusPage  from './pages/ApprovalStatusPage'
import ApproverPage        from './pages/ApproverPage'
import PolicyConfigPage    from './pages/PolicyConfigPage'
import SecretKeyPage       from './pages/SecretKeyPage'

export default function App() {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    getMe()
      .then(r => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])  // only check on mount, not every route change

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <LoadingSpinner message="Verifying session..." />
      </div>
    )
  }

  // Not logged in → show login regardless of route
  if (!user) {
    return (
      <div className="min-h-screen bg-cyber-bg">
        <Routes>
          <Route path="*" element={<LoginPage onLogin={setUser} />} />
        </Routes>
      </div>
    )
  }

  // Logged in → show full app with sidebar
  return (
    <div className="min-h-screen bg-cyber-bg grid-bg">
      <Sidebar user={user} onLogout={() => setUser(null)} />
      <main className="ml-64 p-8 min-h-screen">
        <Routes>
          <Route path="/"                   element={<Navigate to="/home" replace />} />
          <Route path="/home"               element={<HomePage user={user} />} />
          <Route path="/resource-selection" element={<ResourceSelectionPage user={user} />} />
          <Route path="/resource-1"         element={<TransactionsPage />} />
          <Route path="/resource-2"         element={<TokensPage />} />
          <Route path="/logging"            element={<LoggingPage />} />
          <Route path="/privileged-access"  element={<PAMPage user={user} />} />
          <Route path="/approval-status"    element={<ApprovalStatusPage />} />
          <Route path="/approve"            element={<ApproverPage user={user} />} />
          <Route path="/configure-policies" element={<PolicyConfigPage />} />
          <Route path="/enter-secret"       element={<SecretKeyPage />} />
          <Route path="*"                   element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  )
}
