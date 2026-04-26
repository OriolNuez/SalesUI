import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import {
  getAccounts, createAccount, updateAccount, deleteAccount,
  addAction, updateAction, deleteAction, logActivity
} from '../api'

const ACTION_TYPES = ['task', 'call', 'meeting', 'email']
const STATUS_COLORS = {
  pending: 'badge-amber',
  'in-progress': 'badge-blue',
  done: 'badge-green'
}
const TYPE_ICONS = {
  call: '📞',
  meeting: '🤝',
  email: '✉️',
  task: '✅'
}

function isOverdue(dueDate) {
  return dueDate && dayjs(dueDate).isBefore(dayjs(), 'day')
}
function isDueToday(dueDate) {
  return dueDate && dayjs(dueDate).isSame(dayjs(), 'day')
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)
  const [filter, setFilter] = useState('all') // all | overdue | today | thisWeek
  const [newAccount, setNewAccount] = useState({ name: '', contact: '', email: '', phone: '', sector: '', notes: '' })
  const [newAction, setNewAction] = useState({ text: '', dueDate: '', priority: 'normal', type: 'task', notes: '' })
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getAccounts()
    setAccounts(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Refresh selected account when accounts change
  useEffect(() => {
    if (selectedAccount) {
      const updated = accounts.find(a => a.id === selectedAccount.id)
      if (updated) setSelectedAccount(updated)
    }
  }, [accounts])

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    if (!newAccount.name.trim()) return
    await createAccount(newAccount)
    setNewAccount({ name: '', contact: '', email: '', phone: '', sector: '', notes: '' })
    setShowAddAccount(false)
    load()
  }

  const handleDeleteAccount = async (id) => {
    if (!confirm('Delete this account?')) return
    await deleteAccount(id)
    if (selectedAccount?.id === id) setSelectedAccount(null)
    load()
  }

  const handleAddAction = async (e) => {
    e.preventDefault()
    if (!newAction.text.trim() || !selectedAccount) return
    await addAction(selectedAccount.id, newAction)
    setNewAction({ text: '', dueDate: '', priority: 'normal', type: 'task', notes: '' })
    setShowAddAction(false)
    load()
  }

  const handleCompleteAction = async (action) => {
    const newStatus = action.status === 'done' ? 'pending' : 'done'
    await updateAction(selectedAccount.id, action.id, { status: newStatus })

    // Auto-log to objectives
    if (newStatus === 'done') {
      const today = dayjs().format('YYYY-MM-DD')
      if (action.type === 'call') {
        await logActivity({ objectiveId: 'obj-7', value: 1, note: action.text, date: today, source: 'accounts' })
      } else if (action.type === 'meeting') {
        await logActivity({ objectiveId: 'obj-3', value: 1, note: action.text, date: today, source: 'accounts' })
      }
    }
    load()
  }

  const handleDeleteAction = async (actionId) => {
    await deleteAction(selectedAccount.id, actionId)
    load()
  }

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.contact.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filter === 'all') return true
    const actions = acc.actions || []
    if (filter === 'overdue') return actions.some(a => a.status !== 'done' && isOverdue(a.dueDate))
    if (filter === 'today') return actions.some(a => a.status !== 'done' && isDueToday(a.dueDate))
    if (filter === 'thisWeek') return actions.some(a => a.status !== 'done' && a.dueDate &&
      dayjs(a.dueDate).isAfter(dayjs().subtract(1, 'day')) &&
      dayjs(a.dueDate).isBefore(dayjs().add(7, 'day')))
    return true
  })

  const selectedActions = selectedAccount?.actions || []
  const pendingActions = selectedActions.filter(a => a.status !== 'done')
  const doneActions = selectedActions.filter(a => a.status === 'done')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Accounts</h1>
        <button onClick={() => setShowAddAccount(true)} className="btn-primary">+ Add Account</button>
      </div>

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">New Account</h2>
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="label">Company Name *</label>
                <input className="input" placeholder="Acme Corp" value={newAccount.name}
                  onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Contact Name</label>
                  <input className="input" placeholder="John Smith" value={newAccount.contact}
                    onChange={e => setNewAccount({ ...newAccount, contact: e.target.value })} />
                </div>
                <div>
                  <label className="label">Sector</label>
                  <input className="input" placeholder="Technology" value={newAccount.sector}
                    onChange={e => setNewAccount({ ...newAccount, sector: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="john@acme.com" value={newAccount.email}
                    onChange={e => setNewAccount({ ...newAccount, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="+1 555 0000" value={newAccount.phone}
                    onChange={e => setNewAccount({ ...newAccount, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows={2} value={newAccount.notes}
                  onChange={e => setNewAccount({ ...newAccount, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Create Account</button>
                <button type="button" onClick={() => setShowAddAccount(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Account List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <div className="card p-4 space-y-3">
            <input
              className="input"
              placeholder="Search accounts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {['all', 'overdue', 'today', 'thisWeek'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    filter === f ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'overdue' ? '🔴 Overdue' : f === 'today' ? '📅 Today' : '📆 This Week'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="card text-center text-gray-400 py-8">
              {accounts.length === 0 ? 'No accounts yet. Add your first account!' : 'No accounts match your filter.'}
            </div>
          ) : (
            filteredAccounts.map(acc => {
              const overdueCount = (acc.actions || []).filter(a => a.status !== 'done' && isOverdue(a.dueDate)).length
              const pendingCount = (acc.actions || []).filter(a => a.status !== 'done').length
              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccount(acc)}
                  className={`card cursor-pointer transition-all hover:shadow-md ${
                    selectedAccount?.id === acc.id ? 'ring-2 ring-navy-900' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{acc.name}</h3>
                      {acc.contact && <p className="text-sm text-gray-500">{acc.contact}</p>}
                      {acc.sector && <p className="text-xs text-gray-400">{acc.sector}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      {overdueCount > 0 && <span className="badge-red">{overdueCount} overdue</span>}
                      {pendingCount > 0 && <span className="badge-amber">{pendingCount} pending</span>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Last activity: {dayjs(acc.lastActivity).format('MMM D, YYYY')}
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Account Detail */}
        <div className="lg:col-span-3">
          {!selectedAccount ? (
            <div className="card flex items-center justify-center h-64 text-gray-400">
              Select an account to view details
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account Header */}
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedAccount.name}</h2>
                    {selectedAccount.contact && <p className="text-gray-600">{selectedAccount.contact}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                      {selectedAccount.email && <span>✉️ {selectedAccount.email}</span>}
                      {selectedAccount.phone && <span>📞 {selectedAccount.phone}</span>}
                      {selectedAccount.sector && <span className="badge-blue">{selectedAccount.sector}</span>}
                    </div>
                    {selectedAccount.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">{selectedAccount.notes}</p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteAccount(selectedAccount.id)} className="btn-danger text-xs">
                    Delete
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title mb-0">Actions ({pendingActions.length} pending)</h3>
                  <button onClick={() => setShowAddAction(!showAddAction)} className="btn-primary text-xs">
                    + Add Action
                  </button>
                </div>

                {/* Add Action Form */}
                {showAddAction && (
                  <form onSubmit={handleAddAction} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div>
                      <label className="label">Action *</label>
                      <input className="input" placeholder="What needs to be done?" value={newAction.text}
                        onChange={e => setNewAction({ ...newAction, text: e.target.value })} autoFocus />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="label">Type</label>
                        <select className="input" value={newAction.type}
                          onChange={e => setNewAction({ ...newAction, type: e.target.value })}>
                          {ACTION_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Due Date</label>
                        <input className="input" type="date" value={newAction.dueDate}
                          onChange={e => setNewAction({ ...newAction, dueDate: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Priority</label>
                        <select className="input" value={newAction.priority}
                          onChange={e => setNewAction({ ...newAction, priority: e.target.value })}>
                          <option value="high">High</option>
                          <option value="normal">Normal</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary text-xs">Add Action</button>
                      <button type="button" onClick={() => setShowAddAction(false)} className="btn-secondary text-xs">Cancel</button>
                    </div>
                  </form>
                )}

                {/* Pending Actions */}
                {pendingActions.length === 0 && doneActions.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No actions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingActions.map(action => (
                      <div key={action.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                        isOverdue(action.dueDate) ? 'border-red-200 bg-red-50' :
                        isDueToday(action.dueDate) ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'
                      }`}>
                        <input type="checkbox" checked={false} onChange={() => handleCompleteAction(action)}
                          className="mt-0.5 w-4 h-4 cursor-pointer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {TYPE_ICONS[action.type]} {action.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {action.dueDate && (
                              <span className={`text-xs ${isOverdue(action.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                {isOverdue(action.dueDate) ? '⚠️ ' : ''}Due {dayjs(action.dueDate).format('MMM D')}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              action.priority === 'high' ? 'bg-red-100 text-red-700' :
                              action.priority === 'low' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                            }`}>{action.priority}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteAction(action.id)} className="text-gray-300 hover:text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* Done Actions */}
                    {doneActions.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                          Show {doneActions.length} completed action{doneActions.length > 1 ? 's' : ''}
                        </summary>
                        <div className="space-y-2 mt-2">
                          {doneActions.map(action => (
                            <div key={action.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                              <input type="checkbox" checked={true} onChange={() => handleCompleteAction(action)}
                                className="w-4 h-4 cursor-pointer" />
                              <p className="text-sm text-gray-400 line-through flex-1">
                                {TYPE_ICONS[action.type]} {action.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Made with Bob
