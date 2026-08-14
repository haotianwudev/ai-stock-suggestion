-- User's preferred video platform for the article Watch card, used as the
-- default embed when an article has both a YouTube and Bilibili cross-post
-- (see client's VideoCard source toggle). Defaults to youtube for every
-- existing/new profile; the card still falls back to youtube regardless of
-- this preference on articles that have no bilibiliUrl at all.
alter table public.profiles
  add column preferred_video_source text not null default 'youtube';

alter table public.profiles
  add constraint profiles_preferred_video_source_check
  check (preferred_video_source in ('youtube', 'bilibili'));
