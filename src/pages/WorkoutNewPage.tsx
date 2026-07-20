import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase'

export default function WorkoutNewPage() {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const handleStart = async () => {
    setStarting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStarting(false); return }

    const now = new Date()
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: user.id, date: now.toISOString().split('T')[0], start_time: now.toISOString() })
      .select()
      .single()

    if (error || !data) { setStarting(false); return }
    navigate(`/workout/${data.id}`)
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">New Workout</h1>
      <p className="text-gray-400 mb-8">{today}</p>

      <div className="card p-8 text-center">
        <div className="w-20 h-20 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Ready to lift?</h2>
        <p className="text-gray-400 mb-8">
          Starting a new session will record your start time and let you log exercises and sets in real time.
        </p>
        <button onClick={handleStart} disabled={starting} className="btn-primary px-8 py-3 text-base">
          {starting ? 'Starting...' : 'Start Workout'}
        </button>
      </div>
    </div>
  )
}
