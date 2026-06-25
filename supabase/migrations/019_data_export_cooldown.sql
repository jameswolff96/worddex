-- Track when a user last requested a data export so we can enforce a 24-hour cooldown.
alter table public.users
  add column if not exists last_data_export_at timestamptz;
