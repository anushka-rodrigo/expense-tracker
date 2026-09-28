-- ============ EXPENSES ============
create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
              references auth.users(id) on delete cascade,
  start_date  date not null,
  end_date    date,                       -- null = single day
  name        text not null check (char_length(trim(name)) > 0),
  description text,
  amount      numeric(12,2) not null check (amount > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint expenses_range_same_month check (
    end_date is null
    or (
      end_date >= start_date
      and date_trunc('month', end_date) = date_trunc('month', start_date)
    )
  )
);

-- ============ INCOME ============
create table public.income (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
              references auth.users(id) on delete cascade,
  start_date  date not null,
  end_date    date,
  name        text not null check (char_length(trim(name)) > 0),
  amount      numeric(12,2) not null check (amount > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint income_range_same_month check (
    end_date is null
    or (
      end_date >= start_date
      and date_trunc('month', end_date) = date_trunc('month', start_date)
    )
  )
);

-- ============ INDEXES (fast per-user, per-month queries) ============
create index expenses_user_date_idx on public.expenses (user_id, start_date);
create index income_user_date_idx   on public.income   (user_id, start_date);

-- ============ AUTO-UPDATE updated_at ============
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

create trigger income_set_updated_at
  before update on public.income
  for each row execute function public.set_updated_at();

-- ============ LOCK DOWN (policies come in Stage 2) ============
alter table public.expenses enable row level security;
alter table public.income   enable row level security;