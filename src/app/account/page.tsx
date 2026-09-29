import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'
import DeleteAccountSection from '@/components/DeleteAccountSection'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-[#131316] text-[#F2F1EE] px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Account</h1>
          <p className="text-xs text-[#86858C]">{user?.email}</p>
        </div>

        <section className="border border-[#2A2A30] rounded-lg p-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Signed in</h2>
            <p className="text-xs text-[#86858C]">Sign out of this device.</p>
          </div>
          <form action={logout}>
            <button className="text-sm text-[#D4B483]">Sign out</button>
          </form>
        </section>

        <DeleteAccountSection />
      </div>
    </main>
  )
}