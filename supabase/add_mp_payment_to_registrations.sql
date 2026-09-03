-- Mercado Pago payment tracking for tournament registrations.
-- Safe to run multiple times.

alter table public.tournament_registrations
  add column if not exists mp_payment_id text,
  add column if not exists mp_reference  text;

-- Fast lookup from the webhook (by reference when metadata is missing).
create index if not exists idx_tournament_registrations_mp_reference
  on public.tournament_registrations (mp_reference);

-- Guard against the same Mercado Pago payment being applied twice.
create unique index if not exists uq_tournament_registrations_mp_payment_id
  on public.tournament_registrations (mp_payment_id, id);
