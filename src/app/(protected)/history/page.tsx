import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WorkoutSession, SessionExercise, ExerciseSet } from '@/lib/types'

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatTime(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

type SessionWithDetails = WorkoutSession & {
  session_exercises: (SessionExercise & {
    exercise: { name: string }
    sets: ExerciseSet[]
  })[]
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      session_exercises (
        id, order_index,
        exercise:exercises (name),
        sets:exercise_sets (reps, weight)
      )
    `)
    .eq('user_id', user!.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false }) as { data: SessionWithDetails[] | null }

  const allSessions = sessions ?? []

  // Group by month
  const grouped: Record<string, SessionWithDetails[]> = {}
  for (const session of allSessions) {
    const key = new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long', year: 'numeric',
    })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(session)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Workout History</h1>
          <p className="text-gray-400 text-sm mt-1">{allSessions.length} sessions total</p>
        </div>
        <Link href="/workout/new" className="btn-primary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Workout
        </Link>
      </div>

      {allSessions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 mb-4">No workouts recorded yet.</p>
          <Link href="/workout/new" className="btn-primary">Start your first workout</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, sessions]) => (
            <div key={month}>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">{month}</h2>
              <div className="space-y-2">
                {sessions.map(session => {
                  const sortedSE = [...(session.session_exercises ?? [])].sort(
                    (a, b) => a.order_index - b.order_index
                  )
                  const totalSets = sortedSE.reduce((s, se) => s + (se.sets?.length ?? 0), 0)
                  const totalReps = sortedSE.reduce((s, se) =>
                    s + (se.sets ?? []).reduce((s2, set) => s2 + (set.reps ?? 0), 0), 0)
                  const totalVolume = sortedSE.reduce((s, se) =>
                    s + (se.sets ?? []).reduce((s2, set) => s2 + (set.reps ?? 0) * (set.weight ?? 0), 0), 0)
                  const isInProgress = !session.end_time

                  return (
                    <Link
                      key={session.id}
                      href={`/workout/${session.id}`}
                      className="card p-4 flex items-center justify-between hover:border-gray-700 transition-colors block"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-white">{formatDate(session.date)}</p>
                          {isInProgress && (
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                              In Progress
                            </span>
                          )}
                        </div>

                        {sortedSE.length > 0 && (
                          <p className="text-sm text-gray-400 truncate">
                            {sortedSE.map(se => se.exercise?.name).join(' · ')}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                          {formatTime(session.start_time) && (
                            <span>{formatTime(session.start_time)}</span>
                          )}
                          {formatDuration(session.total_duration_seconds) && (
                            <span className="text-indigo-400">
                              {formatDuration(session.total_duration_seconds)}
                            </span>
                          )}
                          {sortedSE.length > 0 && (
                            <span>{sortedSE.length} exercise{sortedSE.length !== 1 ? 's' : ''}</span>
                          )}
                          {totalSets > 0 && <span>{totalSets} sets</span>}
                          {totalReps > 0 && <span>{totalReps} reps</span>}
                          {totalVolume > 0 && (
                            <span>{totalVolume.toLocaleString()} kg vol</span>
                          )}
                        </div>
                      </div>

                      <svg className="w-5 h-5 text-gray-600 flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
