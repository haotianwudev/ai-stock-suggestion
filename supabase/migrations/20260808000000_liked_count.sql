-- Self-declared (unverified) "liked a paired YouTube video" counter, same
-- honor-system pattern as youtube_subscribed. Incremented once per article's
-- "Like on YouTube" click -- no dedup, no verification, by design (see
-- setYoutubeSubscribed for the precedent). Combined with youtube_subscribed,
-- this drives tier promotion in incrementLikedCount/setYoutubeSubscribed
-- (server/src/db/auth.js): subscribed + liked_count >= 1 -> tier 3,
-- liked_count >= 5 -> tier 4, >= 25 -> tier 5, >= 100 -> tier 6,
-- >= 200 -> tier 7 (ladder stops there; 8-9 stay manual-only).

alter table public.profiles
  add column liked_count integer not null default 0;

alter table public.profiles
  add constraint profiles_liked_count_nonnegative check (liked_count >= 0);
