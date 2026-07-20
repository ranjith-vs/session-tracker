import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Food, FoodLog } from '@/lib/types'

// ─── Helpers ────────────────────────────────────────────────

function round1(n: number) { return Math.round(n * 10) / 10 }

function calc(grams: number, per100: number | null) {
  if (per100 == null) return null
  return round1((grams / 100) * per100)
}

function fmt(n: number | null) {
  return n != null ? `${n}g` : '—'
}

function dateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Food Library Modal (add/edit food) ─────────────────────

function FoodFormModal({ food, onClose, onSave }: {
  food: Food | null
  onClose: () => void
  onSave: () => void
}) {
  const [name, setName] = useState(food?.name ?? '')
  const [calories, setCalories] = useState(food?.calories_per_100g?.toString() ?? '')
  const [carbs, setCarbs] = useState(food?.carbs_per_100g?.toString() ?? '')
  const [protein, setProtein] = useState(food?.protein_per_100g?.toString() ?? '')
  const [fat, setFat] = useState(food?.fat_per_100g?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      user_id: user.id,
      name: name.trim(),
      calories_per_100g: Number(calories),
      carbs_per_100g: carbs ? Number(carbs) : null,
      protein_per_100g: protein ? Number(protein) : null,
      fat_per_100g: fat ? Number(fat) : null,
      updated_at: new Date().toISOString(),
    }

    if (food) {
      await supabase.from('foods').update(payload).eq('id', food.id)
    } else {
      await supabase.from('foods').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-white mb-4">{food ? 'Edit Food' : 'Add Food'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Food Name *</label>
            <input type="text" className="input" placeholder="e.g. Chicken Breast"
              value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="label">Calories per 100g *</label>
            <input type="number" className="input" placeholder="e.g. 165"
              value={calories} onChange={e => setCalories(e.target.value)} required min="0" step="0.1" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Carbs /100g</label>
              <input type="number" className="input" placeholder="g"
                value={carbs} onChange={e => setCarbs(e.target.value)} min="0" step="0.1" />
            </div>
            <div>
              <label className="label">Protein /100g</label>
              <input type="number" className="input" placeholder="g"
                value={protein} onChange={e => setProtein(e.target.value)} min="0" step="0.1" />
            </div>
            <div>
              <label className="label">Fat /100g</label>
              <input type="number" className="input" placeholder="g"
                value={fat} onChange={e => setFat(e.target.value)} min="0" step="0.1" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Carbs, protein and fat are optional.</p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving || !name.trim() || !calories}>
              {saving ? 'Saving...' : food ? 'Update' : 'Add Food'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Log Food Modal (log food for day) ──────────────────────

function LogFoodModal({ foods, date, onClose, onLogged }: {
  foods: Food[]
  date: string
  onClose: () => void
  onLogged: () => void
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Food | null>(null)
  const [grams, setGrams] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  const preview = selected && grams
    ? {
        calories: round1((Number(grams) / 100) * selected.calories_per_100g),
        carbs: calc(Number(grams), selected.carbs_per_100g),
        protein: calc(Number(grams), selected.protein_per_100g),
        fat: calc(Number(grams), selected.fat_per_100g),
      }
    : null

  const handleLog = async () => {
    if (!selected || !grams) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const g = Number(grams)
    await supabase.from('food_logs').insert({
      user_id: user.id,
      food_id: selected.id,
      date,
      grams: g,
      calories: round1((g / 100) * selected.calories_per_100g),
      carbs: calc(g, selected.carbs_per_100g),
      protein: calc(g, selected.protein_per_100g),
      fat: calc(g, selected.fat_per_100g),
    })
    setSaving(false)
    onLogged()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">Log Food — {dateLabel(date)}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!selected ? (
          <>
            <div className="p-3 border-b border-gray-800">
              <input type="text" className="input text-sm" placeholder="Search food..."
                value={search} onChange={e => setSearch(e.target.value)} autoFocus />
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {filtered.length === 0
                ? <p className="text-gray-400 text-sm text-center py-6">No foods found</p>
                : filtered.map(f => (
                  <button key={f.id} onClick={() => setSelected(f)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors mb-1">
                    <p className="font-medium text-gray-200">{f.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {f.calories_per_100g} kcal / 100g
                      {f.protein_per_100g != null && ` · ${f.protein_per_100g}g protein`}
                      {f.carbs_per_100g != null && ` · ${f.carbs_per_100g}g carbs`}
                      {f.fat_per_100g != null && ` · ${f.fat_per_100g}g fat`}
                    </p>
                  </button>
                ))}
            </div>
          </>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <p className="font-medium text-white">{selected.name}</p>
                <p className="text-xs text-gray-500">{selected.calories_per_100g} kcal / 100g</p>
              </div>
            </div>

            <div>
              <label className="label">Grams eaten</label>
              <input type="number" className="input" placeholder="e.g. 150"
                value={grams} onChange={e => setGrams(e.target.value)}
                autoFocus min="1" step="1" />
            </div>

            {preview && (
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Calculated Macros</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-xl font-bold text-white">{preview.calories}</p>
                    <p className="text-xs text-gray-400">kcal</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-400">{fmt(preview.carbs)}</p>
                    <p className="text-xs text-gray-400">Carbs</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-400">{fmt(preview.protein)}</p>
                    <p className="text-xs text-gray-400">Protein</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-400">{fmt(preview.fat)}</p>
                    <p className="text-xs text-gray-400">Fat</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleLog} disabled={!grams || saving} className="btn-primary flex-1">
                {saving ? 'Logging...' : 'Log Food'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export default function NutritionPage() {
  const [tab, setTab] = useState<'log' | 'library' | 'history'>('log')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [foods, setFoods] = useState<Food[]>([])
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [showFoodForm, setShowFoodForm] = useState<Food | null | undefined>(undefined) // undefined=closed
  const [showLogModal, setShowLogModal] = useState(false)
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null)
  const [deleteFoodId, setDeleteFoodId] = useState<string | null>(null)
  const [historyDates, setHistoryDates] = useState<string[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const supabase = createClient()

  const loadFoods = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('foods').select('*').eq('user_id', user.id).order('name')
    setFoods((data ?? []) as Food[])
  }, [supabase])

  const loadLogsForDate = useCallback(async (date: string) => {
    setLoadingLogs(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingLogs(false); return }
    const { data } = await supabase
      .from('food_logs')
      .select('*, food:foods(*)')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('created_at')
    setFoodLogs((data ?? []) as FoodLog[])
    setLoadingLogs(false)
  }, [supabase])

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingHistory(false); return }
    const { data } = await supabase
      .from('food_logs')
      .select('date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    const unique = [...new Set((data ?? []).map(r => r.date))]
    setHistoryDates(unique)
    setLoadingHistory(false)
  }, [supabase])

  useEffect(() => { loadFoods() }, [loadFoods])
  useEffect(() => { loadLogsForDate(selectedDate) }, [selectedDate, loadLogsForDate])
  useEffect(() => { if (tab === 'history') loadHistory() }, [tab, loadHistory])

  const deleteLog = async (id: string) => {
    await supabase.from('food_logs').delete().eq('id', id)
    setDeleteLogId(null)
    setFoodLogs(prev => prev.filter(l => l.id !== id))
  }

  const deleteFood = async (id: string) => {
    await supabase.from('foods').delete().eq('id', id)
    setDeleteFoodId(null)
    setFoods(prev => prev.filter(f => f.id !== id))
  }

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const totals = foodLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      carbs: acc.carbs + (log.carbs ?? 0),
      protein: acc.protein + (log.protein ?? 0),
      fat: acc.fat + (log.fat ?? 0),
      hasCarbs: acc.hasCarbs || log.carbs != null,
      hasProtein: acc.hasProtein || log.protein != null,
      hasFat: acc.hasFat || log.fat != null,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0, hasCarbs: false, hasProtein: false, hasFat: false }
  )

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Nutrition</h1>

      {/* Tabs */}
      <div className="flex bg-gray-800 rounded-lg p-1 mb-6 w-fit">
        {(['log', 'library', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {t === 'log' ? 'Food Log' : t === 'library' ? 'Food Library' : 'History'}
          </button>
        ))}
      </div>

      {/* ── FOOD LOG TAB ── */}
      {tab === 'log' && (
        <>
          {/* Date navigator */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => shiftDate(-1)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <p className="font-semibold text-white">{dateLabel(selectedDate)}</p>
              <p className="text-xs text-gray-500">{selectedDate}</p>
            </div>
            <button onClick={() => shiftDate(1)} disabled={selectedDate >= today}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Daily totals card */}
          {foodLogs.length > 0 && (
            <div className="card p-4 mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Daily Totals</p>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{round1(totals.calories)}</p>
                  <p className="text-xs text-gray-400">kcal</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">
                    {totals.hasCarbs ? `${round1(totals.carbs)}g` : '—'}
                  </p>
                  <p className="text-xs text-gray-400">Carbs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">
                    {totals.hasProtein ? `${round1(totals.protein)}g` : '—'}
                  </p>
                  <p className="text-xs text-gray-400">Protein</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {totals.hasFat ? `${round1(totals.fat)}g` : '—'}
                  </p>
                  <p className="text-xs text-gray-400">Fat</p>
                </div>
              </div>
            </div>
          )}

          {/* Add food button */}
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowLogModal(true)} disabled={foods.length === 0}
              className="btn-primary flex items-center gap-2 text-sm"
              title={foods.length === 0 ? 'Add foods to your library first' : ''}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Log Food
            </button>
          </div>

          {foods.length === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-400 mb-4">
              Your food library is empty.{' '}
              <button onClick={() => setTab('library')} className="underline hover:no-underline">
                Add foods to your library
              </button>{' '}first.
            </div>
          )}

          {/* Food log entries */}
          {loadingLogs ? (
            <div className="card p-8 text-center text-gray-400">Loading...</div>
          ) : foodLogs.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400">Nothing logged for {dateLabel(selectedDate)}.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {foodLogs.map(log => (
                <div key={log.id} className="card p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white">{log.food?.name}</p>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                        {log.grams}g
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
                      <span className="text-white font-medium">{round1(log.calories)} kcal</span>
                      {log.carbs != null && <span className="text-amber-400">{round1(log.carbs)}g carbs</span>}
                      {log.protein != null && <span className="text-blue-400">{round1(log.protein)}g protein</span>}
                      {log.fat != null && <span className="text-red-400">{round1(log.fat)}g fat</span>}
                    </div>
                  </div>
                  <button onClick={() => setDeleteLogId(log.id)}
                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── FOOD LIBRARY TAB ── */}
      {tab === 'library' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">{foods.length} food{foods.length !== 1 ? 's' : ''} in library</p>
            <button onClick={() => setShowFoodForm(null)} className="btn-primary flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Food
            </button>
          </div>

          {foods.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400 mb-4">No foods added yet.</p>
              <button onClick={() => setShowFoodForm(null)} className="btn-primary">Add your first food</button>
            </div>
          ) : (
            <div className="space-y-2">
              {foods.map(food => (
                <div key={food.id} className="card p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{food.name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                      <span className="text-white">{food.calories_per_100g} kcal/100g</span>
                      {food.carbs_per_100g != null && <span className="text-amber-400">{food.carbs_per_100g}g carbs</span>}
                      {food.protein_per_100g != null && <span className="text-blue-400">{food.protein_per_100g}g protein</span>}
                      {food.fat_per_100g != null && <span className="text-red-400">{food.fat_per_100g}g fat</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setShowFoodForm(food)}
                      className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleteFoodId(food.id)}
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
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <>
          <p className="text-gray-400 text-sm mb-4">All days with logged food</p>
          {loadingHistory ? (
            <div className="card p-8 text-center text-gray-400">Loading...</div>
          ) : historyDates.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No food logged yet.</div>
          ) : (
            <div className="space-y-2">
              {historyDates.map(date => (
                <button key={date} onClick={() => { setSelectedDate(date); setTab('log') }}
                  className="card p-4 w-full text-left flex items-center justify-between hover:border-gray-700 transition-colors">
                  <div>
                    <p className="font-medium text-white">{dateLabel(date)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{date}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showFoodForm !== undefined && (
        <FoodFormModal
          food={showFoodForm}
          onClose={() => setShowFoodForm(undefined)}
          onSave={async () => { setShowFoodForm(undefined); await loadFoods() }}
        />
      )}

      {showLogModal && (
        <LogFoodModal
          foods={foods}
          date={selectedDate}
          onClose={() => setShowLogModal(false)}
          onLogged={async () => { setShowLogModal(false); await loadLogsForDate(selectedDate) }}
        />
      )}

      {deleteLogId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Remove Food Log?</h2>
            <p className="text-gray-400 text-sm mb-6">This entry will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteLogId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteLog(deleteLogId)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">Remove</button>
            </div>
          </div>
        </div>
      )}

      {deleteFoodId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Delete Food?</h2>
            <p className="text-gray-400 text-sm mb-6">This food and all its logs will be deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteFoodId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteFood(deleteFoodId)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
