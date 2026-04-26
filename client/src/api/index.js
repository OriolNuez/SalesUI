import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

// ── Daily ──────────────────────────────────────────────
export const getDay = (date) => api.get(`/daily/${date}`)
export const updateDay = (date, data) => api.put(`/daily/${date}`, data)
export const addTask = (date, task) => api.post(`/daily/${date}/tasks`, task)
export const updateTask = (date, taskId, data) => api.patch(`/daily/${date}/tasks/${taskId}`, data)
export const deleteTask = (date, taskId) => api.delete(`/daily/${date}/tasks/${taskId}`)
export const updateDiary = (date, data) => api.patch(`/daily/${date}/diary`, data)

// ── Accounts ───────────────────────────────────────────
export const getAccounts = () => api.get('/accounts')
export const getAccount = (id) => api.get(`/accounts/${id}`)
export const createAccount = (data) => api.post('/accounts', data)
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data)
export const deleteAccount = (id) => api.delete(`/accounts/${id}`)
export const addAction = (accountId, data) => api.post(`/accounts/${accountId}/actions`, data)
export const updateAction = (accountId, actionId, data) => api.patch(`/accounts/${accountId}/actions/${actionId}`, data)
export const deleteAction = (accountId, actionId) => api.delete(`/accounts/${accountId}/actions/${actionId}`)

// ── Deals ──────────────────────────────────────────────
export const getDeals = () => api.get('/deals')
export const getDeal = (id) => api.get(`/deals/${id}`)
export const createDeal = (data) => api.post('/deals', data)
export const updateDeal = (id, data) => api.put(`/deals/${id}`, data)
export const deleteDeal = (id) => api.delete(`/deals/${id}`)
export const getPipelineSummary = () => api.get('/deals/summary/pipeline')

// ── Objectives ─────────────────────────────────────────
export const getObjectives = () => api.get('/objectives')
export const updateObjective = (id, data) => api.put(`/objectives/${id}`, data)
export const getLogs = (params) => api.get('/objectives/logs', { params })
export const logActivity = (data) => api.post('/objectives/log', data)
export const deleteLog = (id) => api.delete(`/objectives/logs/${id}`)
export const getScores = (period, date) => api.get('/objectives/scores', { params: { period, date } })
export const exportObjectives = () => api.get('/objectives/export', { responseType: 'blob' })

// ── Settings ───────────────────────────────────────────
export const getSettings = () => api.get('/settings')
export const updateSettings = (data) => api.put('/settings', data)

// ── Campaigns ──────────────────────────────────────────
export const getCampaigns = () => api.get('/campaigns')
export const getCampaign = (id) => api.get(`/campaigns/${id}`)
export const createCampaign = (data) => api.post('/campaigns', data)
export const updateCampaign = (id, data) => api.put(`/campaigns/${id}`, data)
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`)
export const addAccountToCampaign = (campaignId, accountId) => api.post(`/campaigns/${campaignId}/accounts`, { accountId })
export const removeAccountFromCampaign = (campaignId, accountId) => api.delete(`/campaigns/${campaignId}/accounts/${accountId}`)
export const getCampaignOpportunities = (id) => api.get(`/campaigns/${id}/opportunities`)

// ── Events ─────────────────────────────────────────────
export const getEvents = () => api.get('/events')
export const getEvent = (id) => api.get(`/events/${id}`)
export const createEvent = (data) => api.post('/events', data)
export const updateEvent = (id, data) => api.put(`/events/${id}`, data)
export const deleteEvent = (id) => api.delete(`/events/${id}`)
export const addAccountToEvent = (eventId, accountId) => api.post(`/events/${eventId}/accounts`, { accountId })
export const removeAccountFromEvent = (eventId, accountId) => api.delete(`/events/${eventId}/accounts/${accountId}`)

// ── Invitations ────────────────────────────────────────
export const getEventInvitations = (eventId) => api.get(`/events/${eventId}/invitations`)
export const createInvitation = (eventId, data) => api.post(`/events/${eventId}/invitations`, data)
export const updateInvitation = (id, data) => api.put(`/events/invitations/${id}`, data)
export const deleteInvitation = (id) => api.delete(`/events/invitations/${id}`)

// ── Weekly Tasks ───────────────────────────────────────
export const getWeeklyTasks = () => api.get('/weekly-tasks')
export const getWeeklyTask = (id) => api.get(`/weekly-tasks/${id}`)
export const createWeeklyTask = (data) => api.post('/weekly-tasks', data)
export const updateWeeklyTask = (id, data) => api.put(`/weekly-tasks/${id}`, data)
export const deleteWeeklyTask = (id) => api.delete(`/weekly-tasks/${id}`)

// ── Activities ─────────────────────────────────────────
export const getActivities = (params) => api.get('/activities', { params })
export const getActivity = (id) => api.get(`/activities/${id}`)
export const createActivity = (data) => api.post('/activities', data)
export const updateActivity = (id, data) => api.put(`/activities/${id}`, data)
export const deleteActivity = (id) => api.delete(`/activities/${id}`)
export const getActivityStats = (params) => api.get('/activities/stats', { params })

// ── Cadences ───────────────────────────────────────────
export const getCadenceTemplates = () => api.get('/cadences/templates')
export const getCadenceTemplate = (id) => api.get(`/cadences/templates/${id}`)
export const createCadenceTemplate = (data) => api.post('/cadences/templates', data)
export const updateCadenceTemplate = (id, data) => api.put(`/cadences/templates/${id}`, data)
export const deleteCadenceTemplate = (id) => api.delete(`/cadences/templates/${id}`)

export const getEnrollments = (params) => api.get('/cadences/enrollments', { params })
export const getEnrollment = (id) => api.get(`/cadences/enrollments/${id}`)
export const createEnrollment = (data) => api.post('/cadences/enrollments', data)
export const updateEnrollmentStatus = (id, status) => api.patch(`/cadences/enrollments/${id}/status`, { status })
export const completeStep = (enrollmentId, stepIndex, data) => api.patch(`/cadences/enrollments/${enrollmentId}/steps/${stepIndex}/complete`, data)
export const skipStep = (enrollmentId, stepIndex, reason) => api.patch(`/cadences/enrollments/${enrollmentId}/steps/${stepIndex}/skip`, { reason })
export const deleteEnrollment = (id) => api.delete(`/cadences/enrollments/${id}`)

export const getEmailTemplates = () => api.get('/cadences/email-templates')
export const createEmailTemplate = (data) => api.post('/cadences/email-templates', data)
export const updateEmailTemplate = (id, data) => api.put(`/cadences/email-templates/${id}`, data)
export const deleteEmailTemplate = (id) => api.delete(`/cadences/email-templates/${id}`)

export const getCadenceStats = () => api.get('/cadences/stats')

export default api

// Made with Bob
