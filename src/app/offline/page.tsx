export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#131316] text-[#F2F1EE] flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold mb-2">You're offline</h1>
        <p className="text-sm text-[#86858C]">
          Ultrix Expense Tracker needs an internet connection to load your data. Reconnect and try again.
        </p>
      </div>
    </main>
  )
}