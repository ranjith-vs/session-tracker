import { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

export default function ProtectedRoute() {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/auth" replace />
}
