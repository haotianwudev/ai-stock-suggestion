-- Stripe donations, one-time payments only. Cumulative donated_cents on profiles
-- drives tier promotion (see recordDonation in server/src/db/donations.js) --
-- mirrors the liked_count/attestLiked ladder pattern, but keyed on money instead
-- of honor-system video likes:
--   donated_cents >= 999   -> tier 4 (skips tier 3, which is gated on YouTube-subscribe)
--   donated_cents >= 2999  -> tier 5
--   donated_cents >= 9999  -> tier 6
--   donated_cents >= 19999 -> tier 7
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

alter table public.donations enable row level security;

create policy "Users can view their own donations"
  on public.donations for select
  using (user_id = auth.uid());

grant select, insert on public.donations to app_server;

alter table public.profiles
  add column donated_cents integer not null default 0;

alter table public.profiles
  add constraint profiles_donated_cents_nonnegative check (donated_cents >= 0);
