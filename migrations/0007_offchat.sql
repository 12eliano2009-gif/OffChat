-- Visible name is OFFCHAT. Treasury row id stays stable.

update profiles
set display_name = 'Offchat',
    updated_at = now()
where user_id = 'offx-treasury';
