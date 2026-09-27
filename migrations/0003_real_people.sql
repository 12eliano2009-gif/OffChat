-- Drop seed personas so OffX is real people only (no fake chat/feed bots).

delete from post_comments
  where author_id like 'offx-%' or post_id like 'seed-%';

delete from post_likes
  where user_id like 'offx-%' or post_id like 'seed-%';

delete from posts
  where id like 'seed-%' or author_id like 'offx-%';

delete from messages
  where sender_id like 'offx-%'
     or conversation_id in (
       select id from conversations
       where participant_a like 'offx-%' or participant_b like 'offx-%'
     );

delete from conversation_reads
  where user_id like 'offx-%'
     or conversation_id in (
       select id from conversations
       where participant_a like 'offx-%' or participant_b like 'offx-%'
     );

delete from transactions
  where sender_id like 'offx-%' or recipient_id like 'offx-%'
     or conversation_id in (
       select id from conversations
       where participant_a like 'offx-%' or participant_b like 'offx-%'
     );

delete from conversations
  where participant_a like 'offx-%' or participant_b like 'offx-%';

delete from profiles
  where is_system = true or user_id like 'offx-%';
