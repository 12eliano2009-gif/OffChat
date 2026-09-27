-- PayPal NOX packs. Money is collected by PayPal for expiri2009@icloud.com.
create table if not exists paypal_orders (
  id text primary key,
  user_id text not null references profiles (user_id),
  pack_id text not null,
  nox numeric(12, 2) not null,
  euro numeric(12, 2) not null,
  status text not null check (status in ('pending', 'completed', 'canceled')),
  paypal_txn text unique,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists paypal_orders_user_idx on paypal_orders (user_id, created_at desc);
