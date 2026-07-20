import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase'
import type { WorkoutSession, SessionExercise, ExerciseSet, Exercise } from '@/lib/types'

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function DeltaBadge({ delta, unit }: { delta: number; unit: string }) {
  if (delta === 0) return null
  const up = delta > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${up ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(delta)}{unit}
    </span>
  )
}

function SetRowEditable({ set, seId, onUpdate, onDelete }: {
  set: ExerciseSet; seId: string
  onUpdate: (setId: string, seId: string, u: Partial<ExerciseSet>) => void
  onDelete: (setId: string, seId: string) => void
}) {
  const [f, setF] = useState({
    reps: set.reps?.toString() ?? '',
    weight: set.weight?.toString() ?? '',
    time_elapsed_seconds: set.time_elapsed_seconds?.toString() ?? '',
    rest_before_seconds: set.rest_before_seconds?.toString() ?? '0',
    remarks: set.remarks ?? '',
  })

  const blur = (field: string, value: string) => {
    const parsed = field === 'remarks' ? (value || null) : value === '' ? null : Number(value)
    onUpdate(set.id, seId, { [field]: parsed })
  }

  return (
    <div className="grid grid-cols-12 gap-1.5 items-center py-2 border-t border-gray-800 first:border-t-0 text-sm">
      <div className="col-span-1 text-gray-500 text-center font-medium">{set.set_number}</div>
      <div className="col-span-2">
        <input type="number" className="input text-xs py-1.5 px-2 text-center" placeholder="Rest(s)"
          value={f.rest_before_seconds} onChange={e => setF(p => ({ ...p, rest_before_seconds: e.target.value }))}
          onBlur={e => blur('rest_before_seconds', e.target.value)} min="0" title="Rest before this set (seconds)" />
      </div>
      <div className="col-span-2">
        <input type="number" className="input text-xs py-1.5 px-2 text-center" placeholder="Reps"
          value={f.reps} onChange={e => setF(p => ({ ...p, reps: e.target.value }))}
          onBlur={e => blur('reps', e.target.value)} min="0" />
      </div>
      <div className="col-span-2">
        <input type="number" className="input text-xs py-1.5 px-2 text-center" placeholder="kg"
          value={f.weight} onChange={e => setF(p => ({ ...p, weight: e.target.value }))}
          onBlur={e => blur('weight', e.target.value)} step="0.5" min="0" />
      </div>
      <div className="col-span-2">
        <input type="number" className="input text-xs py-1.5 px-2 text-center" placeholder="Time(s)"
          value={f.time_elapsed_seconds} onChange={e => setF(p => ({ ...p, time_elapsed_seconds: e.target.value }))}
          onBlur={e => blur('time_elapsed_seconds', e.target.value)} min="0" />
      </div>
      <div className="col-span-2">
        <input type="text" className="input text-xs py-1.5 px-2" placeholder="Remarks"
          value={f.remarks} onChange={e => setF(p => ({ ...p, remarks: e.target.value }))}
          onBlur={e => blur('remarks', e.target.value)} />
      </div>
      <div className="col-span-1 flex justify-center">
        <button onClick={() => onDelete(set.id, seId)} className="text-gray-600 hover:text-red-400 p-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function SetRowView({ set, prevSet }: { set: ExerciseSet; prevSet: ExerciseSet | null }) {
  const rd = prevSet && set.reps != null && prevSet.reps != null ? set.reps - prevSet.reps : null
  const wd = prevSet && set.weight != null && prevSet.weight != null ? set.weight - prevSet.weight : null
  return (
    <div className="grid grid-cols-12 gap-1.5 items-center py-2.5 border-t border-gray-800 first:border-t-0 text-sm">
      <div className="col-span-1 text-gray-500 text-center">{set.set_number}</div>
      <div className="col-span-2 text-center text-xs text-gray-400">
        {set.rest_before_seconds > 0 ? `${formatDuration(set.rest_before_seconds)} rest` : '—'}
      </div>
      <div className="col-span-2 text-center">
        {set.reps != null
          ? <div><span className="font-medium text-white">{set.reps}</span>{rd !== null && <DeltaBadge delta={rd} unit="" />}</div>
          : <span className="text-gray-600">—</span>}
      </div>
      <div className="col-span-2 text-center">
        {set.weight != null
          ? <div><span className="font-medium text-white">{set.weight}kg</span>{wd !== null && <DeltaBadge delta={wd} unit="kg" />}</div>
          : <span className="text-gray-600">—</span>}
      </div>
      <div className="col-span-2 text-center text-xs text-gray-400">
        {set.time_elapsed_seconds != null ? formatDuration(set.time_elapsed_seconds) : '—'}
      </div>
      <div className="col-span-3 text-xs text-gray-400 truncate">{set.remarks || '—'}</div>
    </div>
  )
}

function ExerciseSelectorModal({ exercises, usedIds, onSelect, onClose }: {
  exercises: Exercise[]; usedIds: Set<string>
  onSelect: (id: string) => void; onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md flex flex-col max-h-[70vh]">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Select Exercise</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 border-b border-gray-800">
          <input type="text" className="input text-sm" placeholder="Search exercises..." value={search}
            onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {filtered.length === 0
            ? <p className="text-gray-400 text-center py-6 text-sm">No exercises found</p>
            : filtered.map(ex => (
              <button key={ex.id} onClick={() => onSelect(ex.id)} disabled={usedIds.has(ex.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors mb-1 ${usedIds.has(ex.id) ? 'text-gray-600 cursor-not-allowed' : 'text-gray-200 hover:bg-gray-800'}`}>
                <span className="font-medium">{ex.name}</span>
                {usedIds.has(ex.id) && <span className="text-xs text-gray-600 ml-2">already added</span>}
                {ex.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{ex.description}</p>}
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}

function ExerciseCard({ se, isEditable, isFirst, isLast, prevSets, onRemove, onAddSet, onUpdateSet, onDeleteSet, onUpdateRest, onMoveUp, onMoveDown }: {
  se: SessionExercise; isEditable: boolean; isFirst: boolean; isLast: boolean; prevSets: ExerciseSet[]
  onRemove: (id: string) => void; onAddSet: (id: string) => void
  onUpdateSet: (setId: string, seId: string, u: Partial<ExerciseSet>) => void
  onDeleteSet: (setId: string, seId: string) => void
  onUpdateRest: (seId: string, s: number) => void
  onMoveUp: (id: string) => void; onMoveDown: (id: string) => void
}) {
  const [restInput, setRestInput] = useState(se.rest_before_seconds?.toString() ?? '0')
  const totalReps = (se.sets || []).reduce((s, set) => s + (set.reps ?? 0), 0)
  const totalVolume = (se.sets || []).reduce((s, set) => s + (set.reps ?? 0) * (set.weight ?? 0), 0)
  const prevReps = prevSets.reduce((s, set) => s + (set.reps ?? 0), 0)
  const repsDelta = prevSets.length > 0 ? totalReps - prevReps : null

  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-2 bg-gray-900/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white">{se.exercise?.name ?? 'Unknown'}</h3>
            {(se.sets?.length ?? 0) > 0 && (
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                {se.sets?.length} set{se.sets?.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
            {totalReps > 0 && (
              <span className="flex items-center gap-1">
                {totalReps} reps
                {repsDelta !== null && repsDelta !== 0 && <DeltaBadge delta={repsDelta} unit="" />}
              </span>
            )}
            {totalVolume > 0 && <span>{totalVolume.toLocaleString()} kg vol</span>}
          </div>
        </div>
        {isEditable && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onMoveUp(se.id)} disabled={isFirst}
              className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button onClick={() => onMoveDown(se.id)} disabled={isLast}
              className="p-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button onClick={() => onRemove(se.id)} className="p-1.5 text-gray-500 hover:text-red-400 ml-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-gray-950/30 flex items-center gap-2 text-sm border-b border-gray-800">
        <span className="text-gray-500 text-xs">Rest before exercise:</span>
        {isEditable ? (
          <>
            <input type="number" className="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 w-24 text-xs focus:outline-none focus:border-indigo-500"
              placeholder="0" value={restInput}
              onChange={e => setRestInput(e.target.value)}
              onBlur={e => onUpdateRest(se.id, Number(e.target.value) || 0)} min="0" />
            <span className="text-gray-600 text-xs">seconds</span>
          </>
        ) : (
          <span className="text-gray-300 text-xs">
            {se.rest_before_seconds > 0 ? formatDuration(se.rest_before_seconds) : '—'}
          </span>
        )}
      </div>

      <div className="px-4 pb-2">
        {(se.sets?.length ?? 0) > 0 && (
          <div className="grid grid-cols-12 gap-1.5 py-2 text-xs text-gray-500 font-medium">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-2 text-center">Rest(s)</div>
            <div className="col-span-2 text-center">Reps</div>
            <div className="col-span-2 text-center">kg</div>
            <div className="col-span-2 text-center">Time(s)</div>
            <div className="col-span-2 text-center">Remarks</div>
            {isEditable && <div className="col-span-1" />}
          </div>
        )}
        {(se.sets || []).map(set =>
          isEditable
            ? <SetRowEditable key={set.id} set={set} seId={se.id} onUpdate={onUpdateSet} onDelete={onDeleteSet} />
            : <SetRowView key={set.id} set={set} prevSet={prevSets.find(p => p.set_number === set.set_number) ?? null} />
        )}
        {isEditable && (
          <div className="pt-3 pb-1">
            <button onClick={() => onAddSet(se.id)}
              className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1.5 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Set
            </button>
          </div>
        )}
        {!isEditable && (se.sets?.length ?? 0) === 0 && (
          <p className="text-gray-600 text-sm py-3">No sets recorded</p>
        )}
      </div>
    </div>
  )
}

export default function WorkoutDetailPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [prevSetsMap, setPrevSetsMap] = useState<Record<string, ExerciseSet[]>>({})
  const [loading, setLoading] = useState(true)
  const [timer, setTimer] = useState(0)
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [endingWorkout, setEndingWorkout] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const supabase = createClient()

  const loadPrevData = useCallback(async (sessionDate: string, seList: SessionExercise[], userId: string) => {
    const { data: prevSessions } = await supabase
      .from('workout_sessions')
      .select('id, date')
      .eq('user_id', userId)
      .lt('date', sessionDate)
      .not('end_time', 'is', null)
      .order('date', { ascending: false })
      .limit(10)

    if (!prevSessions?.length) return
    const prevIds = prevSessions.map(s => s.id)
    const exerciseIds = seList.map(se => se.exercise_id)

    const { data: prevSEData } = await supabase
      .from('session_exercises')
      .select('id, session_id, exercise_id, sets:exercise_sets(*)')
      .in('session_id', prevIds)
      .in('exercise_id', exerciseIds)

    const newMap: Record<string, ExerciseSet[]> = {}
    for (const se of seList) {
      for (const ps of prevSessions) {
        const found = prevSEData?.find(d => d.session_id === ps.id && d.exercise_id === se.exercise_id)
        if (found) {
          newMap[se.exercise_id] = [...(found.sets ?? [])].sort((a, b) => a.set_number - b.set_number)
          break
        }
      }
    }
    setPrevSetsMap(newMap)
  }, [supabase])

  const loadData = useCallback(async () => {
    if (!sessionId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [sessRes, seRes, exRes] = await Promise.all([
      supabase.from('workout_sessions').select('*').eq('id', sessionId).single(),
      supabase.from('session_exercises').select('*, exercise:exercises(*), sets:exercise_sets(*)')
        .eq('session_id', sessionId).order('order_index'),
      supabase.from('exercises').select('*').eq('user_id', user.id).order('name'),
    ])

    const sess = sessRes.data as WorkoutSession | null
    const sorted = ((seRes.data ?? []) as SessionExercise[]).map(se => ({
      ...se, sets: [...(se.sets ?? [])].sort((a, b) => a.set_number - b.set_number),
    }))

    setSession(sess)
    setSessionExercises(sorted)
    setAllExercises((exRes.data ?? []) as Exercise[])
    setLoading(false)

    if (sess?.end_time && sorted.length > 0) {
      loadPrevData(sess.date, sorted, user.id)
    }
  }, [sessionId, supabase, loadPrevData])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!session?.start_time || session.end_time) return
    const tick = () => setTimer(Math.floor((Date.now() - new Date(session.start_time!).getTime()) / 1000))
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session?.start_time, session?.end_time])

  const isEditable = !session?.end_time

  const addExercise = async (exerciseId: string) => {
    const { data } = await supabase.from('session_exercises')
      .insert({ session_id: sessionId, exercise_id: exerciseId, order_index: sessionExercises.length, rest_before_seconds: 0 })
      .select('*, exercise:exercises(*), sets:exercise_sets(*)')
      .single()
    if (data) setSessionExercises(prev => [...prev, { ...data, sets: [] }])
    setShowExerciseSelector(false)
  }

  const removeExercise = async (seId: string) => {
    await supabase.from('session_exercises').delete().eq('id', seId)
    const remaining = sessionExercises.filter(se => se.id !== seId)
    await Promise.all(remaining.map((se, i) => supabase.from('session_exercises').update({ order_index: i }).eq('id', se.id)))
    setSessionExercises(remaining.map((se, i) => ({ ...se, order_index: i })))
  }

  const moveExercise = async (seId: string, dir: 'up' | 'down') => {
    const idx = sessionExercises.findIndex(se => se.id === seId)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sessionExercises.length) return
    const list = [...sessionExercises]
    ;[list[idx], list[swapIdx]] = [list[swapIdx], list[idx]]
    const reindexed = list.map((se, i) => ({ ...se, order_index: i }))
    setSessionExercises(reindexed)
    await Promise.all([
      supabase.from('session_exercises').update({ order_index: idx }).eq('id', list[swapIdx].id),
      supabase.from('session_exercises').update({ order_index: swapIdx }).eq('id', list[idx].id),
    ])
  }

  const updateExerciseRest = async (seId: string, seconds: number) => {
    await supabase.from('session_exercises').update({ rest_before_seconds: seconds }).eq('id', seId)
    setSessionExercises(prev => prev.map(se => se.id === seId ? { ...se, rest_before_seconds: seconds } : se))
  }

  const addSet = async (seId: string) => {
    const se = sessionExercises.find(s => s.id === seId)
    const { data } = await supabase.from('exercise_sets')
      .insert({ session_exercise_id: seId, set_number: (se?.sets?.length ?? 0) + 1, rest_before_seconds: 0 })
      .select().single()
    if (data) setSessionExercises(prev => prev.map(se => se.id === seId ? { ...se, sets: [...(se.sets ?? []), data] } : se))
  }

  const updateSet = async (setId: string, seId: string, updates: Partial<ExerciseSet>) => {
    await supabase.from('exercise_sets').update(updates).eq('id', setId)
    setSessionExercises(prev => prev.map(se =>
      se.id === seId ? { ...se, sets: (se.sets ?? []).map(s => s.id === setId ? { ...s, ...updates } : s) } : se
    ))
  }

  const deleteSet = async (setId: string, seId: string) => {
    await supabase.from('exercise_sets').delete().eq('id', setId)
    setSessionExercises(prev => prev.map(se =>
      se.id === seId ? { ...se, sets: (se.sets ?? []).filter(s => s.id !== setId) } : se
    ))
  }

  const endWorkout = async () => {
    setEndingWorkout(true)
    const endTime = new Date().toISOString()
    const duration = session?.start_time
      ? Math.floor((new Date(endTime).getTime() - new Date(session.start_time).getTime()) / 1000) : null
    const { data } = await supabase.from('workout_sessions')
      .update({ end_time: endTime, total_duration_seconds: duration }).eq('id', sessionId!).select().single()
    if (data) { setSession(data); if (timerRef.current) clearInterval(timerRef.current) }
    setEndingWorkout(false)
    setShowEndConfirm(false)
  }

  const usedIds = new Set(sessionExercises.map(se => se.exercise_id))

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">Loading workout...</p></div>
  if (!session) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">Session not found.</p></div>

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{formatDate(session.date)}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isEditable ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                {isEditable ? 'In Progress' : 'Completed'}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
              <span>Start: {formatTime(session.start_time)}</span>
              {session.end_time && <span>End: {formatTime(session.end_time)}</span>}
              {session.total_duration_seconds && (
                <span className="text-indigo-400 font-medium">Duration: {formatDuration(session.total_duration_seconds)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEditable && (
              <>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-indigo-400">{formatDuration(timer)}</p>
                  <p className="text-xs text-gray-500">elapsed</p>
                </div>
                <button onClick={() => setShowEndConfirm(true)}
                  className="bg-green-600 hover:bg-green-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">
                  End Workout
                </button>
              </>
            )}
            {!isEditable && (
              <button onClick={() => navigate('/history')} className="btn-secondary text-sm">Back to History</button>
            )}
          </div>
        </div>

        {!isEditable && sessionExercises.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{sessionExercises.length}</p>
              <p className="text-xs text-gray-400">Exercises</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{sessionExercises.reduce((s, se) => s + (se.sets?.length ?? 0), 0)}</p>
              <p className="text-xs text-gray-400">Total Sets</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">
                {sessionExercises.reduce((s, se) => s + (se.sets ?? []).reduce((s2, set) => s2 + (set.reps ?? 0) * (set.weight ?? 0), 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">kg Volume</p>
            </div>
          </div>
        )}
      </div>

      {/* Exercise list */}
      <div className="space-y-4">
        {sessionExercises.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-gray-400 mb-4">No exercises added yet.</p>
            {isEditable && <button onClick={() => setShowExerciseSelector(true)} className="btn-primary">Add First Exercise</button>}
          </div>
        )}
        {sessionExercises.map((se, idx) => (
          <ExerciseCard key={se.id} se={se} isEditable={isEditable}
            isFirst={idx === 0} isLast={idx === sessionExercises.length - 1}
            prevSets={prevSetsMap[se.exercise_id] ?? []}
            onRemove={removeExercise} onAddSet={addSet}
            onUpdateSet={updateSet} onDeleteSet={deleteSet}
            onUpdateRest={updateExerciseRest}
            onMoveUp={id => moveExercise(id, 'up')}
            onMoveDown={id => moveExercise(id, 'down')} />
        ))}
      </div>

      {isEditable && sessionExercises.length > 0 && (
        <div className="mt-4">
          <button onClick={() => setShowExerciseSelector(true)}
            className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-indigo-500 text-gray-500 hover:text-indigo-400 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Exercise
          </button>
        </div>
      )}

      {isEditable && allExercises.length === 0 && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-400">
          No exercises in library. <a href="/exercises" className="underline">Add exercises</a> first.
        </div>
      )}

      {showExerciseSelector && (
        <ExerciseSelectorModal exercises={allExercises} usedIds={usedIds}
          onSelect={addExercise} onClose={() => setShowExerciseSelector(false)} />
      )}

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-2">End Workout?</h2>
            <p className="text-gray-400 text-sm mb-6">This will record your end time and mark the session as completed.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndConfirm(false)} className="btn-secondary flex-1" disabled={endingWorkout}>Cancel</button>
              <button onClick={endWorkout} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-medium px-4 py-2 rounded-lg transition-colors" disabled={endingWorkout}>
                {endingWorkout ? 'Saving...' : 'End Workout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
