-- Euro pack purchases, email confirmation, offline-friendly profile flag.

alter table profiles
  add column if not exists email_verified boolean not null default true;

alter table transactions
  add column if not exists euro_paid numeric(12, 2);

create table if not exists email_codes (
  user_id text primary key references profiles (user_id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  attempts integer not null default 0
);
