import Link from 'next/link'
import Image from 'next/image'

type Props = {
  mode: 'login' | 'signup'
  action: (formData: FormData) => void | Promise<void>
  error?: string
  message?: string
}

const input =
  'w-full bg-[#1C1C21] border border-[#2A2A30] rounded-md px-3 py-2.5 text-sm placeholder:text-[#5A5A62] focus:outline-none focus:border-[#D4B483]'

export default function AuthForm({ mode, action, error, message }: Props) {
  const isLogin = mode === 'login'
  return (
    <main className="min-h-screen bg-[#131316] text-[#F2F1EE] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-1">
          <Image src="/logo/ultrix-icon.svg" alt="" width={36} height={36} className="rounded-[8px]" />
          <h1 className="text-2xl font-semibold tracking-tight">Ultrix Expense Tracker</h1>
        </div>
        <p className="text-sm text-[#86858C] mb-8">
          {isLogin ? 'Log in to your account' : 'Create your account'}
        </p>

        {error && <p className="text-sm text-[#C97B7B] mb-4">{error}</p>}
        {message && <p className="text-sm text-[#7FB88F] mb-4">{message}</p>}

        <form action={action} className="space-y-3">
          <input name="email" type="email" placeholder="Email" required autoComplete="email" className={input} />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            className={input}
          />
          {!isLogin && (
            <input
              name="confirm"
              type="password"
              placeholder="Confirm password"
              required
              minLength={8}
              autoComplete="new-password"
              className={input}
            />
          )}
          <button
            type="submit"
            className="w-full bg-[#D4B483] text-[#131316] font-medium rounded-md py-2.5 text-sm hover:opacity-90"
          >
            {isLogin ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className="text-sm text-[#86858C] mt-6">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link href={isLogin ? '/signup' : '/login'} className="text-[#D4B483]">
            {isLogin ? 'Sign up' : 'Log in'}
          </Link>
        </p>
      </div>
    </main>
  )
}