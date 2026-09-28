import AuthForm from '@/components/AuthForm'
import { signup } from '@/app/auth/actions'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams
  return <AuthForm mode="signup" action={signup} error={error} message={message} />
}