-- Numeric membership tier on profiles: 1 = registered (default for every new
-- signup), 2 = self-declared YouTube subscriber (bumped automatically by
-- setYoutubeSubscribed), 3-8 reserved for future paid tiers that don't exist
-- yet, 9 = power user (granted manually via SQL, e.g. for admins/testers).
-- Commenting requires tier >= 3 -- intentionally not reachable through any
-- self-service flow today, so grant tier 9 by hand to any account that needs
-- to comment before a real tier-3 feature ships.

alter table public.profiles
  add column tier integer not null default 1;

alter table public.profiles
  add constraint profiles_tier_range check (tier between 1 and 9);
