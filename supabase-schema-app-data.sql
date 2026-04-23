-- =============================================================================
--  SUPABASE — PASO 2 (ejecutar después de supabase-setup.sql)
-- =============================================================================
--  Directorio de agentes, historial de llamadas, campos extra de perfil.
--  Idempotente: agentes por teléfono; demo call_logs solo si el usuario no
--  tenía ninguna fila aún.
--
--  Modelo ampliado:
--
--    public.profiles          public.call_logs
--    (1:1 auth.users)         ┌────────────────────┐
--         │                   │ user_id → profiles │
--         │                   │ peer_name, phone   │
--         └───────────────────│ direction, …       │
--                             └────────────────────┘
--
--    public.agents (directorio global, solo lectura autenticados)
--    ┌────────────────────────────────────┐
--    │ full_name, phone, department, …  │
--    └────────────────────────────────────┘
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Perfil: datos de contacto y puesto (Twilio id va en supabase-setup.sql)
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone text,
  add column if not exists department text,
  add column if not exists role text,
  add column if not exists status text default 'Disponible';

comment on column public.profiles.phone is 'Teléfono de contacto del agente (E.164 recomendado)';
comment on column public.profiles.department is 'Departamento o unidad';
comment on column public.profiles.role is 'Rol laboral';
comment on column public.profiles.status is 'Estado presencia (ej. Disponible)';

-- -----------------------------------------------------------------------------
-- 2) Directorio de agentes (catálogo compartido)
-- -----------------------------------------------------------------------------
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  company text default 'Fresenius Medical Care',
  department text,
  role text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agents add column if not exists updated_at timestamptz not null default now();

comment on table public.agents is
  'Listado de contactos internos; visible a cualquier usuario autenticado. No referencia auth.users.';

comment on column public.agents.phone is 'Teléfono E.164; único a nivel de negocio (evitar duplicados en seeds)';

drop index if exists public.agents_phone_uidx;
create unique index agents_phone_uidx on public.agents (phone);

create or replace function public.set_agents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists agents_set_updated_at on public.agents;
create trigger agents_set_updated_at
  before update on public.agents
  for each row
  execute function public.set_agents_updated_at();

alter table public.agents enable row level security;

drop policy if exists "agents_select_auth" on public.agents;
create policy "agents_select_auth"
  on public.agents for select
  to authenticated
  using (true);

grant select on public.agents to authenticated;
revoke all on public.agents from anon;

-- -----------------------------------------------------------------------------
-- 3) Historial de llamadas (por usuario autenticado)
-- -----------------------------------------------------------------------------
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  peer_name text not null,
  phone text not null,
  direction text not null check (direction in ('outgoing', 'incoming', 'missed')),
  occurred_at timestamptz not null default now(),
  duration_label text
);

alter table public.call_logs add column if not exists twilio_call_sid text;

comment on table public.call_logs is
  'Historial de llamadas por usuario; twilio_call_sid opcional cuando integres webhooks Twilio.';

comment on column public.call_logs.user_id is 'Dueño de la fila (= auth.uid() en políticas)';
comment on column public.call_logs.direction is 'outgoing | incoming | missed';
comment on column public.call_logs.duration_label is 'Texto legible (ej. 4:12); duración en segundos se puede añadir después';
comment on column public.call_logs.twilio_call_sid is 'SID de Twilio CA…; nulo en datos demo o llamadas no registradas en Twilio';

drop index if exists public.call_logs_twilio_call_sid_uidx;
create unique index call_logs_twilio_call_sid_uidx
  on public.call_logs (twilio_call_sid)
  where twilio_call_sid is not null and trim(twilio_call_sid) <> '';

create index if not exists call_logs_user_occurred_idx
  on public.call_logs (user_id, occurred_at desc);

alter table public.call_logs enable row level security;

drop policy if exists "call_logs_select_own" on public.call_logs;
create policy "call_logs_select_own"
  on public.call_logs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "call_logs_insert_own" on public.call_logs;
create policy "call_logs_insert_own"
  on public.call_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.call_logs to authenticated;
revoke all on public.call_logs from anon;

-- -----------------------------------------------------------------------------
-- 4) Datos semilla: agentes (Fresenius Medical Care España)
-- -----------------------------------------------------------------------------
insert into public.agents (full_name, phone, company, department, role, sort_order)
select v.full_name, v.phone, v.company, v.department, v.role, v.sort_order
from (
  values
    (
      'María López García',
      '+34607894301',
      'Fresenius Medical Care España',
      'Coordinación de clínica de diálisis',
      'Coordinadora de unidad de diálisis',
      1
    ),
    (
      'Laura Sánchez',
      '+34691234567',
      'Fresenius Medical Care España',
      'Contact Center – Atención al paciente renal',
      'Agente de atención telefónica pacientes',
      2
    ),
    (
      'Juan Torres Ruiz',
      '+34983660555',
      'Fresenius Medical Care España',
      'Servicios de enfermería – Unidad de diálisis',
      'Enfermero especialista en nefrología y diálisis',
      3
    ),
    (
      'Pedro Ramírez',
      '+34678901234',
      'Fresenius Medical Care España',
      'Nefrología y consulta externa',
      'Adjunto de nefrología clínica',
      4
    ),
    (
      'Elena Fernández',
      '+34689012345',
      'Fresenius Medical Care España',
      'Calidad, seguridad del paciente y documentación clínica',
      'Responsable de calidad y gestión clínica',
      5
    )
) as v(full_name, phone, company, department, role, sort_order)
where not exists (select 1 from public.agents a where a.phone = v.phone);

update public.agents a
set
  company = 'Fresenius Medical Care España',
  department = v.department,
  role = v.role
from (
  values
    ('+34607894301', 'Coordinación de clínica de diálisis', 'Coordinadora de unidad de diálisis'),
    ('+34691234567', 'Contact Center – Atención al paciente renal', 'Agente de atención telefónica pacientes'),
    ('+34983660555', 'Servicios de enfermería – Unidad de diálisis', 'Enfermero especialista en nefrología y diálisis'),
    ('+34678901234', 'Nefrología y consulta externa', 'Adjunto de nefrología clínica'),
    ('+34689012345', 'Calidad, seguridad del paciente y documentación clínica', 'Responsable de calidad y gestión clínica')
) as v(phone, department, role)
where a.phone = v.phone;

-- -----------------------------------------------------------------------------
-- 5) Llamadas DEMO (solo usuarios sin historial previo)
-- -----------------------------------------------------------------------------
insert into public.call_logs (user_id, peer_name, phone, direction, occurred_at, duration_label)
select
  u.id,
  d.peer_name,
  d.phone,
  d.direction,
  d.occurred_at,
  d.duration_label
from auth.users u
cross join (
  values
    (
      'María López García',
      '+34607894301',
      'missed'::text,
      (now() - interval '18 minutes')::timestamptz,
      null::text
    ),
    (
      'Laura Sánchez',
      '+34691234567',
      'outgoing'::text,
      (now() - interval '1 hour 12 minutes')::timestamptz,
      '4:12'::text
    ),
    (
      'Juan Torres Ruiz',
      '+34983660555',
      'incoming'::text,
      (now() - interval '3 hours 40 minutes')::timestamptz,
      '6:03'::text
    ),
    (
      'Pedro Ramírez',
      '+34678901234',
      'outgoing'::text,
      (now() - interval '6 hours')::timestamptz,
      '2:41'::text
    ),
    (
      'Elena Fernández',
      '+34689012345',
      'incoming'::text,
      (now() - interval '26 hours')::timestamptz,
      '0:58'::text
    ),
    (
      'María López García',
      '+34607894301',
      'outgoing'::text,
      (now() - interval '30 hours')::timestamptz,
      '1:05'::text
    ),
    (
      'Coordinación clínica Madrid',
      '+34900112233',
      'missed'::text,
      (now() - interval '50 hours')::timestamptz,
      null::text
    )
) as d(peer_name, phone, direction, occurred_at, duration_label)
where not exists (select 1 from public.call_logs c where c.user_id = u.id);

-- -----------------------------------------------------------------------------
-- 6) Valores por defecto en perfiles (solo donde falten textos)
-- -----------------------------------------------------------------------------
update public.profiles p
set
  department = coalesce(nullif(trim(p.department), ''), 'Contact Center – Atención al paciente renal'),
  role = coalesce(
    nullif(trim(p.role), ''),
    'Agente Contact Center – Fresenius Medical Care España'
  ),
  status = coalesce(nullif(trim(p.status), ''), 'Disponible')
where
  p.department is null
  or trim(p.department) = ''
  or p.role is null
  or trim(p.role) = ''
  or p.status is null
  or trim(p.status) = '';
