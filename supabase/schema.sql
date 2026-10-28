-- Abuja Connect v1 schema. Run in the NEW Abuja Connect Supabase project only.
-- Safe to rerun: creates objects if missing; does not drop existing tables or data.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Abuja Connect member',
  account_type text not null default 'regular' check (account_type in ('regular','escort')),
  city text not null default 'Abuja',
  bio text not null default '',
  interests text[] not null default '{}',
  avatar_url text,
  age_confirmed boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('regular','escort')),
  plan_code text not null check (plan_code in ('1_month','3_months','6_months','1_year')),
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled','failed')),
  starts_at timestamptz,
  expires_at timestamptz,
  paystack_reference text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(from_user,to_user),
  check (from_user <> to_user)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_one uuid not null references auth.users(id) on delete cascade,
  user_two uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_one <> user_two),
  unique(user_one,user_two)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);

create index if not exists likes_to_user_idx on public.likes(to_user);
create index if not exists messages_match_created_idx on public.messages(match_id,created_at);
create index if not exists subscriptions_user_status_expiry_idx on public.subscriptions(user_id,status,expires_at desc);

create or replace function public.is_active_subscriber(uid uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.subscriptions s where s.user_id=uid and s.status='active' and s.starts_at <= now() and s.expires_at > now()); $$;

create or replace function public.is_match_member(mid uuid, uid uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.matches m where m.id=mid and (m.user_one=uid or m.user_two=uid)); $$;

create or replace function public.is_match_between(mid uuid, a uuid, b uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.matches m where m.id=mid and ((m.user_one=a and m.user_two=b) or (m.user_one=b and m.user_two=a))); $$;

create or replace function public.create_mutual_match()
returns trigger language plpgsql security definer set search_path=public
as $$
declare lo uuid; hi uuid;
begin
  if exists(select 1 from public.likes where from_user=new.to_user and to_user=new.from_user) then
    lo := least(new.from_user,new.to_user); hi := greatest(new.from_user,new.to_user);
    insert into public.matches(user_one,user_two) values(lo,hi) on conflict(user_one,user_two) do nothing;
  end if;
  return new;
end; $$;
drop trigger if exists likes_create_mutual_match on public.likes;
create trigger likes_create_mutual_match after insert or update on public.likes for each row execute function public.create_mutual_match();

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id,display_name,account_type,age_confirmed)
  values(new.id,coalesce(nullif(new.raw_user_meta_data->>'display_name',''), 'Abuja Connect member'),
    case when new.raw_user_meta_data->>'account_type'='escort' then 'escort' else 'regular' end,
    coalesce((new.raw_user_meta_data->>'age_confirmed')::boolean,false))
  on conflict(id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles readable by authenticated members" on public.profiles;
create policy "profiles readable by authenticated members" on public.profiles for select to authenticated using (is_banned=false);
drop policy if exists "members insert own profile" on public.profiles;
create policy "members insert own profile" on public.profiles for insert to authenticated with check (id=auth.uid() and age_confirmed=true);
drop policy if exists "members update own profile" on public.profiles;
create policy "members update own profile" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid() and is_banned=false);

drop policy if exists "members read own subscriptions" on public.subscriptions;
create policy "members read own subscriptions" on public.subscriptions for select to authenticated using (user_id=auth.uid());
-- Deliberately no client insert/update policy on subscriptions: payment status must be changed by a trusted server after Paystack verification.

drop policy if exists "members read likes involving them" on public.likes;
create policy "members read likes involving them" on public.likes for select to authenticated using (from_user=auth.uid() or to_user=auth.uid());
drop policy if exists "members like from own account" on public.likes;
create policy "members like from own account" on public.likes for insert to authenticated with check (from_user=auth.uid() and to_user<>auth.uid() and exists(select 1 from public.profiles p where p.id=to_user and p.is_banned=false));
drop policy if exists "members update own like" on public.likes;
create policy "members update own like" on public.likes for update to authenticated using (from_user=auth.uid()) with check (from_user=auth.uid());

drop policy if exists "members read own matches" on public.matches;
create policy "members read own matches" on public.matches for select to authenticated using (user_one=auth.uid() or user_two=auth.uid());

drop policy if exists "matched members read messages" on public.messages;
create policy "matched members read messages" on public.messages for select to authenticated using ((sender_id=auth.uid() or recipient_id=auth.uid()) and public.is_match_member(match_id,auth.uid()));
drop policy if exists "active subscribers can send to a match" on public.messages;
create policy "active subscribers can send to a match" on public.messages for insert to authenticated with check (
  sender_id=auth.uid()
  and public.is_active_subscriber(auth.uid())
  and public.is_match_between(match_id,sender_id,recipient_id)
  and exists(select 1 from public.profiles p where p.id=recipient_id and p.is_banned=false)
);

grant usage on schema public to authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select on public.subscriptions to authenticated;
grant select,insert,update on public.likes to authenticated;
grant select on public.matches to authenticated;
grant select,insert on public.messages to authenticated;
