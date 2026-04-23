-- =============================================================================
--  SUPABASE — PASO 1 (ejecutar primero en SQL Editor)
-- =============================================================================
--  Crea el núcleo de datos de usuario: public.profiles, RLS, trigger de Auth
--  y la identidad Twilio Client estable por usuario (alineada con la app).
--
--  Modelo (auth = Supabase Auth; solo public.* se define aquí):
--
--    auth.users          public.profiles
--    ┌──────────┐        ┌─────────────────────────────┐
--    │ id (PK)  │──1:1──│ id (PK, FK → auth.users)    │
--    │ email    │        │ full_name                   │
--    └──────────┘        │ twilio_voice_identity (UQ) │
--                        │ created_at / updated_at     │
--                        └─────────────────────────────┘
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Perfil de aplicación (1 fila por usuario de Auth)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  twilio_voice_identity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil de la app softphone; 1:1 con auth.users. twilio_voice_identity = Client identity en Twilio Voice.';

comment on column public.profiles.id is 'Mismo UUID que auth.users.id';
comment on column public.profiles.full_name is 'Nombre para mostrar en la app';
comment on column public.profiles.created_at is 'Alta del perfil';
comment on column public.profiles.updated_at is 'Última modificación (trigger)';

alter table public.profiles add column if not exists twilio_voice_identity text;

comment on column public.profiles.twilio_voice_identity is
  'Identidad Twilio Client (ej. u_<hex>); única por usuario; alineada con mobile/src/lib/voiceIdentity.ts';

-- Identidad Twilio = misma regla que mobile/src/lib/voiceIdentity.ts
update public.profiles p
set
  twilio_voice_identity = 'u_' || replace(p.id::text, '-', '')
where
  p.twilio_voice_identity is null
  or trim(p.twilio_voice_identity) = '';

drop index if exists public.profiles_twilio_voice_identity_uidx;
create unique index profiles_twilio_voice_identity_uidx
  on public.profiles (twilio_voice_identity)
  where twilio_voice_identity is not null and trim(twilio_voice_identity) <> '';

-- -----------------------------------------------------------------------------
-- 2) Permisos de esquema y tabla
-- -----------------------------------------------------------------------------
grant usage on schema public to authenticated;
revoke all on public.profiles from anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- -----------------------------------------------------------------------------
-- 3) Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 4) updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- -----------------------------------------------------------------------------
-- 5) Alta en Auth → fila en profiles (+ identidad Twilio)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, twilio_voice_identity)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'u_' || replace(new.id::text, '-', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6) Usuarios creados antes de este script (sin fila en profiles)
-- -----------------------------------------------------------------------------
insert into public.profiles (id, full_name, twilio_voice_identity)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'u_' || replace(u.id::text, '-', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
