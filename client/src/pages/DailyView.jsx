import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { getDay, addTask, updateTask, deleteTask, updateDiary, logActivity } from '../api'

const PRIORITY_COLORS = {
  high: 'border-l-red-500',
  normal: 'border-l-blue-400',
  low: 'border-l-gray-300'
}

const PRIORITY_BADGES = {
  high: 'badge-red',
  normal: 'badge-blue',
  low: 'badge-gray'
}

export default function DailyView() {
  const [currentDate, setCurrentDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [dayData, setDayData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState({ text: '', time: '', priority: 'normal' })
  const [showAddTask, setShowAddTask] = useState(false)
  const [diary, setDiary] = useState({ wins: '', blockers: '', tomorrowFocus: '', notes: '' })
  const [diarySaving, setDiarySaving] = useState(false)

  const loadDay = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDay(currentDate)
      setDayData(res.data)
      setDiary(res.data.diary || { wins: '', blockers: '', tomorrowFocus: '', notes: '' })
    } catch (e) {
      setDayData({ date: currentDate, tasks: [], completedLog: [], diary: {} })
    }
    setLoading(false)
  }, [currentDate])

  useEffect(() => { loadDay() }, [loadDay])

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.text.trim()) return
    await addTask(currentDate, newTask)
    setNewTask({ text: '', time: '', priority: 'normal' })
    setShowAddTask(false)
    loadDay()
  }

  const handleToggleTask = async (task) => {
    await updateTask(currentDate, task.id, { done: !task.done })
    // Auto-log call activity if task type is call
    if (!task.done && task.type === 'call') {
      await logActivity({ objectiveId: 'obj-7', value: 1, note: task.text, date: currentDate, source: 'daily' })
    }
    loadDay()
  }

  const handleDeleteTask = async (taskId) => {
    await deleteTask(currentDate, taskId)
    loadDay()
  }

  const handleDiarySave = async () => {
    setDiarySaving(true)
    await updateDiary(currentDate, diary)
    setDiarySaving(false)
  }

  const navigate = (dir) => {
    setCurrentDate(dayjs(currentDate).add(dir, 'day').format('YYYY-MM-DD'))
  }

  const isToday = currentDate === dayjs().format('YYYY-MM-DD')
  const tasks = dayData?.tasks || []
  const completedTasks = tasks.filter(t => t.done)
  const pendingTasks = tasks.filter(t => !t.done)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Daily View</h1>
          <p className="text-gray-500 text-sm mt-1">
            {dayjs(currentDate).format('dddd, MMMM D, YYYY')}
            {isToday && <span className="ml-2 badge-blue">Today</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="btn-secondary px-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => setCurrentDate(dayjs().format('YYYY-MM-DD'))} className="btn-secondary text-xs px-3 py-2">
            Today
          </button>
          <button onClick={() => navigate(1)} className="btn-secondary px-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Tasks */}
          <div className="lg:col-span-2 space-y-6">

            {/* Morning Plan */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">🌅 Morning Plan</h2>
                <button onClick={() => setShowAddTask(!showAddTask)} className="btn-primary text-xs">
                  + Add Task
                </button>
              </div>

              {/* Add Task Form */}
              {showAddTask && (
                <form onSubmit={handleAddTask} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <label className="label">Task</label>
                    <input
                      className="input"
                      placeholder="What needs to be done?"
                      value={newTask.text}
                      onChange={e => setNewTask({ ...newTask, text: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Time (optional)</label>
                      <input
                        className="input"
                        type="time"
                        value={newTask.time}
                        onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Priority</label>
                      <select
                        className="input"
                        value={newTask.priority}
                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                      >
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs">Add Task</button>
                    <button type="button" onClick={() => setShowAddTask(false)} className="btn-secondary text-xs">Cancel</button>
                  </div>
                </form>
              )}

              {/* Pending Tasks */}
              {pendingTasks.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No tasks planned yet. Add your first task!</p>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map(task => (
                    <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 bg-gray-50 ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal}`}>
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => handleToggleTask(task)}
                        className="mt-0.5 w-4 h-4 rounded accent-navy-900 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{task.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.time && <span className="text-xs text-gray-500">⏰ {task.time}</span>}
                          <span className={PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.normal}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Log */}
            {completedTasks.length > 0 && (
              <div className="card">
                <h2 className="section-title">✅ Completed Today ({completedTasks.length})</h2>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border-l-4 border-l-green-400">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => handleToggleTask(task)}
                        className="w-4 h-4 rounded accent-green-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 line-through">{task.text}</p>
                        {task.completedAt && (
                          <p className="text-xs text-gray-400">
                            Completed at {dayjs(task.completedAt).format('HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Diary */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="section-title">📓 Daily Diary</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">🏆 Wins Today</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="What went well today?"
                    value={diary.wins}
                    onChange={e => setDiary({ ...diary, wins: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">🚧 Blockers</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="What got in the way?"
                    value={diary.blockers}
                    onChange={e => setDiary({ ...diary, blockers: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">🎯 Tomorrow's Focus</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="What's the priority for tomorrow?"
                    value={diary.tomorrowFocus}
                    onChange={e => setDiary({ ...diary, tomorrowFocus: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">📝 Notes</label>
                  <textarea
                    className="input resize-none"
                    rows={4}
                    placeholder="Any other notes..."
                    value={diary.notes}
                    onChange={e => setDiary({ ...diary, notes: e.target.value })}
                  />
                </div>
                <button onClick={handleDiarySave} className="btn-primary w-full">
                  {diarySaving ? 'Saving...' : 'Save Diary'}
                </button>
              </div>
            </div>

            {/* Day Stats */}
            <div className="card">
              <h2 className="section-title">📊 Day Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasks Planned</span>
                  <span className="font-semibold text-gray-900">{tasks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-semibold text-green-600">{completedTasks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Remaining</span>
                  <span className="font-semibold text-amber-600">{pendingTasks.length}</span>
                </div>
                {tasks.length > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((completedTasks.length / tasks.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Made with Bob
