import { useState, useEffect } from 'react'
import { getSettings, updateSettings, getObjectives, updateObjective } from '../api'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [objectives, setObjectives] = useState([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [editingObj, setEditingObj] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [sRes, oRes] = await Promise.all([getSettings(), getObjectives()])
      setSettings(sRes.data)
      setObjectives(oRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveSettings = async () => {
    await updateSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveObjective = async (obj) => {
    await updateObjective(obj.id, obj)
    setEditingObj(null)
    const oRes = await getObjectives()
    setObjectives(oRes.data)
  }

  if (loading) return <div className="text-center text-gray-400 py-12">Loading settings...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="page-title">Settings</h1>

      {/* General Settings */}
      <div className="card space-y-4">
        <h2 className="section-title">General</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Your Name</label>
            <input
              className="input"
              value={settings.userName || ''}
              onChange={e => setSettings({ ...settings, userName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <select
              className="input"
              value={settings.currency || 'USD'}
              onChange={e => setSettings({
                ...settings,
                currency: e.target.value,
                currencySymbol: e.target.value === 'USD' ? '$' : e.target.value === 'EUR' ? '€' : e.target.value === 'GBP' ? '£' : '$'
              })}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Week Starts On</label>
          <select
            className="input w-48"
            value={settings.weekStartsOn || 'monday'}
            onChange={e => setSettings({ ...settings, weekStartsOn: e.target.value })}
          >
            <option value="monday">Monday</option>
            <option value="sunday">Sunday</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveSettings} className="btn-primary">
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="card space-y-4">
        <h2 className="section-title">Pipeline Stages</h2>
        <p className="text-sm text-gray-500">Current stages (in order):</p>
        <div className="flex flex-wrap gap-2">
          {(settings.stages || []).map((stage, i) => (
            <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1.5">
              <span className="text-sm font-medium text-gray-700">{stage}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Stage editing coming in a future update. Current stages: Engage → Qualify → Design → Propose → Negotiate → Closing → Won / Lost
        </p>
      </div>

      {/* Business Objectives */}
      <div className="card space-y-4">
        <h2 className="section-title">Business Objectives</h2>
        <p className="text-sm text-gray-500">Edit your objective targets and descriptions.</p>
        <div className="space-y-3">
          {objectives.map(obj => (
            <div key={obj.id} className="border border-gray-100 rounded-lg p-4">
              {editingObj?.id === obj.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="label">Name</label>
                    <input className="input" value={editingObj.name}
                      onChange={e => setEditingObj({ ...editingObj, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input resize-none" rows={2} value={editingObj.description}
                      onChange={e => setEditingObj({ ...editingObj, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label">Target</label>
                      <input className="input" type="number" min="1" value={editingObj.target}
                        onChange={e => setEditingObj({ ...editingObj, target: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label">Period</label>
                      <select className="input" value={editingObj.period}
                        onChange={e => setEditingObj({ ...editingObj, period: e.target.value })}>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Unit</label>
                      <input className="input" value={editingObj.unit}
                        onChange={e => setEditingObj({ ...editingObj, unit: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveObjective(editingObj)} className="btn-primary text-xs">Save</button>
                    <button onClick={() => setEditingObj(null)} className="btn-secondary text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: obj.color }} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{obj.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Target: <strong>{obj.target} {obj.unit}</strong> per <strong>{obj.period}</strong>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{obj.description}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingObj({ ...obj })} className="btn-secondary text-xs ml-4">
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="card space-y-4">
        <h2 className="section-title">Data</h2>
        <p className="text-sm text-gray-500">
          All data is stored locally in <code className="bg-gray-100 px-1 rounded text-xs">server/data/</code> as JSON files.
          You can back them up by copying that folder.
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 flex-1">
            <p className="font-medium text-gray-600 mb-1">Data Files</p>
            <p>📁 server/data/daily.json</p>
            <p>📁 server/data/accounts.json</p>
            <p>📁 server/data/deals.json</p>
            <p>📁 server/data/objectives.json</p>
            <p>📁 server/data/settings.json</p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="section-title">About</h2>
        <div className="text-sm text-gray-500 space-y-1">
          <p><strong>Seller Tracker</strong> v1.0.0</p>
          <p>Personal sales dashboard — React + Vite + Node.js + Express</p>
          <p>Data stored locally. No cloud, no login required.</p>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
