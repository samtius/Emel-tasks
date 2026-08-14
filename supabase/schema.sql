create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text,
  title text not null check (char_length(title) between 1 and 200),
  category text not null default 'Hemmet',
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  position integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_created_idx on public.tasks(user_id, created_at desc);
create index if not exists subtasks_task_position_idx on public.subtasks(task_id, position);

alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks" on public.tasks
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own subtasks" on public.subtasks;
create policy "Users manage their own subtasks" on public.subtasks
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
