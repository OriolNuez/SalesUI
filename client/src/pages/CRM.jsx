import { useState, useEffect, useCallback, useRef } from 'react'
import dayjs from 'dayjs'
import { getDeals, createDeal, updateDeal, deleteDeal, logActivity, getAccounts, createAccount } from '../api'

const STAGES = ['Engage', 'Qualify', 'Design', 'Propose', 'Negotiate', 'Closing', 'Won', 'Lost']

const STAGE_COLORS = {
  Engage: 'bg-blue-50 border-blue-200',
  Qualify: 'bg-indigo-50 border-indigo-200',
  Design: 'bg-purple-50 border-purple-200',
  Propose: 'bg-amber-50 border-amber-200',
  Negotiate: 'bg-orange-50 border-orange-200',
  Closing: 'bg-green-50 border-green-200',
  Won: 'bg-emerald-50 border-emerald-200',
  Lost: 'bg-gray-50 border-gray-200'
}

const STAGE_HEADER_COLORS = {
  Engage: 'bg-blue-500',
  Qualify: 'bg-indigo-500',
  Design: 'bg-purple-500',
  Propose: 'bg-amber-500',
  Negotiate: 'bg-orange-500',
  Closing: 'bg-green-500',
  Won: 'bg-emerald-600',
  Lost: 'bg-gray-400'
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val || 0)
}

function DaysInStage({ deal }) {
  const days = dayjs().diff(dayjs(deal.updatedAt), 'day')
  return (
    <span className={`text-xs ${days > 14 ? 'text-red-500' : days > 7 ? 'text-amber-500' : 'text-gray-400'}`}>
      {days}d in stage
    </span>
  )
}

// Account autocomplete input
function AccountAutocomplete({ value, onChange, onSelect, accounts }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 8)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <input
        className="input"
        placeholder="Type account name..."
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && value && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {filtered.map(a => (
            <button
              key={a.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between"
              onMouseDown={() => { onSelect(a); setOpen(false) }}
            >
              <span className="font-medium">{a.name}</span>
              {a.sector && <span className="text-xs text-gray-400">{a.sector}</span>}
            </button>
          ))}
          {!accounts.find(a => a.name.toLowerCase() === value.toLowerCase()) && (
            <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
              ✨ Will create new account "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Available products list
const AVAILABLE_PRODUCTS = [
  'Watsonx Orchestrate',
  'Watsonx.ai',
  'Watsonx.gov',
  'IBM Bob',
  'Planning Analytics',
  'Guardium'
]

// Products dropdown selector with custom input
function ProductsInput({ value, onChange }) {
  const [input, setInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const add = (product) => {
    if (product && !value.includes(product)) {
      onChange([...value, product])
    }
  }

  const addCustom = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInput('')
      setShowCustom(false)
    }
  }

  const remove = (p) => onChange(value.filter(x => x !== p))

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {value.map(p => (
          <span key={p} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
            {p}
            <button type="button" onClick={() => remove(p)} className="hover:text-red-500">×</button>
          </span>
        ))}
      </div>
      
      {!showCustom ? (
        <div className="flex gap-2">
          <select
            className="input flex-1"
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setShowCustom(true)
              } else if (e.target.value) {
                add(e.target.value)
              }
              e.target.value = ''
            }}
          >
            <option value="">+ Add Product</option>
            {AVAILABLE_PRODUCTS.filter(p => !value.includes(p)).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value="__custom__">➕ Add Custom Product...</option>
          </select>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Enter custom product name..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
            autoFocus
          />
          <button type="button" onClick={addCustom} className="btn-secondary text-xs px-3">Add</button>
          <button type="button" onClick={() => { setShowCustom(false); setInput('') }} className="btn-secondary text-xs px-3">Cancel</button>
        </div>
      )}
    </div>
  )
}

const EMPTY_DEAL = {
  name: '', accountName: '', accountId: null, contact: '', value: '',
  stage: 'Engage', predictedCloseDate: '', notes: '',
  nextMeeting: '', products: [], nextSteps: '', businessPartner: '', iscLink: '', campaign: '',
  relationshipHealth: 'neutral', actionsTaken: [], nextAction: ''
}

export default function CRM() {
  const [deals, setDeals] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [showAddDeal, setShowAddDeal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)
  const [newDeal, setNewDeal] = useState(EMPTY_DEAL)
  const [newActionText, setNewActionText] = useState('')
  const [showAddAction, setShowAddAction] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [dealsRes, accountsRes] = await Promise.all([getDeals(), getAccounts()])
    setDeals(dealsRes.data)
    setAccounts(accountsRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Keep selectedDeal in sync after reload
  useEffect(() => {
    if (selectedDeal) {
      const updated = deals.find(d => d.id === selectedDeal.id)
      if (updated) setSelectedDeal(updated)
    }
  }, [deals])

  const handleCreateDeal = async (e) => {
    e.preventDefault()
    if (!newDeal.name.trim()) return
    await createDeal({ ...newDeal, value: Number(newDeal.value) || 0 })
    setNewDeal(EMPTY_DEAL)
    setShowAddDeal(false)
    load()
  }

  const handleMoveStage = async (deal, direction) => {
    const currentIndex = STAGES.indexOf(deal.stage)
    const newIndex = currentIndex + direction
    if (newIndex < 0 || newIndex >= STAGES.length) return
    const newStage = STAGES[newIndex]
    await updateDeal(deal.id, { stage: newStage })
    if (newStage === 'Won' || newStage === 'Lost') {
      await logActivity({
        objectiveId: 'obj-8',
        value: 1,
        note: `${deal.name} - ${newStage}`,
        date: dayjs().format('YYYY-MM-DD'),
        source: 'crm'
      })
    }
    load()
  }

  const handleDeleteDeal = async (id) => {
    if (!confirm('Delete this deal?')) return
    await deleteDeal(id)
    setShowDetail(false)
    setSelectedDeal(null)
    load()
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    await updateDeal(editingDeal.id, { ...editingDeal, value: Number(editingDeal.value) || 0 })
    setEditingDeal(null)
    load()
  }

  const handleAddAction = async () => {
    if (!newActionText.trim() || !selectedDeal) return
    const action = {
      id: Date.now().toString(),
      text: newActionText,
      date: new Date().toISOString(),
      completed: true
    }
    const updatedActions = [...(selectedDeal.actionsTaken || []), action]
    await updateDeal(selectedDeal.id, { actionsTaken: updatedActions })
    setNewActionText('')
    setShowAddAction(false)
    load()
  }

  const handleDeleteAction = async (actionId) => {
    if (!selectedDeal) return
    const updatedActions = (selectedDeal.actionsTaken || []).filter(a => a.id !== actionId)
    await updateDeal(selectedDeal.id, { actionsTaken: updatedActions })
    load()
  }

  const handleUpdateRelationship = async (health) => {
    if (!selectedDeal) return
    await updateDeal(selectedDeal.id, { relationshipHealth: health })
    load()
  }

  const handleUpdateNextAction = async (text) => {
    if (!selectedDeal) return
    await updateDeal(selectedDeal.id, { nextAction: text })
    load()
  }

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter(d => d.stage === stage)
    return acc
  }, {})

  const activeDeals = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost')
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
  const wonDeals = deals.filter(d => d.stage === 'Won')
  const wonValue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">CRM Pipeline</h1>
        <button onClick={() => setShowAddDeal(true)} className="btn-primary">+ New Deal</button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-navy-900">{activeDeals.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active Deals</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-navy-900">{formatCurrency(pipelineValue)}</p>
          <p className="text-xs text-gray-500 mt-1">Pipeline Value</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">{wonDeals.length}</p>
          <p className="text-xs text-gray-500 mt-1">Won</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(wonValue)}</p>
          <p className="text-xs text-gray-500 mt-1">Won Value</p>
        </div>
      </div>

      {/* ── Add Deal Modal ── */}
      {showAddDeal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">New Opportunity</h2>
              <form onSubmit={handleCreateDeal} className="space-y-4">

                {/* Row 1: Deal name + Stage */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Opportunity Name *</label>
                    <input className="input" placeholder="Project Alpha" value={newDeal.name}
                      onChange={e => setNewDeal({ ...newDeal, name: e.target.value })} autoFocus />
                  </div>
                  <div>
                    <label className="label">Stage</label>
                    <select className="input" value={newDeal.stage}
                      onChange={e => setNewDeal({ ...newDeal, stage: e.target.value })}>
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 2: Account (autocomplete) + Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Account</label>
                    <AccountAutocomplete
                      value={newDeal.accountName}
                      accounts={accounts}
                      onChange={v => setNewDeal({ ...newDeal, accountName: v, accountId: null })}
                      onSelect={a => setNewDeal({ ...newDeal, accountName: a.name, accountId: a.id })}
                    />
                    {newDeal.accountId && (
                      <p className="text-xs text-green-600 mt-1">✓ Linked to existing account</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Contact</label>
                    <input className="input" placeholder="John Smith" value={newDeal.contact}
                      onChange={e => setNewDeal({ ...newDeal, contact: e.target.value })} />
                  </div>
                </div>

                {/* Row 3: Value + Predicted Close */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Value (£)</label>
                    <input className="input" type="number" placeholder="50000" value={newDeal.value}
                      onChange={e => setNewDeal({ ...newDeal, value: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Predicted Close</label>
                    <input className="input" type="date" value={newDeal.predictedCloseDate}
                      onChange={e => setNewDeal({ ...newDeal, predictedCloseDate: e.target.value })} />
                  </div>
                </div>

                {/* Row 4: Next Meeting + Business Partner */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Next Meeting</label>
                    <input className="input" type="datetime-local" value={newDeal.nextMeeting}
                      onChange={e => setNewDeal({ ...newDeal, nextMeeting: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Business Partner</label>
                    <input className="input" placeholder="Partner name" value={newDeal.businessPartner}
                      onChange={e => setNewDeal({ ...newDeal, businessPartner: e.target.value })} />
                  </div>
                </div>

                {/* Products */}
                <div>
                  <label className="label">Products / Solutions</label>
                  <ProductsInput value={newDeal.products} onChange={v => setNewDeal({ ...newDeal, products: v })} />
                </div>

                {/* Campaign Hashtag */}
                <div>
                  <label className="label">Campaign Hashtag (optional)</label>
                  <input className="input" placeholder="#Q1Launch" value={newDeal.campaign}
                    onChange={e => setNewDeal({ ...newDeal, campaign: e.target.value })} />
                  <p className="text-xs text-gray-500 mt-1">Use hashtag format (e.g., #Q1Launch) to link to campaigns</p>
                </div>

                {/* Next Steps */}
                <div>
                  <label className="label">Next Steps</label>
                  <textarea className="input resize-none" rows={2} placeholder="What are the next actions?"
                    value={newDeal.nextSteps}
                    onChange={e => setNewDeal({ ...newDeal, nextSteps: e.target.value })} />
                </div>

                {/* ISC Link */}
                <div>
                  <label className="label">ISC Link</label>
                  <input className="input" placeholder="https://isc.ibm.com/..." value={newDeal.iscLink}
                    onChange={e => setNewDeal({ ...newDeal, iscLink: e.target.value })} />
                </div>

                {/* Notes */}
                <div>
                  <label className="label">Notes</label>
                  <textarea className="input resize-none" rows={2} value={newDeal.notes}
                    onChange={e => setNewDeal({ ...newDeal, notes: e.target.value })} />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="btn-primary flex-1">Create Opportunity</button>
                  <button type="button" onClick={() => { setShowAddDeal(false); setNewDeal(EMPTY_DEAL) }} className="btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Deal Detail / Edit Modal ── */}
      {showDetail && selectedDeal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{selectedDeal.name}</h2>
                  {selectedDeal.accountName && (
                    <p className="text-sm text-gray-500">🏢 {selectedDeal.accountName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!editingDeal && (
                    <button
                      onClick={() => setEditingDeal({ ...selectedDeal })}
                      className="btn-secondary text-xs"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  <button onClick={() => { setShowDetail(false); setEditingDeal(null) }} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {editingDeal ? (
                /* ── Edit Form ── */
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Opportunity Name *</label>
                      <input className="input" value={editingDeal.name}
                        onChange={e => setEditingDeal({ ...editingDeal, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Stage</label>
                      <select className="input" value={editingDeal.stage}
                        onChange={e => setEditingDeal({ ...editingDeal, stage: e.target.value })}>
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Account</label>
                      <AccountAutocomplete
                        value={editingDeal.accountName}
                        accounts={accounts}
                        onChange={v => setEditingDeal({ ...editingDeal, accountName: v, accountId: null })}
                        onSelect={a => setEditingDeal({ ...editingDeal, accountName: a.name, accountId: a.id })}
                      />
                    </div>
                    <div>
                      <label className="label">Contact</label>
                      <input className="input" value={editingDeal.contact}
                        onChange={e => setEditingDeal({ ...editingDeal, contact: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Value (£)</label>
                      <input className="input" type="number" value={editingDeal.value}
                        onChange={e => setEditingDeal({ ...editingDeal, value: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Predicted Close</label>
                      <input className="input" type="date" value={editingDeal.predictedCloseDate || ''}
                        onChange={e => setEditingDeal({ ...editingDeal, predictedCloseDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Next Meeting</label>
                      <input className="input" type="datetime-local"
                        value={editingDeal.nextMeeting ? editingDeal.nextMeeting.slice(0, 16) : ''}
                        onChange={e => setEditingDeal({ ...editingDeal, nextMeeting: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Business Partner</label>
                      <input className="input" value={editingDeal.businessPartner || ''}
                        onChange={e => setEditingDeal({ ...editingDeal, businessPartner: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Products / Solutions</label>
                    <ProductsInput
                      value={editingDeal.products || []}
                      onChange={v => setEditingDeal({ ...editingDeal, products: v })}
                    />
                  </div>
                  <div>
                    <label className="label">Campaign Hashtag (optional)</label>
                    <input className="input" placeholder="#Q1Launch" value={editingDeal.campaign || ''}
                      onChange={e => setEditingDeal({ ...editingDeal, campaign: e.target.value })} />
                    <p className="text-xs text-gray-500 mt-1">Use hashtag format (e.g., #Q1Launch) to link to campaigns</p>
                  </div>
                  <div>
                    <label className="label">Next Steps</label>
                    <textarea className="input resize-none" rows={2} value={editingDeal.nextSteps || ''}
                      onChange={e => setEditingDeal({ ...editingDeal, nextSteps: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">ISC Link</label>
                    <input className="input" value={editingDeal.iscLink || ''}
                      onChange={e => setEditingDeal({ ...editingDeal, iscLink: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <textarea className="input resize-none" rows={2} value={editingDeal.notes || ''}
                      onChange={e => setEditingDeal({ ...editingDeal, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="btn-primary flex-1">Save Changes</button>
                    <button type="button" onClick={() => setEditingDeal(null)} className="btn-secondary flex-1">Cancel</button>
                  </div>
                </form>
              ) : (
                /* ── View Mode ── */
                <div className="space-y-4">
                  {/* Core info grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Value</p>
                      <p className="font-semibold text-navy-900 text-base">{formatCurrency(selectedDeal.value)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Stage</p>
                      <span className={`inline-block text-white text-xs px-2 py-1 rounded-full ${STAGE_HEADER_COLORS[selectedDeal.stage]}`}>
                        {selectedDeal.stage}
                      </span>
                    </div>
                    {selectedDeal.contact && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Contact</p>
                        <p className="font-medium">{selectedDeal.contact}</p>
                      </div>
                    )}
                    {selectedDeal.predictedCloseDate && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Predicted Close</p>
                        <p className={`font-medium ${dayjs(selectedDeal.predictedCloseDate).isBefore(dayjs()) ? 'text-red-600' : ''}`}>
                          {dayjs(selectedDeal.predictedCloseDate).format('MMM D, YYYY')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Next Meeting */}
                  {selectedDeal.nextMeeting && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-500 uppercase tracking-wide mb-1">📅 Next Meeting</p>
                      <p className="font-medium text-blue-900">
                        {dayjs(selectedDeal.nextMeeting).format('ddd, MMM D YYYY [at] HH:mm')}
                      </p>
                    </div>
                  )}

                  {/* Products */}
                  {selectedDeal.products && selectedDeal.products.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Products / Solutions</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedDeal.products.map(p => (
                          <span key={p} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {selectedDeal.nextSteps && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Next Steps</p>
                      <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg p-3 whitespace-pre-wrap">
                        {selectedDeal.nextSteps}
                      </p>
                    </div>
                  )}

                  {/* Business Partner */}
                  {selectedDeal.businessPartner && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Business Partner</p>
                      <p className="text-sm font-medium text-gray-700">🤝 {selectedDeal.businessPartner}</p>
                    </div>
                  )}

                  {/* ISC Link */}
                  {selectedDeal.iscLink && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">ISC Link</p>
                      <a
                        href={selectedDeal.iscLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        🔗 {selectedDeal.iscLink}
                      </a>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedDeal.notes && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selectedDeal.notes}</p>
                    </div>
                  )}

                  {/* Action Plan Section */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 Action Plan</h3>
                    
                    {/* Relationship Barometer */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Relationship Health</p>
                      <div className="flex gap-2">
                        {[
                          { value: 'strong', label: '💚 Strong', color: 'bg-green-100 text-green-800 border-green-300' },
                          { value: 'neutral', label: '💛 Neutral', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
                          { value: 'weak', label: '🔴 Weak', color: 'bg-red-100 text-red-800 border-red-300' }
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => handleUpdateRelationship(option.value)}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all ${
                              (selectedDeal.relationshipHealth || 'neutral') === option.value
                                ? option.color
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Next Action */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">🎯 Next Action</p>
                      <textarea
                        value={selectedDeal.nextAction || ''}
                        onChange={(e) => handleUpdateNextAction(e.target.value)}
                        onBlur={(e) => handleUpdateNextAction(e.target.value)}
                        placeholder="What's the immediate next step?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                      />
                    </div>

                    {/* Actions Taken */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">✅ Actions Taken</p>
                        <button
                          onClick={() => setShowAddAction(!showAddAction)}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          {showAddAction ? 'Cancel' : '+ Add Action'}
                        </button>
                      </div>

                      {showAddAction && (
                        <div className="mb-3 flex gap-2">
                          <input
                            type="text"
                            value={newActionText}
                            onChange={(e) => setNewActionText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddAction() }}
                            placeholder="Describe the action taken..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <button
                            onClick={handleAddAction}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      )}

                      {selectedDeal.actionsTaken && selectedDeal.actionsTaken.length > 0 ? (
                        <div className="space-y-2">
                          {[...selectedDeal.actionsTaken].reverse().map(action => (
                            <div key={action.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group">
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">{action.text}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {dayjs(action.date).format('MMM D, YYYY [at] HH:mm')}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteAction(action.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-3">No actions recorded yet</p>
                      )}
                    </div>
                  </div>

                  {/* Stage History */}
                  {selectedDeal.history && selectedDeal.history.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Stage History</p>
                      <div className="space-y-2">
                        {[...selectedDeal.history].reverse().map((h, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_HEADER_COLORS[h.stage] || 'bg-gray-400'}`} />
                            <span className="font-medium">{h.stage}</span>
                            <span className="text-gray-400">{dayjs(h.date).format('MMM D, YYYY')}</span>
                            {h.note && <span className="text-gray-500 text-xs">— {h.note}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => handleDeleteDeal(selectedDeal.id)} className="btn-danger text-xs">
                      Delete Deal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Kanban Board ── */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading pipeline...</div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map(stage => (
              <div key={stage} className="w-64 flex-shrink-0">
                {/* Stage Header */}
                <div className={`${STAGE_HEADER_COLORS[stage]} text-white rounded-t-lg px-3 py-2 flex items-center justify-between`}>
                  <span className="font-medium text-sm">{stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-80">{dealsByStage[stage].length}</span>
                    {dealsByStage[stage].length > 0 && (
                      <span className="text-xs opacity-80">
                        {formatCurrency(dealsByStage[stage].reduce((s, d) => s + (Number(d.value) || 0), 0))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stage Column */}
                <div className={`min-h-32 rounded-b-lg border-2 ${STAGE_COLORS[stage]} p-2 space-y-2`}>
                  {dealsByStage[stage].map(deal => (
                    <div
                      key={deal.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => { setSelectedDeal(deal); setShowDetail(true); setEditingDeal(null) }}
                    >
                      <p className="font-medium text-sm text-gray-900 leading-tight">{deal.name}</p>
                      {deal.accountName && <p className="text-xs text-gray-500 mt-0.5">🏢 {deal.accountName}</p>}
                      <p className="text-sm font-semibold text-navy-900 mt-1">{formatCurrency(deal.value)}</p>

                      {/* Products preview */}
                      {deal.products && deal.products.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {deal.products.slice(0, 2).map(p => (
                            <span key={p} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{p}</span>
                          ))}
                          {deal.products.length > 2 && (
                            <span className="text-xs text-gray-400">+{deal.products.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* Next meeting indicator */}
                      {deal.nextMeeting && (
                        <p className="text-xs text-blue-600 mt-1">
                          📅 {dayjs(deal.nextMeeting).format('MMM D')}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <DaysInStage deal={deal} />
                        {deal.predictedCloseDate && (
                          <span className={`text-xs ${dayjs(deal.predictedCloseDate).isBefore(dayjs()) ? 'text-red-500' : 'text-gray-400'}`}>
                            {dayjs(deal.predictedCloseDate).format('MMM D')}
                          </span>
                        )}
                      </div>

                      {/* Move buttons */}
                      <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                        {STAGES.indexOf(stage) > 0 && (
                          <button
                            onClick={() => handleMoveStage(deal, -1)}
                            className="flex-1 text-xs py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                          >
                            ← Back
                          </button>
                        )}
                        {STAGES.indexOf(stage) < STAGES.length - 1 && (
                          <button
                            onClick={() => handleMoveStage(deal, 1)}
                            className="flex-1 text-xs py-1 bg-navy-900 hover:bg-navy-800 rounded text-white transition-colors"
                          >
                            Next →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {dealsByStage[stage].length === 0 && (
                    <div className="text-center text-gray-300 text-xs py-4">Empty</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Made with Bob
