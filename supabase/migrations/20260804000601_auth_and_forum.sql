-- Auth (profiles) + unified forum/comments schema.
-- Lives here (not sophie-pipeline/sql/) because this data is owned and
-- read/written exclusively by this GraphQL server, not the ETL pipeline.
-- Apply with: supabase db push

-- ---------------------------------------------------------------------------
-- profiles: mirrors minimal identity out of auth.users. Resolvers read this
-- table rather than auth.users directly, since auth.users' internal shape
-- isn't a stable public contract.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Populates profiles automatically from Google's OAuth claims at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- forum_categories
-- ---------------------------------------------------------------------------

create table if not exists public.forum_categories (
  id serial primary key,
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.forum_categories (slug, name, description, sort_order) values
  ('general', 'General Discussion', 'Anything market- or platform-related.', 0),
  ('market-analysis', 'Market Analysis', 'Macro, sector, and stock-specific discussion.', 1),
  ('options-trading', 'Options Trading', 'Strategies, Greeks, and trade ideas.', 2),
  ('site-feedback', 'Site Feedback', 'Bugs, requests, and feedback about Sophie.', 3)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- forum_threads: doubles as both a general-forum thread (category_id set,
-- content_slug null) and a per-article comment thread (content_type +
-- content_slug set, category_id null). content_slug is a plain string, not
-- a real FK — article identity lives only in the frontend today, keyed by
-- the same slug string.
-- ---------------------------------------------------------------------------

create table if not exists public.forum_threads (
  id bigserial primary key,
  category_id int references public.forum_categories(id),
  content_type text,
  content_slug text,
  title text not null,
  created_by uuid references auth.users(id) on delete cascade,
  status text not null default 'published' check (status in ('pending', 'published', 'hidden')),
  pinned boolean not null default false,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_threads_content_both_or_neither
    check ((content_type is null) = (content_slug is null))
);

-- One comment thread per article; enables get-or-create-on-first-comment.
create unique index if not exists forum_threads_content_unique
  on public.forum_threads (content_type, content_slug)
  where content_slug is not null;

create index if not exists forum_threads_category_created_idx
  on public.forum_threads (category_id, created_at desc);

create index if not exists forum_threads_status_idx
  on public.forum_threads (status);

alter table public.forum_threads enable row level security;

create policy "Threads are viewable if published or own"
  on public.forum_threads for select
  using (status = 'published' or created_by = auth.uid());

create policy "Users can create their own threads"
  on public.forum_threads for insert
  with check (created_by = auth.uid());

create policy "Users can update their own threads"
  on public.forum_threads for update
  using (created_by = auth.uid());

create policy "Users can delete their own threads"
  on public.forum_threads for delete
  using (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- forum_posts: every comment and every forum reply is a row here.
-- parent_post_id gives exactly one level of reply nesting (v1 scope).
-- ---------------------------------------------------------------------------

create table if not exists public.forum_posts (
  id bigserial primary key,
  thread_id bigint not null references public.forum_threads(id) on delete cascade,
  parent_post_id bigint references public.forum_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status text not null default 'published' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists forum_posts_thread_created_idx
  on public.forum_posts (thread_id, created_at);

create index if not exists forum_posts_parent_idx
  on public.forum_posts (parent_post_id);

create index if not exists forum_posts_author_idx
  on public.forum_posts (author_id);

alter table public.forum_posts enable row level security;

create policy "Posts are viewable if published or own"
  on public.forum_posts for select
  using (status = 'published' or author_id = auth.uid());

create policy "Users can create their own posts"
  on public.forum_posts for insert
  with check (author_id = auth.uid());

create policy "Users can update their own posts"
  on public.forum_posts for update
  using (author_id = auth.uid());

create policy "Users can delete their own posts"
  on public.forum_posts for delete
  using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- app_server role: what the GraphQL server's pooled connection authenticates
-- as. Resolver-level checks (context.user.id === author_id) are the primary
-- authorization mechanism (see server code) — RLS above is defense-in-depth
-- for the case where the anon key is ever used directly against these
-- tables. BYPASSRLS means RLS never fires on this trusted server path.
--
-- IMPORTANT: this migration does NOT set a password. Set one manually via
-- the Supabase SQL editor or dashboard (never commit it):
--   alter role app_server with password '<generate-a-strong-password>';
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select from pg_roles where rolname = 'app_server') then
    create role app_server with login bypassrls;
  end if;
end
$$;

grant usage on schema public to app_server;
grant select, insert, update, delete on public.profiles to app_server;
grant select, insert, update, delete on public.forum_categories to app_server;
grant select, insert, update, delete on public.forum_threads to app_server;
grant select, insert, update, delete on public.forum_posts to app_server;
grant usage, select on all sequences in schema public to app_server;
