-- Makes profiles.display_name and profiles.avatar_url user-editable.
-- Avatars are a curated set of 6 investor-persona images (already shipped
-- as AI-analyst avatars in the frontend), not arbitrary uploads -- keeps
-- moderation and storage out of scope. Everyone defaults to Warren.

alter table public.profiles
  alter column avatar_url set default '/images/agents/warren_buffett.png';

update public.profiles
  set avatar_url = '/images/agents/warren_buffett.png'
  where avatar_url is null or avatar_url not in (
    '/images/agents/warren_buffett.png',
    '/images/agents/charlie_munger.png',
    '/images/agents/cathie_wood.png',
    '/images/agents/stanley_druckenmiller.png',
    '/images/agents/ben_graham.png',
    '/images/agents/SOPHIE.png'
  );

alter table public.profiles
  alter column avatar_url set not null;

alter table public.profiles
  add constraint profiles_avatar_url_check check (avatar_url in (
    '/images/agents/warren_buffett.png',
    '/images/agents/charlie_munger.png',
    '/images/agents/cathie_wood.png',
    '/images/agents/stanley_druckenmiller.png',
    '/images/agents/ben_graham.png',
    '/images/agents/SOPHIE.png'
  ));

alter table public.profiles
  add constraint profiles_display_name_length check (
    display_name is null or char_length(trim(display_name)) between 1 and 50
  );

-- No longer seed avatar_url from Google's picture claim -- the column
-- default (Warren) takes over for every new signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
