-- =============================================================================
-- Supabase → SQL Editor → ejecutar después de supabase-setup.sql
-- Agentes (contactos), historial demo, campos extra en perfil.
-- Idempotente en lo posible: agentes por teléfono; llamadas demo solo si el
-- usuario no tiene aún ninguna fila en call_logs.
-- =============================================================================

alter table public.profiles
  add column if not exists phone text,
  add column if not exists department text,
  add column if not exists role text,
  add column if not exists status text default 'Disponible';

-- Directorio de agentes (visible a cualquier usuario autenticado)
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  company text default 'Fresenius Medical Care',
  department text,
  role text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.agents add column if not exists role text;

alter table public.agents enable row level security;

drop policy if exists "agents_select_auth" on public.agents;
create policy "agents_select_auth"
  on public.agents for select
  to authenticated
  using (true);

grant select on public.agents to authenticated;
revoke all on public.agents from anon;

-- Historial de llamadas (por usuario; luego sustituir / ampliar con Twilio)
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  peer_name text not null,
  phone text not null,
  direction text not null check (direction in ('outgoing', 'incoming', 'missed')),
  occurred_at timestamptz not null default now(),
  duration_label text
);

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
-- Agentes Fresenius Medical Care (departamentos y roles realistas)
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

-- Si ya existían filas sin rol (ejecución anterior), actualizar por teléfono
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
-- Llamadas DEMO: se insertan para cada usuario de Auth que aún no tenga historial
-- (si quieres repetir, borra antes: delete from public.call_logs where user_id = '…';)
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

-- Valores por defecto razonables en perfiles (solo donde falten texto)
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
