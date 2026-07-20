import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { WeightLog } from '@/lib/types'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'

function formatDate(dateStr: string) {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function formatShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function WeightPage() {
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)

  // Log form
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [logWeight, setLogWeight] = useState('')
  const [logNotes, setLogNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Edit
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const loadLogs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(90)
    setLogs((data ?? []) as WeightLog[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadLogs() }, [loadLogs])

  // Pre-fill form when date changes (if log exists for that date)
  useEffect(() => {
    const existing = logs.find(l => l.date === logDate)
    if (existing) {
      setLogWeight(existing.weight.toString())
      setLogNotes(existing.notes ?? '')
      setEditId(existing.id)
    } else {
      setLogWeight('')
      setLogNotes('')
      setEditId(null)
    }
  }, [logDate, logs])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logWeight) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    if (editId) {
      await supabase.from('weight_logs')
        .update({ weight: Number(logWeight), notes: logNotes || null })
        .eq('id', editId)
    } else {
      await supabase.from('weight_logs').upsert(
        { user_id: user.id, date: logDate, weight: Number(logWeight), notes: logNotes || null },
        { onConflict: 'user_id,date' }
      )
    }

    setSaveMsg(editId ? 'Updated!' : 'Logged!')
    setTimeout(() => setSaveMsg(''), 2000)
    setSaving(false)
    await loadLogs()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('weight_logs').delete().eq('id', id)
    setDeleteId(null)
    if (editId === id) { setLogWeight(''); setLogNotes(''); setEditId(null) }
    await loadLogs()
  }

  // Chart data (oldest → newest, max 30 points)
  const chartData = [...logs]
    .reverse()
    .slice(-30)
    .map(l => ({ date: formatShort(l.date), weight: Number(l.weight), rawDate: l.date }))

  const latest = logs[0]
  const prev = logs[1]
  const delta = latest && prev ? Number(latest.weight) - Number(prev.weight) : null

  const minWeight = chartData.length > 0 ? Math.min(...chartData.map(d => d.weight)) : 0
  const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : 100
  const yPad = 2

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-white font-bold">{payload[0].value} kg</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Weight Tracker</h1>

      {/* Stats row */}
      {latest && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-white">{Number(latest.weight)} kg</p>
            <p className="text-xs text-gray-400 mt-1">Latest</p>
          </div>
          <div className="card p-4 text-center">
            {delta !== null ? (
              <>
                <p className={`text-3xl font-bold ${delta < 0 ? 'text-green-400' : delta > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {delta > 0 ? '+' : ''}{Math.round(delta * 10) / 10} kg
                </p>
                <p className="text-xs text-gray-400 mt-1">vs Previous</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-600">—</p>
                <p className="text-xs text-gray-400 mt-1">vs Previous</p>
              </>
            )}
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-indigo-400">{logs.length}</p>
            <p className="text-xs text-gray-400 mt-1">Entries</p>
          </div>
        </div>
      )}

      {/* Log weight form */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-4">
          {editId ? 'Update Weight' : 'Log Weight'}
        </h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                max={today} />
            </div>
            <div>
              <label className="label">Weight (kg) *</label>
              <input type="number" className="input" placeholder="e.g. 75.5"
                value={logWeight} onChange={e => setLogWeight(e.target.value)}
                required step="0.1" min="20" max="500" />
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input type="text" className="input" placeholder="e.g. morning weight, post-workout..."
              value={logNotes} onChange={e => setLogNotes(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || !logWeight} className="btn-primary">
              {saving ? 'Saving...' : editId ? 'Update' : 'Log Weight'}
            </button>
            {saveMsg && <span className="text-green-400 text-sm font-medium">{saveMsg}</span>}
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setLogDate(today); setLogWeight(''); setLogNotes('') }}
                className="btn-secondary text-sm">
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-white mb-4">Weight Trend (last {chartData.length} entries)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis
                stroke="#4b5563"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                domain={[minWeight - yPad, maxWeight + yPad]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History table */}
      {loading ? (
        <div className="card p-8 text-center text-gray-400">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">No weight entries yet. Log your first weight above.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Date</th>
                  <th className="px-4 py-3 text-right text-gray-400 font-medium">Weight</th>
                  <th className="px-4 py-3 text-right text-gray-400 font-medium">Change</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Notes</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const nextLog = logs[idx + 1]
                  const change = nextLog ? Number(log.weight) - Number(nextLog.weight) : null
                  return (
                    <tr key={log.id}
                      onClick={() => setLogDate(log.date)}
                      className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-gray-200">{formatDate(log.date)}</td>
                      <td className="px-4 py-3 text-right font-medium text-white">{Number(log.weight)} kg</td>
                      <td className="px-4 py-3 text-right">
                        {change !== null ? (
                          <span className={`text-sm font-medium ${change < 0 ? 'text-green-400' : change > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                            {change > 0 ? '+' : ''}{Math.round(change * 10) / 10}
                          </span>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate">
                        {log.notes || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteId(log.id) }}
                          className="text-gray-600 hover:text-red-400 p-1 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Delete Entry?</h2>
            <p className="text-gray-400 text-sm mb-6">This weight entry will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
