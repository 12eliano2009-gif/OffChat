-- NOX is OffX's currency. 70% of a send reaches the recipient; 30% is the cut.

alter table transactions
  add column if not exists fee numeric(12, 2) not null default 0;

alter table transactions
  add column if not exists net numeric(12, 2);

update transactions
  set net = amount - fee
  where net is null;

alter table transactions
  alter column currency set default 'NOX';

update transactions set currency = 'NOX' where currency <> 'NOX';

-- Starter pack was 250 € mock-fiat — convert leftover starters to 25 NOX.
update profiles
  set wallet_balance = 25.00
  where is_system = false and wallet_balance = 250.00;

insert into profiles (user_id, display_name, handle, avatar_hue, bio, wallet_balance, is_system)
values ('offx-treasury', 'OffX', '_nox', 0, 'NOX treasury.', 0, true)
on conflict (user_id) do nothing;
