-- Customer Return Requests
-- Run in Supabase SQL editor

create table if not exists public.order_return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_order_return_requests_user_id on public.order_return_requests(user_id);
create index if not exists idx_order_return_requests_order_id on public.order_return_requests(order_id);

-- one active request per user+order (no duplicates from profile actions)
create unique index if not exists idx_order_return_requests_order_user_unique
  on public.order_return_requests(order_id, user_id);

create or replace function public.set_order_return_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_order_return_requests_updated_at on public.order_return_requests;
create trigger trg_order_return_requests_updated_at
before update on public.order_return_requests
for each row execute function public.set_order_return_requests_updated_at();

notify pgrst, 'reload schema';
