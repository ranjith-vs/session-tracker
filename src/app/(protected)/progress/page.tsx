'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Exercise } from '@/lib/types'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'

interface ChartPoint {
  date: string
  rawDate: string
  totalReps: number
  totalVolume: number
  totalSets: number
  maxWeight: number
}

type ChartMode = 'reps' | 'volume' | 'weight'

const chartConfig: Record<ChartMode, { key: string; label: string; color: string; unit: string }> = {
  reps: { key: 'totalReps', label: 'Total Reps', color: '#6366f1', unit: '' },
  volume: { key: 'totalVolume', label: 'Volume (kg)', color: '#22c55e', unit: ' kg' },
  weight: { key: 'maxWeight', label: 'Max Weight (kg)', color: '#f59e0b', unit: ' kg' },
}

export default function ProgressPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [chartMode, setChartMode] = useState<ChartMode>('reps')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [loading, setLoading] = useState(false)
  const [loadingExercises, setLoadingExercises] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      setExercises(data ?? [])
      setLoadingExercises(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedId) { setChartData([]); return }
    loadChartData(selectedId)
  }, [selectedId])

  const loadChartData = async (exerciseId: string) => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all session_exercises for this exercise in completed sessions
    const { data } = await supabase
      .from('session_exercises')
      .select(`
        id,
        exercise_id,
        sets:exercise_sets (reps, weight),
        workout_sessions!inner (id, date, end_time, user_id)
      `)
      .eq('exercise_id', exerciseId)
      .eq('workout_sessions.user_id', user.id)
      .not('workout_sessions.end_time', 'is', null)
      .order('workout_sessions.date', { ascending: true })

    if (!data) { setLoading(false); return }

    type RawSE = {
      id: string
      exercise_id: string
      sets: { reps: number | null; weight: number | null }[]
      workout_sessions: { id: string; date: string; end_time: string | null; user_id: string }
    }

    const points: ChartPoint[] = (data as unknown as RawSE[]).map(se => {
      const sets = se.sets ?? []
      const totalReps = sets.reduce((s, set) => s + (set.reps ?? 0), 0)
      const totalVolume = sets.reduce((s, set) => s + (set.reps ?? 0) * (set.weight ?? 0), 0)
      const maxWeight = sets.reduce((m, set) => Math.max(m, set.weight ?? 0), 0)
      const dateStr = se.workout_sessions.date

      return {
        rawDate: dateStr,
        date: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short', day: 'numeric',
        }),
        totalReps,
        totalVolume: Math.round(totalVolume * 10) / 10,
        totalSets: sets.length,
        maxWeight,
      }
    })

    setChartData(points)
    setLoading(false)
  }

  const selectedExercise = exercises.find(e => e.id === selectedId)
  const cfg = chartConfig[chartMode]

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: { value: number; name: string }[]
    label?: string
  }) => {
    if (!active || !payload?.length) return null
    const point = chartData.find(p => p.date === label)
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
        <p className="text-gray-400 mb-2 font-medium">{label}</p>
        <p className="text-white">
          {cfg.label}: <span className="font-bold">{payload[0].value}{cfg.unit}</span>
        </p>
        {point && (
          <>
            <p className="text-gray-400 text-xs mt-1">Sets: {point.totalSets}</p>
            {chartMode !== 'reps' && <p className="text-gray-400 text-xs">Total Reps: {point.totalReps}</p>}
            {chartMode !== 'volume' && point.totalVolume > 0 && (
              <p className="text-gray-400 text-xs">Volume: {point.totalVolume} kg</p>
            )}
            {chartMode !== 'weight' && point.maxWeight > 0 && (
              <p className="text-gray-400 text-xs">Max Weight: {point.maxWeight} kg</p>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Progress Tracker</h1>
      <p className="text-gray-400 text-sm mb-6">Track your improvement over time per exercise</p>

      {/* Exercise picker */}
      <div className="card p-5 mb-6">
        <label className="label">Select Exercise</label>
        {loadingExercises ? (
          <p className="text-gray-500 text-sm">Loading exercises...</p>
        ) : exercises.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No exercises found.{' '}
            <a href="/exercises" className="text-indigo-400 hover:underline">Add exercises</a> first.
          </p>
        ) : (
          <select
            className="input"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
          >
            <option value="">— Choose an exercise —</option>
            {exercises.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Chart controls */}
      {selectedId && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex bg-gray-800 rounded-lg p-1">
            {(Object.keys(chartConfig) as ChartMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setChartMode(mode)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  chartMode === mode
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                style={chartMode === mode ? { backgroundColor: chartConfig[mode].color } : {}}
              >
                {chartConfig[mode].label}
              </button>
            ))}
          </div>

          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                chartType === 'line' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                chartType === 'bar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      )}

      {/* Chart area */}
      {selectedId && (
        <div className="card p-5 mb-6">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Loading data...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-center">
              <div>
                <p>No completed sessions found for {selectedExercise?.name}.</p>
                <p className="text-sm mt-1">Log a workout with this exercise to see progress.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">
                  {selectedExercise?.name} — {cfg.label}
                </h2>
                <span className="text-xs text-gray-500">{chartData.length} sessions</span>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="date"
                      stroke="#4b5563"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#4b5563"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey={cfg.key}
                      stroke={cfg.color}
                      strokeWidth={2.5}
                      dot={{ fill: cfg.color, r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="date"
                      stroke="#4b5563"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#4b5563"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey={cfg.key}
                      fill={cfg.color}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </>
          )}
        </div>
      )}

      {/* Per-session data table */}
      {selectedId && chartData.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold text-white">Session Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Sets</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Total Reps</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Volume (kg)</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Max Weight</th>
                </tr>
              </thead>
              <tbody>
                {[...chartData].reverse().map((point, idx, arr) => {
                  const prev = arr[idx + 1]
                  const repDelta = prev ? point.totalReps - prev.totalReps : null
                  const volDelta = prev ? point.totalVolume - prev.totalVolume : null

                  return (
                    <tr key={point.rawDate} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-200">{point.date}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{point.totalSets}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-200">{point.totalReps}</span>
                        {repDelta !== null && repDelta !== 0 && (
                          <span className={`ml-1.5 text-xs ${repDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {repDelta > 0 ? '+' : ''}{repDelta}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-200">{point.totalVolume}</span>
                        {volDelta !== null && volDelta !== 0 && (
                          <span className={`ml-1.5 text-xs ${volDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {volDelta > 0 ? '+' : ''}{Math.round(volDelta * 10) / 10}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {point.maxWeight > 0 ? `${point.maxWeight} kg` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedId && !loadingExercises && exercises.length > 0 && (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-400">Select an exercise above to view your progress chart.</p>
        </div>
      )}
    </div>
  )
}
