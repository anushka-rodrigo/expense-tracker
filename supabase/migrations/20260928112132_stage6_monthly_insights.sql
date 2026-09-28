create table public.monthly_insights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  month         date not null check (month = date_trunc('month', month)::date),
  content       jsonb not null,
  income_total  numeric(14,2) not null,
  expense_total numeric(14,2) not null,
  generated_at  timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.monthly_insights enable row level security;

create policy "insights_select_own" on public.monthly_insights
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insights_insert_own" on public.monthly_insights
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "insights_update_own" on public.monthly_insights
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.monthly_insights from anon;