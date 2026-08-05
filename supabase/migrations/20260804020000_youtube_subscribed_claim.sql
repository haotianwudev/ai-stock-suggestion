-- Self-declared (unverified) YouTube subscription claim. Users toggle this
-- themselves in profile settings -- there's no server-side check against the
-- YouTube API (that would require requesting the sensitive youtube.readonly
-- OAuth scope, which brings app-verification and refresh-token-expiry
-- overhead not worth it for a soft content gate).

alter table public.profiles
  add column youtube_subscribed boolean not null default false;
