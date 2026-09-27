-- OffX schema: profiles & wallets, 1:1 chat, P2P payments, social feed.
-- user_id is TEXT (Better Auth ids / system contacts). Amounts are numeric(12,2) EUR.

create table if not exists profiles (
  user_id text primary key,
  display_name text not null,
  handle text not null unique,
  avatar_hue integer not null default 210,
  bio text not null default '',
  wallet_balance numeric(12, 2) not null default 0,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id text primary key,
  participant_a text not null references profiles (user_id),
  participant_b text not null references profiles (user_id),
  last_message_at timestamptz not null default now(),
  last_message_preview text not null default '',
  created_at timestamptz not null default now(),
  unique (participant_a, participant_b)
);
create index if not exists conversations_last_idx on conversations (last_message_at desc);

create table if not exists transactions (
  id text primary key,
  conversation_id text references conversations (id),
  sender_id text not null references profiles (user_id),
  recipient_id text not null references profiles (user_id),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  note text not null default '',
  kind text not null check (kind in ('send', 'request', 'topup', 'cashout')),
  status text not null check (status in ('pending', 'completed', 'declined')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists transactions_party_idx on transactions (sender_id, created_at desc);
create index if not exists transactions_recipient_idx on transactions (recipient_id, created_at desc);

create table if not exists messages (
  id text primary key,
  conversation_id text not null references conversations (id) on delete cascade,
  sender_id text not null references profiles (user_id),
  type text not null check (type in ('text', 'payment', 'image')),
  body text not null default '',
  image_url text,
  transaction_id text references transactions (id),
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on messages (conversation_id, created_at);

create table if not exists conversation_reads (
  conversation_id text not null references conversations (id) on delete cascade,
  user_id text not null references profiles (user_id),
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists posts (
  id text primary key,
  author_id text not null references profiles (user_id),
  caption text not null default '',
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  poster_url text,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on posts (created_at desc);
create index if not exists posts_author_idx on posts (author_id, created_at desc);

create table if not exists post_likes (
  post_id text not null references posts (id) on delete cascade,
  user_id text not null references profiles (user_id),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists post_comments (
  id text primary key,
  post_id text not null references posts (id) on delete cascade,
  author_id text not null references profiles (user_id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists post_comments_idx on post_comments (post_id, created_at);

-- Directory / seed contacts (not login accounts — conversation partners & feed authors)
insert into profiles (user_id, display_name, handle, avatar_hue, bio, wallet_balance, is_system)
values
  ('offx-mira', 'Mira Chen', 'mira', 22, 'Design. Nacht. Berlin.', 1840.00, true),
  ('offx-jonas', 'Jonas Weber', 'jonas', 210, 'Sound & late trains.', 920.00, true),
  ('offx-lena', 'Lena Vogt', 'lena', 8, 'Cafés, kitchens, quiet.', 640.00, true),
  ('offx-noah', 'Noah Krüger', 'noah', 250, 'Beton, Licht, Film.', 1100.00, true),
  ('offx-pay', 'OffX', 'offx', 0, 'Offline Social Network.', 50000.00, true)
on conflict (user_id) do nothing;

insert into posts (id, author_id, caption, media_type, media_url, poster_url, created_at)
values
  ('seed-01', 'offx-mira', 'Spätschicht. Die Stadt gehört uns.', 'image', '/feed/01.jpg', null, now() - interval '4 hours'),
  ('seed-02', 'offx-lena', 'Cortado, bevor Berlin aufwacht.', 'image', '/feed/02.jpg', null, now() - interval '6 hours'),
  ('seed-03', 'offx-noah', 'Beton hält länger als Stimmung.', 'image', '/feed/03.jpg', null, now() - interval '9 hours'),
  ('seed-04', 'offx-jonas', 'Soundcheck. Freitag.', 'image', '/feed/04.jpg', null, now() - interval '11 hours'),
  ('seed-05', 'offx-mira', 'Regenloop. Lautstärke aus.', 'video', '/feed/rain.mp4', '/feed/05.jpg', now() - interval '14 hours'),
  ('seed-06', 'offx-noah', 'Analog bleibt.', 'image', '/feed/06.jpg', null, now() - interval '1 day'),
  ('seed-07', 'offx-lena', 'Midnight pasta. Keine Gäste.', 'image', '/feed/07.jpg', null, now() - interval '2 days'),
  ('seed-08', 'offx-jonas', 'Letzte Bahn, erste Ideen.', 'image', '/feed/08.jpg', null, now() - interval '3 days')
on conflict (id) do nothing;

insert into post_likes (post_id, user_id)
values
  ('seed-01', 'offx-jonas'),
  ('seed-01', 'offx-lena'),
  ('seed-01', 'offx-noah'),
  ('seed-02', 'offx-mira'),
  ('seed-02', 'offx-jonas'),
  ('seed-03', 'offx-mira'),
  ('seed-04', 'offx-mira'),
  ('seed-04', 'offx-noah'),
  ('seed-05', 'offx-jonas'),
  ('seed-05', 'offx-lena'),
  ('seed-06', 'offx-mira'),
  ('seed-07', 'offx-noah'),
  ('seed-07', 'offx-mira'),
  ('seed-08', 'offx-lena')
on conflict do nothing;

insert into post_comments (id, post_id, author_id, body, created_at)
values
  ('c-01', 'seed-01', 'offx-jonas', 'Genau diese Ecke.', now() - interval '3 hours'),
  ('c-02', 'seed-02', 'offx-mira', 'Der Cortado dort ist unschlagbar.', now() - interval '5 hours'),
  ('c-03', 'seed-04', 'offx-noah', 'Bass kommt durch den Beton.', now() - interval '10 hours'),
  ('c-04', 'seed-07', 'offx-mira', 'Rezept. Bitte.', now() - interval '1 day')
on conflict (id) do nothing;
