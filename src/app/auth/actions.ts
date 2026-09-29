'use server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email')).trim(),
    password: String(formData.get('password')),
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect('/')
}

export async function signup(formData: FormData) {
  const email = String(formData.get('email')).trim()
  const password = String(formData.get('password'))
  const confirm = String(formData.get('confirm'))

  if (password.length < 8) redirect('/signup?error=Password must be at least 8 characters')
  if (password !== confirm) redirect('/signup?error=Passwords do not match')

  const origin = (await headers()).get('origin')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`)

  if (data.session) redirect('/') // email confirmation off
  redirect('/login?message=Check your email to confirm your account') // confirmation on
}

export async function deleteAccount(password: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Your session has expired. Please log in again.' }

  // Re-check the password so a logged-in device can't be used to delete the account by accident
  const { error: pwError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (pwError) return { error: 'Incorrect password.' }

  const admin = createAdminClient()
  const { error: delError } = await admin.auth.admin.deleteUser(user.id)
  if (delError) return { error: 'Could not delete your account. Please try again.' }

  await supabase.auth.signOut()
  redirect('/login?message=Your account and all its data have been deleted.')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}