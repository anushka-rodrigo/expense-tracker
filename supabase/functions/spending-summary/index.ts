import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Browsers send a preflight OPTIONS request before the real one — must respond OK to it
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const period = url.searchParams.get('period') ?? 'daily'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const since = new Date()
    if (period === 'weekly') {
      since.setDate(since.getDate() - 7)
    } else {
      since.setHours(0, 0, 0, 0)
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type, category')
      .gte('created_at', since.toISOString())

    if (error) throw error

    const income = data.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const expense = data.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

    const byCategory: Record<string, number> = {}
    for (const t of data) {
      if (t.type !== 'expense') continue
      const cat = t.category || 'Uncategorized'
      byCategory[cat] = (byCategory[cat] || 0) + Number(t.amount)
    }
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]

    return new Response(
      JSON.stringify({
        period,
        income,
        expense,
        net: income - expense,
        byCategory,
        topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
        transactionCount: data.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})