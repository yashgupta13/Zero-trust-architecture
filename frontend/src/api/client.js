// Axios-based API client — all calls go through Vite proxy → Flask :5000
import axios from 'axios'

const api = axios.create({
  baseURL: '/',
  withCredentials: true, // send Flask session cookie
  headers: { 'Content-Type': 'application/json' },
})

// ── Auth ─────────────────────────────────────────────────────────────────────
export const getMe = ()              => api.get('/api/me')
export const logout = ()             => { window.location.href = '/revokeToken' }
export const loginRedirect = ()      => { window.location.href = '/login' }

// ── Access Requests ───────────────────────────────────────────────────────────
export const submitAccessRequest = (data) =>
  api.post('/receive-access-request', data)

export const getAccessRequests = () => api.get('/api/access-requests')

// ── Policy Configuration ─────────────────────────────────────────────────────
export const savePolicyConfig = (data) =>
  api.post('/receivePolicyConfigurations', data)

// ── PAM ───────────────────────────────────────────────────────────────────────
export const getApprovers = ()       => api.get('/api/approvers')
export const submitPAMRequest = (data) =>
  api.post('/privilegedAccess', data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

// ── Approval ──────────────────────────────────────────────────────────────────
export const getApprovalStatus = ()  => api.get('/approval_status')
export const reconstructSecret = ()  =>
  api.post('/approval_status', { action: 'reconstruct_secret' })

export const approveRequest = (data) => api.post('/approve_request', data)

// ── Resources ─────────────────────────────────────────────────────────────────
export const getTransactions = ()    => api.get('/api/transactions')
export const getTokens = ()          => api.get('/api/tokens')

// ── Secret Key ────────────────────────────────────────────────────────────────
export const validateSecretKey = (key) =>
  api.post('/hidden_resource', { secret_key: key }, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

export default api
