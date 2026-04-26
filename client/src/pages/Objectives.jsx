import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'
import { getObjectives, getScores, getLogs, logActivity, deleteLog, exportObjectives } from '../api'

const OBJ_IDS = ['obj-1', 'obj-2', 'obj-3', 'obj-4', 'obj-5', 'obj-6', 'obj-7', 'obj-8']

function ScoreColor(pct) {
  if (pct >= 100) return '#10B981'
  if (pct >= 50) return '#F59E0B'
  return '#EF4444'
}

function ProgressBar({ pct }) {
  const color = pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-900">{d.name}</p>
        <p className="text-gray-600">{d.actual} / {d.target} {d.unit}</p>
        <p style={{ color: ScoreColor(d.percentage) }} className="font-medium">{d.percentage}%</p>
      </div>
    )
  }
  return null
}

export default function Objectives() {
  const [period, setPeriod] = useState('weekly')
  const [refDate, setRefDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [scores, setScores] = useState([])
  const [objectives, setObjectives] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogModal, setShowLogModal] = useState(false)
  const [logForm, setLogForm] = useState({ objectiveId: 'obj-1', value: 1, note: '', date: dayjs().format('YYYY-MM-DD') })
  const [activeTab, setActiveTab] = useState('chart') // chart | cards | logs

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [scoresRes, objRes] = await Promise.all([
        getScores(period, refDate),
        getObjectives()
      ])
      setScores(scoresRes.data)
      setObjectives(objRes.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [period, refDate])

  const loadLogs = useCallback(async () => {
    const res = await getLogs()
    setLogs(res.data)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (activeTab === 'logs') loadLogs() }, [activeTab, loadLogs])

  const handleLogActivity = async (e) => {
    e.preventDefault()
    await logActivity({ ...logForm, source: 'manual' })
    setShowLogModal(false)
    setLogForm({ objectiveId: 'obj-1', value: 1, note: '', date: dayjs().format('YYYY-MM-DD') })
    load()
  }

  const handleDeleteLog = async (id) => {
    await deleteLog(id)
    loadLogs()
    load()
  }

  const handleExport = async () => {
    try {
      const response = await exportObjectives()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `objectives-export-${dayjs().format('YYYY-MM-DD')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export objectives')
    }
  }

  const navigatePeriod = (dir) => {
    if (period === 'weekly') {
      setRefDate(dayjs(refDate).add(dir * 7, 'day').format('YYYY-MM-DD'))
    } else {
      setRefDate(dayjs(refDate).add(dir, 'month').format('YYYY-MM-DD'))
    }
  }

  const periodLabel = () => {
    if (period === 'weekly') {
      const day = dayjs(refDate).day()
      const diff = day === 0 ? -6 : 1 - day
      const mon = dayjs(refDate).add(diff, 'day')
      const sun = mon.add(6, 'day')
      return `${mon.format('MMM D')} – ${sun.format('MMM D, YYYY')}`
    }
    return dayjs(refDate).format('MMMM YYYY')
  }

  const isCurrentPeriod = () => {
    if (period === 'weekly') {
      const today = dayjs()
      const day = today.day()
      const diff = day === 0 ? -6 : 1 - day
      const mon = today.add(diff, 'day').format('YYYY-MM-DD')
      const refDay = dayjs(refDate).day()
      const refDiff = refDay === 0 ? -6 : 1 - refDay
      const refMon = dayjs(refDate).add(refDiff, 'day').format('YYYY-MM-DD')
      return mon === refMon
    }
    return dayjs(refDate).format('YYYY-MM') === dayjs().format('YYYY-MM')
  }

  // Prepare radar data — normalize to 0-100 scale
  const radarData = scores.map(s => ({
    name: s.name.length > 18 ? s.name.substring(0, 16) + '…' : s.name,
    fullName: s.name,
    value: s.percentage,
    actual: s.actual,
    target: s.target,
    unit: s.unit,
    percentage: s.percentage,
    color: s.color
  }))

  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Business Objectives</h1>
          <p className="text-gray-500 text-sm mt-1">Track your performance against targets</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>
          <button onClick={() => setShowLogModal(true)} className="btn-gold">+ Log Activity</button>
        </div>
      </div>

      {/* Period Controls */}
      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === 'weekly' ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === 'monthly' ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Monthly
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigatePeriod(-1)} className="btn-secondary px-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-48 text-center">{periodLabel()}</span>
            <button onClick={() => navigatePeriod(1)} className="btn-secondary px-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {!isCurrentPeriod() && (
              <button
                onClick={() => setRefDate(dayjs().format('YYYY-MM-DD'))}
                className="btn-secondary text-xs px-3 py-2"
              >
                Current
              </button>
            )}
          </div>
          {/* Overall Score */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Overall Score</span>
            <span className={`text-2xl font-bold`} style={{ color: ScoreColor(overallScore) }}>
              {overallScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['chart', 'cards', 'logs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'chart' ? '🎯 Octagon Chart' : tab === 'cards' ? '📋 Detail Cards' : '📝 Activity Log'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading objectives...</div>
      ) : (
        <>
          {/* Chart Tab */}
          {activeTab === 'chart' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="card">
                <h2 className="section-title text-center">Performance Octagon</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickCount={5}
                    />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke="#1e3a5f"
                      fill="#1e3a5f"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Score Summary */}
              <div className="card">
                <h2 className="section-title">Score Summary</h2>
                <div className="space-y-4">
                  {scores.map(s => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 truncate flex-1">{s.name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-xs text-gray-500">{s.actual}/{s.target} {s.unit}</span>
                          <span className="text-sm font-bold" style={{ color: ScoreColor(s.percentage) }}>
                            {s.percentage}%
                          </span>
                        </div>
                      </div>
                      <ProgressBar pct={s.percentage} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cards Tab */}
          {activeTab === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {scores.map(s => (
                <div key={s.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span
                      className="text-2xl font-bold ml-auto"
                      style={{ color: ScoreColor(s.percentage) }}
                    >
                      {s.percentage}%
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{s.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {s.actual} / {s.target} {s.unit}
                  </p>
                  <ProgressBar pct={s.percentage} />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400 capitalize">{s.period}</span>
                    <button
                      onClick={() => {
                        setLogForm({ objectiveId: s.id, value: 1, note: '', date: dayjs().format('YYYY-MM-DD') })
                        setShowLogModal(true)
                      }}
                      className="text-xs text-navy-900 hover:text-navy-700 font-medium"
                    >
                      + Log
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">Activity Log</h2>
                <button onClick={() => setShowLogModal(true)} className="btn-primary text-xs">+ Log Activity</button>
              </div>
              {logs.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No activity logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...logs].reverse().map(log => {
                    const obj = objectives.find(o => o.id === log.objectiveId)
                    return (
                      <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: obj?.color || '#9ca3af' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{obj?.name || log.objectiveId}</p>
                          {log.note && <p className="text-xs text-gray-500">{log.note}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-navy-900">+{log.value}</p>
                          <p className="text-xs text-gray-400">{dayjs(log.date).format('MMM D')}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          log.source === 'manual' ? 'bg-gray-100 text-gray-600' :
                          log.source === 'accounts' ? 'bg-blue-100 text-blue-700' :
                          log.source === 'crm' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                        }`}>{log.source}</span>
                        <button onClick={() => handleDeleteLog(log.id)} className="text-gray-300 hover:text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Log Activity Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Log Activity</h2>
            <form onSubmit={handleLogActivity} className="space-y-4">
              <div>
                <label className="label">Objective</label>
                <select className="input" value={logForm.objectiveId}
                  onChange={e => setLogForm({ ...logForm, objectiveId: e.target.value })}>
                  {objectives.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Value</label>
                  <input className="input" type="number" min="0.5" step="0.5" value={logForm.value}
                    onChange={e => setLogForm({ ...logForm, value: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" value={logForm.date}
                    onChange={e => setLogForm({ ...logForm, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <input className="input" placeholder="e.g. Called Acme Corp" value={logForm.note}
                  onChange={e => setLogForm({ ...logForm, note: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-gold flex-1">Log Activity</button>
                <button type="button" onClick={() => setShowLogModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Made with Bob
