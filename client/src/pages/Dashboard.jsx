import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { getDay, getDeals, getAccounts, getScores, getWeeklyTasks, createWeeklyTask, updateWeeklyTask, deleteWeeklyTask } from '../api'

dayjs.extend(isoWeek)

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0)
}

function ScoreColor(pct) {
  if (pct >= 100) return 'text-green-600'
  if (pct >= 50) return 'text-amber-500'
  return 'text-red-500'
}

function StatCard({ label, value, sub, color = 'text-navy-900' }) {
  return (
    <div className="card">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const today = dayjs().format('YYYY-MM-DD')
  const [dayData, setDayData] = useState(null)
  const [deals, setDeals] = useState([])
  const [accounts, setAccounts] = useState([])
  const [scores, setScores] = useState([])
  const [weeklyTasks, setWeeklyTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTaskText, setNewTaskText] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, 1 = next week, -1 = last week

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [dayRes, dealsRes, accRes, scoresRes, weeklyRes] = await Promise.all([
          getDay(today),
          getDeals(),
          getAccounts(),
          getScores('weekly', today),
          getWeeklyTasks()
        ])
        setDayData(dayRes.data)
        setDeals(dealsRes.data)
        setAccounts(accRes.data)
        setScores(scoresRes.data)
        setWeeklyTasks(weeklyRes.data)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [today])

  const handleAddWeeklyTask = async (e) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    try {
      const targetWeek = dayjs().add(weekOffset, 'week').startOf('isoWeek').format('YYYY-MM-DD')
      await createWeeklyTask({
        text: newTaskText,
        priority: 'medium',
        weekStart: targetWeek
      })
      setNewTaskText('')
      setShowAddTask(false)
      const res = await getWeeklyTasks()
      setWeeklyTasks(res.data)
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const navigateWeek = (direction) => {
    setWeekOffset(weekOffset + direction)
  }

  const resetToCurrentWeek = () => {
    setWeekOffset(0)
  }

  const handleToggleWeeklyTask = async (task) => {
    try {
      await updateWeeklyTask(task.id, { done: !task.done })
      const res = await getWeeklyTasks()
      setWeeklyTasks(res.data)
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteWeeklyTask = async (id) => {
    try {
      await deleteWeeklyTask(id)
      const res = await getWeeklyTasks()
      setWeeklyTasks(res.data)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const tasks = dayData?.tasks || []
  const pendingTasks = tasks.filter(t => !t.done)
  const completedTasks = tasks.filter(t => t.done)
  
  // Filter weekly tasks by selected week
  const selectedWeekStart = dayjs().add(weekOffset, 'week').startOf('isoWeek').format('YYYY-MM-DD')
  const selectedWeekEnd = dayjs().add(weekOffset, 'week').endOf('isoWeek').format('YYYY-MM-DD')
  
  const weeklyTasksForSelectedWeek = weeklyTasks.filter(t => {
    if (!t.weekStart) {
      // Legacy tasks without weekStart - show in current week only
      return weekOffset === 0
    }
    return t.weekStart === selectedWeekStart
  })
  
  const pendingWeeklyTasks = weeklyTasksForSelectedWeek.filter(t => !t.done)
  const completedWeeklyTasks = weeklyTasksForSelectedWeek.filter(t => t.done)
  const activeDeals = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost')
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
  const wonDeals = deals.filter(d => d.stage === 'Won')
  const wonValue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)

  // Upcoming closes (next 30 days)
  const upcomingCloses = activeDeals
    .filter(d => d.predictedCloseDate &&
      dayjs(d.predictedCloseDate).isAfter(dayjs().subtract(1, 'day')) &&
      dayjs(d.predictedCloseDate).isBefore(dayjs().add(31, 'day')))
    .sort((a, b) => dayjs(a.predictedCloseDate).diff(dayjs(b.predictedCloseDate)))
    .slice(0, 5)

  // Overdue actions across all accounts
  const overdueActions = accounts.flatMap(acc =>
    (acc.actions || [])
      .filter(a => a.status !== 'done' && a.dueDate && dayjs(a.dueDate).isBefore(dayjs(), 'day'))
      .map(a => ({ ...a, accountName: acc.name }))
  ).slice(0, 5)

  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length)
    : 0

  const radarData = scores.map(s => ({
    name: s.name.length > 14 ? s.name.substring(0, 12) + '…' : s.name,
    value: s.percentage
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {dayjs().format('dddd, MMMM D, YYYY')} · Good {dayjs().hour() < 12 ? 'morning' : dayjs().hour() < 17 ? 'afternoon' : 'evening'}!
        </p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading dashboard...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Tasks Today"
              value={`${completedTasks.length}/${tasks.length}`}
              sub={`${pendingTasks.length} remaining`}
              color={tasks.length > 0 && completedTasks.length === tasks.length ? 'text-green-600' : 'text-navy-900'}
            />
            <StatCard
              label="Active Deals"
              value={activeDeals.length}
              sub={formatCurrency(pipelineValue) + ' pipeline'}
            />
            <StatCard
              label="Won This Period"
              value={wonDeals.length}
              sub={formatCurrency(wonValue)}
              color="text-emerald-600"
            />
            <StatCard
              label="Weekly Score"
              value={`${overallScore}%`}
              sub="vs objectives"
              color={overallScore >= 100 ? 'text-green-600' : overallScore >= 50 ? 'text-amber-500' : 'text-red-500'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Today's Tasks + Overdue Actions */}
            <div className="lg:col-span-2 space-y-6">

              {/* Today's Tasks */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title mb-0">📅 Today's Plan</h2>
                  <a href="/daily" className="text-xs text-navy-900 hover:underline font-medium">View all →</a>
                </div>
                {pendingTasks.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">
                    {tasks.length === 0 ? 'No tasks planned for today.' : '🎉 All tasks complete!'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'low' ? 'bg-gray-300' : 'bg-blue-400'
                        }`} />
                        <span className="text-sm text-gray-700 flex-1">{task.text}</span>
                        {task.time && <span className="text-xs text-gray-400">{task.time}</span>}
                      </div>
                    ))}
                    {pendingTasks.length > 5 && (
                      <p className="text-xs text-gray-400 text-center">+{pendingTasks.length - 5} more tasks</p>
                    )}
                  </div>
                )}
              </div>

              {/* Weekly Tasks */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title mb-0">📋 Weekly Tasks</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigateWeek(-1)}
                      className="p-1 text-gray-600 hover:text-navy-900 hover:bg-gray-100 rounded"
                      title="Previous week"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="text-center min-w-[140px]">
                      <div className="text-xs text-gray-500">
                        Week of {dayjs().add(weekOffset, 'week').startOf('isoWeek').format('MMM D')}
                      </div>
                      {weekOffset !== 0 && (
                        <button
                          onClick={resetToCurrentWeek}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Back to current
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => navigateWeek(1)}
                      className="p-1 text-gray-600 hover:text-navy-900 hover:bg-gray-100 rounded"
                      title="Next week"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="border-l border-gray-300 h-6 mx-1"></div>
                    <button
                      onClick={() => setShowAddTask(!showAddTask)}
                      className="text-xs text-navy-900 hover:underline font-medium"
                    >
                      {showAddTask ? 'Cancel' : '+ Add Task'}
                    </button>
                  </div>
                </div>

                {showAddTask && (
                  <form onSubmit={handleAddWeeklyTask} className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Enter task..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        Add
                      </button>
                    </div>
                  </form>
                )}

                {pendingWeeklyTasks.length === 0 && completedWeeklyTasks.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No weekly tasks yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingWeeklyTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 group">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleToggleWeeklyTask(task)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 flex-1">{task.text}</span>
                        <button
                          onClick={() => handleDeleteWeeklyTask(task.id)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {completedWeeklyTasks.length > 0 && (
                      <>
                        <div className="text-xs text-gray-400 mt-3 mb-1">Completed ({completedWeeklyTasks.length})</div>
                        {completedWeeklyTasks.map(task => (
                          <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 group">
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => handleToggleWeeklyTask(task)}
                              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-500 flex-1 line-through">{task.text}</span>
                            <button
                              onClick={() => handleDeleteWeeklyTask(task.id)}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Upcoming Closes */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title mb-0">🎯 Upcoming Closes (30 days)</h2>
                  <a href="/crm" className="text-xs text-navy-900 hover:underline font-medium">CRM →</a>
                </div>
                {upcomingCloses.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No deals closing in the next 30 days.</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingCloses.map(deal => {
                      const daysLeft = dayjs(deal.predictedCloseDate).diff(dayjs(), 'day')
                      return (
                        <div key={deal.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{deal.name}</p>
                            <p className="text-xs text-gray-500">{deal.accountName} · {deal.stage}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-navy-900">{formatCurrency(deal.value)}</p>
                            <p className={`text-xs ${daysLeft <= 7 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Overdue Actions */}
              {overdueActions.length > 0 && (
                <div className="card border-l-4 border-l-red-400">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="section-title mb-0 text-red-600">⚠️ Overdue Actions ({overdueActions.length})</h2>
                    <a href="/accounts" className="text-xs text-navy-900 hover:underline font-medium">Accounts →</a>
                  </div>
                  <div className="space-y-2">
                    {overdueActions.map(action => (
                      <div key={action.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{action.text}</p>
                          <p className="text-xs text-gray-500">{action.accountName}</p>
                        </div>
                        <span className="text-xs text-red-600 font-medium flex-shrink-0">
                          {dayjs(action.dueDate).format('MMM D')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Mini Octagon + Objective Scores */}
            <div className="space-y-4">
              <div className="card">
                <h2 className="section-title text-center">This Week's Objectives</h2>
                {radarData.length > 0 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-2 space-y-2">
                  {scores.slice(0, 4).map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-600 flex-1 truncate">{s.name}</span>
                      <span className={`text-xs font-semibold ${ScoreColor(s.percentage)}`}>{s.percentage}%</span>
                    </div>
                  ))}
                  {scores.length > 4 && (
                    <a href="/objectives" className="text-xs text-navy-900 hover:underline block text-center mt-2">
                      View all objectives →
                    </a>
                  )}
                </div>
              </div>

              {/* Pipeline by Stage */}
              <div className="card">
                <h2 className="section-title">Pipeline by Stage</h2>
                <div className="space-y-2">
                  {['Engage', 'Qualify', 'Design', 'Propose', 'Negotiate', 'Closing'].map(stage => {
                    const stageDeals = activeDeals.filter(d => d.stage === stage)
                    if (stageDeals.length === 0) return null
                    return (
                      <div key={stage} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{stage}</span>
                        <div className="flex items-center gap-2">
                          <span className="badge-gray">{stageDeals.length}</span>
                          <span className="text-gray-700 font-medium text-xs">
                            {formatCurrency(stageDeals.reduce((s, d) => s + (Number(d.value) || 0), 0))}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {activeDeals.length === 0 && (
                    <p className="text-gray-400 text-xs text-center py-2">No active deals</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Made with Bob
