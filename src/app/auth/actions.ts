'use server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

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

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}