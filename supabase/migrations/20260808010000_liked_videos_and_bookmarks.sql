-- Per-video like tracking, replacing the click-count-only approach in the
-- previous migration. Still honor-system (no verification that they actually
-- liked it on YouTube), but now identity-tracked and idempotent per
-- (user, article) -- re-clicking "Like" on a video you've already liked is a
-- no-op, so the rank ladder (profiles.liked_count/tier, see
-- server/src/db/engagement.js) counts distinct videos liked rather than raw
-- clicks.
create table if not exists public.liked_videos (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_slug text not null,
  liked_at timestamptz not null default now(),
  primary key (user_id, article_slug)
);

alter table public.liked_videos enable row level security;

create policy "Users can view their own likes"
  on public.liked_videos for select
  using (user_id = auth.uid());

create policy "Users can like on their own behalf"
  on public.liked_videos for insert
  with check (user_id = auth.uid());

grant select, insert on public.liked_videos to app_server;

-- Bookmarks: save an article for later. Storage + a toggle button only for
-- now -- no "My Bookmarks" listing page yet, but the shape is ready for one.
create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, article_slug)
);

alter table public.bookmarks enable row level security;

create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using (user_id = auth.uid());

create policy "Users can add their own bookmarks"
  on public.bookmarks for insert
  with check (user_id = auth.uid());

create policy "Users can remove their own bookmarks"
  on public.bookmarks for delete
  using (user_id = auth.uid());

grant select, insert, delete on public.bookmarks to app_server;
