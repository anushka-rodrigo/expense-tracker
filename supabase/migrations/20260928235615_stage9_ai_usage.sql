create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  count   int  not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Users can see their own usage, but only the Edge Function (service role) can write it
create policy "ai_usage_select_own" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.ai_usage from authenticated, anon;