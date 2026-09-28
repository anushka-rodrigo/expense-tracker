import AuthForm from '@/components/AuthForm'
import { login } from '@/app/auth/actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams
  return <AuthForm mode="login" action={login} error={error} message={message} />
}