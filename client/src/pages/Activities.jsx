import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActivities, getActivityStats, createActivity, updateActivity, deleteActivity, getAccounts, addAction } from '../api'
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

// Activity type configurations
const ACTIVITY_TYPES = [
  { value: 'call', label: '📞 Call', icon: '📞' },
  { value: 'email', label: '📧 Email', icon: '📧' },
  { value: 'linkedin', label: '💼 LinkedIn', icon: '💼' }
]

// Outcomes by activity type
const CALL_OUTCOMES = [
  { value: 'meeting_scheduled', label: '✅ Meeting Scheduled', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'interested', label: '👍 Interested', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'rejected', label: '❌ Rejected', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'not_interested', label: '👎 Not Interested', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { value: 'voicemail', label: '📞 Voicemail', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'no_answer', label: '🔇 No Answer', color: 'bg-orange-100 text-orange-800 border-orange-300' }
]

const EMAIL_OUTCOMES = [
  { value: 'replied_positive', label: '✅ Replied - Positive', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'replied_neutral', label: '📧 Replied - Neutral', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'replied_negative', label: '❌ Replied - Negative', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'opened', label: '👁️ Opened (No Reply)', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'sent', label: '📬 Sent (Not Opened)', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { value: 'bounced', label: '⚠️ Bounced', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'unsubscribed', label: '🗑️ Unsubscribed', color: 'bg-red-100 text-red-800 border-red-300' }
]

const LINKEDIN_OUTCOMES = [
  { value: 'connection_accepted', label: '✅ Connection Accepted', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'message_replied', label: '💬 Message Replied', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'engaged_content', label: '👍 Engaged with Content', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'pending', label: '⏳ Pending Response', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'connection_declined', label: '❌ Connection Declined', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'message_viewed', label: '👁️ Message Viewed', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { value: 'no_response', label: '📭 No Response', color: 'bg-orange-100 text-orange-800 border-orange-300' }
]

const REJECTION_REASONS = [
  'Budget constraints', 'Wrong timing', 'Using competitor', 'Not decision maker',
  'No authority', 'Already have solution', 'Not interested in product', 'Other'
]

const CALL_PURPOSES = [
  'Discovery', 'Follow-up', 'Demo', 'Negotiation', 'Check-in', 'Closing', 'Support', 'Other'
]

const EMAIL_TYPES = [
  'cold_outreach', 'follow_up', 'proposal', 'meeting_request', 'thank_you', 'other'
]

const LINKEDIN_MESSAGE_TYPES = [
  'connection_request', 'inmail', 'message', 'comment', 'post_engagement'
]

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280']

export default function Activities() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [accounts, setAccounts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [selectedActivityType, setSelectedActivityType] = useState('all')
  const [showInteractionModal, setShowInteractionModal] = useState(false)
  const [showNextStepModal, setShowNextStepModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [nextStepData, setNextStepData] = useState({
    text: '',
    dueDate: '',
    type: 'call',
    notes: ''
  })
  const [filters, setFilters] = useState({
    activityType: '',
    outcome: '',
    accountId: '',
    startDate: '',
    endDate: '',
    search: ''
  })
  
  const [newActivity, setNewActivity] = useState({
    activityType: 'call',
    contactName: '',
    contactPosition: '',
    accountId: '',
    accountName: '',
    linkedInUrl: '',
    phoneNumber: '',
    email: '',
    activityDate: dayjs().format('YYYY-MM-DDTHH:mm'),
    outcome: '',
    notes: '',
    followUpRequired: false,
    followUpDate: '',
    // Call fields
    callDuration: 0,
    callType: 'outbound',
    callPurpose: 'Discovery',
    rejectionReason: '',
    nextMeetingDate: '',
    // Email fields
    emailSubject: '',
    emailType: 'cold_outreach',
    emailSent: false,
    emailOpened: false,
    emailReplied: false,
    emailBounced: false,
    // LinkedIn fields
    linkedInMessageType: 'connection_request',
    linkedInConnectionStatus: 'pending',
    linkedInEngagementType: ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [activitiesRes, accountsRes, statsRes] = await Promise.all([
        getActivities(filters),
        getAccounts(),
        getActivityStats(filters)
      ])
      
      // Activities API returns { data: [...] }, so we need activitiesRes.data.data
      const activitiesData = activitiesRes.data?.data || activitiesRes.data || []
      setActivities(Array.isArray(activitiesData) ? activitiesData : [])
      
      // Accounts API returns array directly
      setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : [])
      
      // Stats API returns { data: {...} }
      setStats(statsRes.data?.data || statsRes.data || null)
      
      console.log('Loaded activities:', activitiesData.length, 'activities')
      console.log('Loaded accounts:', accountsRes.data?.length || 0, 'accounts')
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivities([])
      setAccounts([])
      setStats(null)
    }
    setLoading(false)
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, newActivity)
      } else {
        await createActivity(newActivity)
      }
      setShowAddActivity(false)
      setEditingActivity(null)
      resetForm()
      load()
    } catch (error) {
      console.error('Error saving activity:', error)
    }
  }

  const resetForm = () => {
    setNewActivity({
      activityType: 'call',
      contactName: '',
      contactPosition: '',
      accountId: '',
      accountName: '',
      linkedInUrl: '',
      phoneNumber: '',
      email: '',
      activityDate: dayjs().format('YYYY-MM-DDTHH:mm'),
      outcome: '',
      notes: '',
      followUpRequired: false,
      followUpDate: '',
      callDuration: 0,
      callType: 'outbound',
      callPurpose: 'Discovery',
      rejectionReason: '',
      nextMeetingDate: '',
      emailSubject: '',
      emailType: 'cold_outreach',
      emailSent: false,
      emailOpened: false,
      emailReplied: false,
      emailBounced: false,
      linkedInMessageType: 'connection_request',
      linkedInConnectionStatus: 'pending',
      linkedInEngagementType: ''
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity?')) return
    try {
      await deleteActivity(id)
      load()
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  const handleAddInteraction = (activity) => {
    setSelectedActivity(activity)
    setNewActivity({
      ...newActivity,
      contactName: activity.contactName,
      contactPosition: activity.contactPosition,
      accountId: activity.accountId,
      accountName: activity.accountName,
      email: activity.email,
      phoneNumber: activity.phoneNumber,
      linkedInUrl: activity.linkedInUrl,
      activityDate: dayjs().format('YYYY-MM-DDTHH:mm')
    })
    setShowInteractionModal(true)
  }

  const handleScheduleNextStep = (activity) => {
    setSelectedActivity(activity)
    setNextStepData({
      text: `Follow up with ${activity.contactName}`,
      dueDate: dayjs().add(1, 'week').format('YYYY-MM-DD'),
      type: 'call',
      notes: `Previous interaction: ${activity.activityType} on ${dayjs(activity.activityDate).format('MMM D, YYYY')}`
    })
    setShowNextStepModal(true)
  }

  const handleSubmitNextStep = async (e) => {
    e.preventDefault()
    if (!selectedActivity.accountId) {
      alert('This activity must be linked to an account to schedule a next step')
      return
    }
    try {
      await addAction(selectedActivity.accountId, nextStepData)
      setShowNextStepModal(false)
      setSelectedActivity(null)
      setNextStepData({ text: '', dueDate: '', type: 'call', notes: '' })
      alert('Next step added to account successfully!')
    } catch (error) {
      console.error('Error adding next step:', error)
      alert('Failed to add next step')
    }
  }

  const handleSubmitInteraction = async (e) => {
    e.preventDefault()
    try {
      await createActivity(newActivity)
      setShowInteractionModal(false)
      setSelectedActivity(null)
      resetForm()
      load()
    } catch (error) {
      console.error('Error adding interaction:', error)
    }
  }

  const handleEdit = (activity) => {
    setEditingActivity(activity)
    setNewActivity({
      ...activity,
      activityDate: dayjs(activity.activityDate).format('YYYY-MM-DDTHH:mm'),
      nextMeetingDate: activity.nextMeetingDate ? dayjs(activity.nextMeetingDate).format('YYYY-MM-DDTHH:mm') : '',
      followUpDate: activity.followUpDate ? dayjs(activity.followUpDate).format('YYYY-MM-DDTHH:mm') : ''
    })
    setShowAddActivity(true)
  }

  const handleAccountChange = (accountId) => {
    const account = accounts.find(a => a.id === accountId)
    setNewActivity({
      ...newActivity,
      accountId,
      accountName: account ? account.name : ''
    })
  }

  const getOutcomeOptions = (activityType) => {
    switch (activityType) {
      case 'call': return CALL_OUTCOMES
      case 'email': return EMAIL_OUTCOMES
      case 'linkedin': return LINKEDIN_OUTCOMES
      default: return []
    }
  }

  const getOutcomeLabel = (activityType, outcome) => {
    const outcomes = getOutcomeOptions(activityType)
    const found = outcomes.find(o => o.value === outcome)
    return found ? found.label : outcome
  }

  const getOutcomeColor = (activityType, outcome) => {
    const outcomes = getOutcomeOptions(activityType)
    const found = outcomes.find(o => o.value === outcome)
    return found ? found.color : 'bg-gray-100 text-gray-800'
  }

  const exportToExcel = () => {
    const exportData = activities.map(activity => ({
      'Type': activity.activityType.toUpperCase(),
      'Date': dayjs(activity.activityDate).format('YYYY-MM-DD HH:mm'),
      'Contact': activity.contactName,
      'Position': activity.contactPosition,
      'Account': activity.accountName,
      'Phone': activity.phoneNumber,
      'Email': activity.email,
      'LinkedIn': activity.linkedInUrl,
      'Outcome': getOutcomeLabel(activity.activityType, activity.outcome),
      'Notes': activity.notes,
      // Call-specific
      'Call Duration': activity.activityType === 'call' ? activity.callDuration : '',
      'Call Type': activity.activityType === 'call' ? activity.callType : '',
      // Email-specific
      'Email Subject': activity.activityType === 'email' ? activity.emailSubject : '',
      'Email Opened': activity.activityType === 'email' ? (activity.emailOpened ? 'Yes' : 'No') : '',
      // LinkedIn-specific
      'LinkedIn Type': activity.activityType === 'linkedin' ? activity.linkedInMessageType : '',
      'Connection Status': activity.activityType === 'linkedin' ? activity.linkedInConnectionStatus : '',
      'Follow-up Required': activity.followUpRequired ? 'Yes' : 'No',
      'Follow-up Date': activity.followUpDate ? dayjs(activity.followUpDate).format('YYYY-MM-DD HH:mm') : ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Activities')
    
    // Add summary sheet
    const summaryData = [
      { Metric: 'Total Activities', Value: stats?.totalActivities || 0 },
      { Metric: 'Total Calls', Value: stats?.totalCalls || 0 },
      { Metric: 'Total Emails', Value: stats?.totalEmails || 0 },
      { Metric: 'Total LinkedIn', Value: stats?.totalLinkedIn || 0 },
      { Metric: 'Call Success Rate', Value: `${stats?.callSuccessRate || 0}%` },
      { Metric: 'Email Reply Rate', Value: `${stats?.emailReplyRate || 0}%` },
      { Metric: 'LinkedIn Response Rate', Value: `${stats?.linkedinResponseRate || 0}%` }
    ]
    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
    
    XLSX.writeFile(wb, `activities_export_${dayjs().format('YYYY-MM-DD')}.xlsx`)
  }

  // Prepare chart data
  const activityTypeData = stats ? [
    { name: 'Calls', value: stats.totalCalls, color: CHART_COLORS[0] },
    { name: 'Emails', value: stats.totalEmails, color: CHART_COLORS[1] },
    { name: 'LinkedIn', value: stats.totalLinkedIn, color: CHART_COLORS[2] }
  ].filter(d => d.value > 0) : []

  const trendData = stats?.activitiesTrend ? Object.entries(stats.activitiesTrend).map(([date, counts]) => ({
    date: dayjs(date).format('MMM D'),
    Calls: counts.call || 0,
    Emails: counts.email || 0,
    LinkedIn: counts.linkedin || 0
  })).slice(-14) : []

  const filteredActivities = selectedActivityType === 'all' 
    ? activities 
    : activities.filter(a => a.activityType === selectedActivityType)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading activities...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Activity Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Track calls, emails, and LinkedIn outreach</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/sprint-planner')}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            🎯 Sprint Planner
          </button>
          <button
            onClick={() => {
              setShowAddActivity(true)
              setEditingActivity(null)
              resetForm()
            }}
            className="btn-primary"
          >
            + Log New Activity
          </button>
        </div>
      </div>

      {/* Activity Type Tabs */}
      <div className="bg-white rounded-lg shadow p-1 flex gap-1">
        <button
          onClick={() => setSelectedActivityType('all')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedActivityType === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📊 All Activities
        </button>
        {ACTIVITY_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setSelectedActivityType(type.value)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedActivityType === type.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Activities</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalActivities || 0}</p>
          <div className="mt-2 text-xs text-gray-500">
            <span className="text-green-600">📞 {stats?.totalCalls || 0}</span> · 
            <span className="text-blue-600 ml-1">📧 {stats?.totalEmails || 0}</span> · 
            <span className="text-purple-600 ml-1">💼 {stats?.totalLinkedIn || 0}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Call Success Rate</p>
          <p className="text-2xl font-bold text-green-600">{stats?.callSuccessRate || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.callMeetingsScheduled || 0} meetings scheduled</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email Reply Rate</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.emailReplyRate || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.emailReplied || 0} replies received</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">LinkedIn Response</p>
          <p className="text-2xl font-bold text-purple-600">{stats?.linkedinResponseRate || 0}%</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.linkedinAccepted || 0} connections</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Distribution</h3>
          {activityTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={activityTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No activity data yet
            </div>
          )}
        </div>

        {/* Activity Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Trend (Last 14 Days)</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Calls" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Emails" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="LinkedIn" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No trend data yet
            </div>
          )}
        </div>
      </div>

      {/* Filters and Export */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Search</label>
            <input
              type="text"
              className="input"
              placeholder="Contact, account, subject..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="w-40">
            <label className="label">Activity Type</label>
            <select
              className="input"
              value={filters.activityType}
              onChange={(e) => setFilters({ ...filters, activityType: e.target.value })}
            >
              <option value="">All</option>
              {ACTIVITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="label">Account</label>
            <select
              className="input"
              value={filters.accountId}
              onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
            >
              <option value="">All</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="w-40">
            <label className="label">End Date</label>
            <input
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <button
            onClick={() => setFilters({ activityType: '', outcome: '', accountId: '', startDate: '', endDate: '', search: '' })}
            className="btn-secondary"
          >
            Clear
          </button>
          <button
            onClick={exportToExcel}
            className="btn-primary"
          >
            📊 Export to Excel
          </button>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No activities found. Log your first activity to get started!
                  </td>
                </tr>
              ) : (
                filteredActivities.map(activity => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-2xl">
                        {ACTIVITY_TYPES.find(t => t.value === activity.activityType)?.icon}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{dayjs(activity.activityDate).format('MMM D, YYYY')}</div>
                      <div className="text-xs text-gray-500">{dayjs(activity.activityDate).format('HH:mm')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{activity.contactName}</div>
                      {activity.contactPosition && (
                        <div className="text-xs text-gray-500">{activity.contactPosition}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{activity.accountName || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {activity.activityType === 'call' && activity.callDuration > 0 && (
                        <div>{activity.callDuration} min</div>
                      )}
                      {activity.activityType === 'email' && activity.emailSubject && (
                        <div className="truncate max-w-xs">{activity.emailSubject}</div>
                      )}
                      {activity.activityType === 'linkedin' && activity.linkedInMessageType && (
                        <div className="capitalize">{activity.linkedInMessageType.replace('_', ' ')}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full border ${
                        getOutcomeColor(activity.activityType, activity.outcome)
                      }`}>
                        {getOutcomeLabel(activity.activityType, activity.outcome)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAddInteraction(activity)}
                          className="text-green-600 hover:text-green-800 text-xs font-medium"
                          title="Add follow-up interaction"
                        >
                          + Interaction
                        </button>
                        <button
                          onClick={() => handleScheduleNextStep(activity)}
                          className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                          title="Schedule next step"
                        >
                          📅 Next Step
                        </button>
                        <button
                          onClick={() => handleEdit(activity)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Activity Modal - Continued in next message due to length */}
      {showAddActivity && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingActivity ? 'Edit Activity' : 'Log New Activity'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddActivity(false)
                    setEditingActivity(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Activity Type Selector */}
                <div>
                  <label className="label">Activity Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {ACTIVITY_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNewActivity({ ...newActivity, activityType: type.value, outcome: '' })}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          newActivity.activityType === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-sm font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Contact Name *</label>
                      <input
                        type="text"
                        className="input"
                        value={newActivity.contactName}
                        onChange={(e) => setNewActivity({ ...newActivity, contactName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Position</label>
                      <input
                        type="text"
                        className="input"
                        value={newActivity.contactPosition}
                        onChange={(e) => setNewActivity({ ...newActivity, contactPosition: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Account</label>
                      <select
                        className="input"
                        value={newActivity.accountId}
                        onChange={(e) => handleAccountChange(e.target.value)}
                      >
                        <option value="">Select account...</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Phone Number</label>
                      <input
                        type="tel"
                        className="input"
                        value={newActivity.phoneNumber}
                        onChange={(e) => setNewActivity({ ...newActivity, phoneNumber: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        className="input"
                        value={newActivity.email}
                        onChange={(e) => setNewActivity({ ...newActivity, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Activity Details */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Date & Time *</label>
                      <input
                        type="datetime-local"
                        className="input"
                        value={newActivity.activityDate}
                        onChange={(e) => setNewActivity({ ...newActivity, activityDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Outcome *</label>
                      <select
                        className="input"
                        value={newActivity.outcome}
                        onChange={(e) => setNewActivity({ ...newActivity, outcome: e.target.value })}
                        required
                      >
                        <option value="">Select outcome...</option>
                        {getOutcomeOptions(newActivity.activityType).map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Type-Specific Fields */}
                {newActivity.activityType === 'call' && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Call Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Duration (minutes)</label>
                        <input
                          type="number"
                          className="input"
                          value={newActivity.callDuration}
                          onChange={(e) => setNewActivity({ ...newActivity, callDuration: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="label">Call Type</label>
                        <select
                          className="input"
                          value={newActivity.callType}
                          onChange={(e) => setNewActivity({ ...newActivity, callType: e.target.value })}
                        >
                          <option value="outbound">Outbound</option>
                          <option value="inbound">Inbound</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Purpose</label>
                        <select
                          className="input"
                          value={newActivity.callPurpose}
                          onChange={(e) => setNewActivity({ ...newActivity, callPurpose: e.target.value })}
                        >
                          {CALL_PURPOSES.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      {newActivity.outcome === 'meeting_scheduled' && (
                        <div>
                          <label className="label">Next Meeting Date</label>
                          <input
                            type="datetime-local"
                            className="input"
                            value={newActivity.nextMeetingDate}
                            onChange={(e) => setNewActivity({ ...newActivity, nextMeetingDate: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {newActivity.activityType === 'email' && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Email Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="label">Subject Line</label>
                        <input
                          type="text"
                          className="input"
                          value={newActivity.emailSubject}
                          onChange={(e) => setNewActivity({ ...newActivity, emailSubject: e.target.value })}
                          placeholder="Email subject..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Email Type</label>
                          <select
                            className="input"
                            value={newActivity.emailType}
                            onChange={(e) => setNewActivity({ ...newActivity, emailType: e.target.value })}
                          >
                            {EMAIL_TYPES.map(t => (
                              <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-4 pt-6">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newActivity.emailOpened}
                              onChange={(e) => setNewActivity({ ...newActivity, emailOpened: e.target.checked })}
                              className="rounded"
                            />
                            Opened
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newActivity.emailReplied}
                              onChange={(e) => setNewActivity({ ...newActivity, emailReplied: e.target.checked })}
                              className="rounded"
                            />
                            Replied
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {newActivity.activityType === 'linkedin' && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">LinkedIn Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Message Type</label>
                        <select
                          className="input"
                          value={newActivity.linkedInMessageType}
                          onChange={(e) => setNewActivity({ ...newActivity, linkedInMessageType: e.target.value })}
                        >
                          {LINKEDIN_MESSAGE_TYPES.map(t => (
                            <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Connection Status</label>
                        <select
                          className="input"
                          value={newActivity.linkedInConnectionStatus}
                          onChange={(e) => setNewActivity({ ...newActivity, linkedInConnectionStatus: e.target.value })}
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="declined">Declined</option>
                          <option value="not_sent">Not Sent</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes and Follow-up */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes & Follow-up</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="label">Notes</label>
                      <textarea
                        className="input resize-none"
                        rows={3}
                        value={newActivity.notes}
                        onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                        placeholder="Activity notes..."
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="followUpRequired"
                        checked={newActivity.followUpRequired}
                        onChange={(e) => setNewActivity({ ...newActivity, followUpRequired: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="followUpRequired" className="text-sm text-gray-700">
                        Follow-up required
                      </label>
                    </div>
                    
                    {newActivity.followUpRequired && (
                      <div>
                        <label className="label">Follow-up Date & Time</label>
                        <input
                          type="datetime-local"
                          className="input"
                          value={newActivity.followUpDate}
                          onChange={(e) => setNewActivity({ ...newActivity, followUpDate: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button type="submit" className="btn-primary flex-1">
                    {editingActivity ? 'Update Activity' : 'Log Activity'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddActivity(false)
                      setEditingActivity(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Interaction Modal */}
      {showInteractionModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Add Follow-up Interaction</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Previous: {ACTIVITY_TYPES.find(t => t.value === selectedActivity.activityType)?.label} with {selectedActivity.contactName} on {dayjs(selectedActivity.activityDate).format('MMM D, YYYY')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowInteractionModal(false)
                    setSelectedActivity(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitInteraction} className="space-y-4">
                {/* Activity Type Selector */}
                <div>
                  <label className="label">New Interaction Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {ACTIVITY_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setNewActivity({ ...newActivity, activityType: type.value, outcome: '' })}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          newActivity.activityType === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-sm font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Date & Time *</label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={newActivity.activityDate}
                      onChange={(e) => setNewActivity({ ...newActivity, activityDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Outcome *</label>
                    <select
                      className="input"
                      value={newActivity.outcome}
                      onChange={(e) => setNewActivity({ ...newActivity, outcome: e.target.value })}
                      required
                    >
                      <option value="">Select outcome...</option>
                      {getOutcomeOptions(newActivity.activityType).map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    value={newActivity.notes}
                    onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                    placeholder="Interaction notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button type="submit" className="btn-primary flex-1">
                    Log Interaction
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInteractionModal(false)
                      setSelectedActivity(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Next Step Modal */}
      {showNextStepModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Schedule Next Step</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    For: {selectedActivity.contactName} at {selectedActivity.accountName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowNextStepModal(false)
                    setSelectedActivity(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitNextStep} className="space-y-4">
                <div>
                  <label className="label">Action Description *</label>
                  <input
                    type="text"
                    className="input"
                    value={nextStepData.text}
                    onChange={(e) => setNextStepData({ ...nextStepData, text: e.target.value })}
                    placeholder="e.g., Follow up call, Send proposal, Schedule demo..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Due Date *</label>
                    <input
                      type="date"
                      className="input"
                      value={nextStepData.dueDate}
                      onChange={(e) => setNextStepData({ ...nextStepData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Action Type *</label>
                    <select
                      className="input"
                      value={nextStepData.type}
                      onChange={(e) => setNextStepData({ ...nextStepData, type: e.target.value })}
                      required
                    >
                      <option value="call">📞 Call</option>
                      <option value="email">📧 Email</option>
                      <option value="meeting">🤝 Meeting</option>
                      <option value="task">✅ Task</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    value={nextStepData.notes}
                    onChange={(e) => setNextStepData({ ...nextStepData, notes: e.target.value })}
                    placeholder="Additional context or reminders..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 This action will be added to the <strong>{selectedActivity.accountName}</strong> account and will appear in the Accounts section.
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button type="submit" className="btn-primary flex-1">
                    Schedule Next Step
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNextStepModal(false)
                      setSelectedActivity(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Made with Bob
