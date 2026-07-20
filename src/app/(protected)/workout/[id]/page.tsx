import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkoutClient from './WorkoutClient'

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Verify the session belongs to this user
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) redirect('/history')

  return <WorkoutClient sessionId={id} userId={user.id} />
}
