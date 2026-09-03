-- Mercado Pago payment support for tournament registrations + room/package plans.
-- Safe to run multiple times.

-- Per-registration payment tracking
alter table public.tournament_registrations
  add column if not exists mp_payment_id   text,
  add column if not exists mp_reference    text,
  add column if not exists selected_package text,
  add column if not exists package_price   numeric,
  add column if not exists payment_currency text;

create index if not exists idx_tournament_registrations_mp_reference
  on public.tournament_registrations (mp_reference);

-- Guard against the same Mercado Pago payment being applied twice.
create unique index if not exists uq_tournament_registrations_mp_payment_id
  on public.tournament_registrations (mp_payment_id, id);

-- Bookable packages / room types for a tournament, e.g.
-- [{ "id": "single", "name": "Habitación Single", "price": 2100, "currency": "USD" },
--  { "id": "double", "name": "Habitación Doble",  "price": 1900, "currency": "USD" }]
alter table public.tournaments
  add column if not exists packages jsonb not null default '[]'::jsonb;
