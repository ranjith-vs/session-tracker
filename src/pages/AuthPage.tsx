import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase'

export default function AuthPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const emailFromUsername = (u: string) => `${u.toLowerCase().trim()}@progresslift.app`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const email = emailFromUsername(username)

    try {
      if (tab === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.toLowerCase().trim() } },
        })
        if (error) {
          setError(error.message.includes('already registered') ? 'Username already taken.' : error.message)
          return
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError('Invalid username or password.'); return }
      }
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">ProgressLift</h1>
          <p className="text-gray-400 mt-1">Track your progressive overload</p>
        </div>

        <div className="card p-6">
          <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setTab('login'); setError('') }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'login' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >Login</button>
            <button
              onClick={() => { setTab('register'); setError('') }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'register' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input type="text" className="input" placeholder="your_username"
                value={username} onChange={e => setUsername(e.target.value)}
                required minLength={3} maxLength={30}
                pattern="[a-zA-Z0-9_]+" title="Letters, numbers and underscores only"
                autoComplete="username" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                required minLength={6}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'} />
              {tab === 'register' && <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>}
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
            )}
            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Please wait...' : tab === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
