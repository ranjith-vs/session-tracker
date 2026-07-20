import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { createClient } from '@/lib/supabase'

export default function Layout() {
  const [username, setUsername] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      setUsername(data?.username ?? user.email?.split('@')[0] ?? 'user')
    })
  }, [])

  return (
    <div className="flex min-h-screen">
      <Navbar username={username} />
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
