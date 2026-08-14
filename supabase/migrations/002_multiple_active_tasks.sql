alter table public.tasks
add column if not exists archived boolean not null default false;

create index if not exists tasks_user_active_idx
on public.tasks(user_id, archived, created_at desc);
