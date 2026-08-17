create table if not exists public.routine_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null check (char_length(item_id) between 1 and 100),
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id, completed_on)
);

alter table public.routine_completions enable row level security;

drop policy if exists "Users manage their own routine completions" on public.routine_completions;
create policy "Users manage their own routine completions" on public.routine_completions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
