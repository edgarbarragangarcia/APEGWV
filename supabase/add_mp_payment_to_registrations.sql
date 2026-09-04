-- ═══════════════════════════════════════════════════════════════
-- APEG · Soporte de pagos Mercado Pago + eventos tipo "viaje"
-- Idempotente. Ya aplicado en producción (proyecto drqyvhwgnuvrcmwthwwn).
-- ═══════════════════════════════════════════════════════════════

-- 1. Columnas de pago / datos del inscrito
alter table public.tournament_registrations
  add column if not exists mp_payment_id      text,
  add column if not exists mp_reference       text,
  add column if not exists selected_package   text,
  add column if not exists package_price      numeric,
  add column if not exists payment_currency   text,
  add column if not exists player_birthdate   date,
  add column if not exists player_nationality text,
  add column if not exists mp_status          text,
  add column if not exists mp_status_detail   text,
  add column if not exists mp_amount          numeric;

comment on column public.tournament_registrations.mp_status is
  'Último estado del pago en Mercado Pago: approved | rejected | pending | in_process | cancelled | refunded';
comment on column public.tournament_registrations.mp_status_detail is
  'Detalle/razón del estado de Mercado Pago (p. ej. cc_rejected_insufficient_amount)';
comment on column public.tournament_registrations.mp_amount is
  'Monto realmente pagado según Mercado Pago (COP)';

create index if not exists idx_tournament_registrations_mp_reference
  on public.tournament_registrations (mp_reference);

create unique index if not exists uq_tournament_registrations_mp_payment_id
  on public.tournament_registrations (mp_payment_id, id);

-- 2. Permitir varias inscripciones por evento (quita atadura 1-por-usuario)
alter table public.tournament_registrations
  drop constraint if exists tournament_registrations_tournament_id_user_id_key;

-- 3. Tipo de evento: torneo (precio único) | viaje (por paquetes)
alter table public.tournaments
  add column if not exists packages jsonb not null default '[]'::jsonb,
  add column if not exists event_type text not null default 'torneo';

alter table public.tournaments
  drop constraint if exists tournaments_event_type_check;
alter table public.tournaments
  add constraint tournaments_event_type_check check (event_type in ('torneo', 'viaje'));

comment on column public.tournaments.event_type is
  'torneo = inscripción con precio único; viaje = inscripción por paquetes (jsonb packages), se cobra en COP a la TRM del día si el paquete está en USD';

-- Backfill: eventos con paquetes o de Buenaventura => viaje
update public.tournaments
set event_type = 'viaje'
where event_type <> 'viaje'
  and (jsonb_array_length(coalesce(packages, '[]'::jsonb)) > 0 or name ilike '%buenaventura%');

-- 4. RPC del panel admin: incluir event_type / packages / slug
drop function if exists public.get_all_tournaments(integer, integer);

create or replace function public.get_all_tournaments(page_num integer default 1, page_size integer default 20)
 returns table(id uuid, name text, description text, date timestamptz, club text, price numeric,
   participants_limit integer, current_participants integer, status text, creator_id uuid,
   image_url text, game_mode text, address text, budget_per_player numeric, budget_prizes numeric,
   budget_operational numeric, budget_items jsonb, approval_status text, guests text,
   event_type text, packages jsonb, slug text, creator_full_name text, creator_avatar_url text)
 language plpgsql
 set search_path to 'public'
as $function$
begin
  return query
  select t.id, t.name, t.description, t.date, t.club, t.price,
    t.participants_limit, t.current_participants, t.status, t.creator_id,
    t.image_url, t.game_mode, t.address, t.budget_per_player, t.budget_prizes,
    t.budget_operational, t.budget_items, t.approval_status, t.guests,
    t.event_type, t.packages, t.slug,
    p.full_name, p.avatar_url
  from tournaments t
  left join profiles p on t.creator_id = p.id
  order by t.created_at desc
  limit page_size offset (page_num - 1) * page_size;
end;
$function$;
