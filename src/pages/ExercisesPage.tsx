import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Exercise } from '@/lib/types'

function Modal({ exercise, onClose, onSave }: {
  exercise: Exercise | null
  onClose: () => void
  onSave: (name: string, description: string) => Promise<void>
}) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [description, setDescription] = useState(exercise?.description ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave(name.trim(), description.trim())
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-white mb-4">{exercise ? 'Edit Exercise' : 'Add Exercise'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Exercise Name *</label>
            <input type="text" className="input" placeholder="e.g. Bench Press"
              value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input resize-none" rows={3} placeholder="Notes..."
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : exercise ? 'Update' : 'Add Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalExercise, setModalExercise] = useState<Exercise | null | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadExercises = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('exercises').select('*').eq('user_id', user.id).order('name')
    setExercises(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadExercises() }, [])

  const handleSave = async (name: string, description: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (modalExercise) {
      await supabase.from('exercises')
        .update({ name, description: description || null, updated_at: new Date().toISOString() })
        .eq('id', modalExercise.id)
    } else {
      await supabase.from('exercises').insert({ user_id: user.id, name, description: description || null })
    }
    setModalExercise(undefined)
    await loadExercises()
  }

  const handleDelete = async (id: string) => {
    await createClient().from('exercises').delete().eq('id', id)
    setDeleteId(null)
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Exercises</h1>
          <p className="text-gray-400 text-sm mt-1">{exercises.length} in your library</p>
        </div>
        <button onClick={() => setModalExercise(null)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Exercise
        </button>
      </div>

      <div className="relative mb-4">
        <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" className="input pl-10" placeholder="Search exercises..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          {search
            ? <p className="text-gray-400">No exercises match &quot;{search}&quot;</p>
            : <><p className="text-gray-400">No exercises yet.</p>
               <button onClick={() => setModalExercise(null)} className="btn-primary mt-4">Add your first exercise</button></>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(exercise => (
            <div key={exercise.id} className="card p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">{exercise.name}</p>
                {exercise.description && <p className="text-sm text-gray-400 mt-0.5 truncate">{exercise.description}</p>}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => setModalExercise(exercise)}
                  className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => setDeleteId(exercise.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalExercise !== undefined && (
        <Modal exercise={modalExercise} onClose={() => setModalExercise(undefined)} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Delete Exercise?</h2>
            <p className="text-gray-400 text-sm mb-6">This will permanently delete the exercise.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
