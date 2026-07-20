import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createClient } from '@/lib/supabase'
import type { WorkoutSession, SessionExercise, ExerciseSet } from '@/lib/types'

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m === 0 ? `${s}s` : s === 0 ? `${m}m` : `${m}m ${s}s`
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

type SessionWithDetails = WorkoutSession & {
  session_exercises: (SessionExercise & {
    exercise: { name: string }
    sets: ExerciseSet[]
  })[]
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [exerciseCount, setExerciseCount] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]

      const [sessionsRes, countRes, totalRes] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*, session_exercises(id, order_index, exercise:exercises(name), sets:exercise_sets(reps, weight))')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('exercises').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('workout_sessions').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).not('end_time', 'is', null),
      ])

      setSessions((sessionsRes.data ?? []) as SessionWithDetails[])
      setExerciseCount(countRes.count ?? 0)
      setTotalSessions(totalRes.count ?? 0)
      setLoading(false)

      void today
    }
    load()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayCount = sessions.filter(s => s.date === today).length
  const inProgress = sessions.find(s => !s.end_time)
  const completed = sessions.filter(s => s.end_time)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-gray-400 text-sm">Total Workouts</p>
          <p className="text-3xl font-bold text-white mt-1">{loading ? '—' : totalSessions}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-400 text-sm">Exercises</p>
          <p className="text-3xl font-bold text-white mt-1">{loading ? '—' : exerciseCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-400 text-sm">Today</p>
          <p className="text-3xl font-bold text-white mt-1">{loading ? '—' : todayCount}</p>
        </div>
      </div>

      {/* In-progress session */}
      {inProgress && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-amber-400 font-medium">Workout in progress</p>
            <p className="text-gray-400 text-sm mt-0.5">{formatDate(inProgress.date)} — tap to resume</p>
          </div>
          <Link to={`/workout/${inProgress.id}`} className="btn-primary text-sm">Resume</Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
        <Link to="/workout/new" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Start Workout
        </Link>
        <Link to="/exercises" className="btn-secondary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Exercises
        </Link>
      </div>

      {/* Recent workouts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Workouts</h2>
          <Link to="/history" className="text-indigo-400 text-sm hover:text-indigo-300">View all</Link>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-gray-400">Loading...</div>
        ) : completed.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-400">No workouts yet.</p>
            <Link to="/workout/new" className="btn-primary mt-4 inline-flex">Start your first workout</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map(session => {
              const sorted = [...(session.session_exercises ?? [])].sort((a, b) => a.order_index - b.order_index)
              const totalSets = sorted.reduce((s, se) => s + (se.sets?.length ?? 0), 0)
              const totalVolume = sorted.reduce((s, se) =>
                s + (se.sets ?? []).reduce((s2, set) => s2 + (set.reps ?? 0) * (set.weight ?? 0), 0), 0)

              return (
                <Link key={session.id} to={`/workout/${session.id}`}
                  className="card p-4 flex items-center justify-between hover:border-gray-700 transition-colors block">
                  <div>
                    <p className="font-medium text-white">{formatDate(session.date)}</p>
                    <p className="text-sm text-gray-400 mt-0.5 truncate max-w-xs">
                      {sorted.map(se => se.exercise?.name).join(', ') || 'No exercises'}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>{totalSets} sets</span>
                      {totalVolume > 0 && <span>{totalVolume.toLocaleString()} kg</span>}
                      {session.total_duration_seconds && <span>{formatDuration(session.total_duration_seconds)}</span>}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
