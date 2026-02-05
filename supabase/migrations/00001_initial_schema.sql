-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text unique,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Allow users to read other profiles by id (for friends list, invites, leaderboard)
create policy "Users can view profiles by id"
  on public.profiles for select
  using (true);

-- Friend requests: sender_id, receiver_id, status (pending | accepted)
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz default now() not null,
  unique (sender_id, receiver_id)
);

alter table public.friend_requests enable row level security;

create policy "Users can view friend requests they are part of"
  on public.friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can insert friend requests as sender"
  on public.friend_requests for insert
  with check (auth.uid() = sender_id);

create policy "Users can update friend requests as receiver (accept/decline)"
  on public.friend_requests for update
  using (auth.uid() = receiver_id);

-- Households
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz default now() not null
);

alter table public.households enable row level security;

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz default now() not null,
  primary key (household_id, user_id)
);

alter table public.household_members enable row level security;

-- Users can see households they are members of
create policy "Users can view households they belong to"
  on public.households for select
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = households.id and hm.user_id = auth.uid()
    )
  );

create policy "Users can insert households"
  on public.households for insert
  with check (auth.uid() = created_by);

create policy "Users can update household if owner"
  on public.households for update
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = households.id and hm.user_id = auth.uid() and hm.role = 'owner'
    )
  );

create policy "Users can view household_members for their households"
  on public.household_members for select
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = household_members.household_id and hm.user_id = auth.uid()
    )
  );

-- Creator can add self as owner; invitee can add self as member after accepting invite
create policy "Users can insert household_members when creator or accepted invitee"
  on public.household_members for insert
  with check (
    user_id = auth.uid()
    and (
      (role = 'owner' and exists (select 1 from public.households h where h.id = household_members.household_id and h.created_by = auth.uid()))
      or
      (role = 'member' and exists (select 1 from public.household_invites hi where hi.household_id = household_members.household_id and hi.invitee_id = auth.uid() and hi.status = 'accepted'))
    )
  );

create policy "Owners can delete household_members"
  on public.household_members for delete
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = household_members.household_id and hm.user_id = auth.uid() and hm.role = 'owner'
    )
  );

-- Household invites
create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now() not null,
  unique (household_id, invitee_id)
);

alter table public.household_invites enable row level security;

create policy "Inviter and invitee can view invite"
  on public.household_invites for select
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);

create policy "Members can create invites"
  on public.household_invites for insert
  with check (
    auth.uid() = inviter_id
    and exists (
      select 1 from public.household_members hm
      where hm.household_id = household_invites.household_id and hm.user_id = auth.uid()
    )
  );

create policy "Invitee can update invite status"
  on public.household_invites for update
  using (auth.uid() = invitee_id);

-- Chore templates
create table public.chore_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  type text not null,
  points integer not null check (points > 0),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz default now() not null
);

alter table public.chore_templates enable row level security;

create policy "Household members can view chore_templates"
  on public.chore_templates for select
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = chore_templates.household_id and hm.user_id = auth.uid()
    )
  );

create policy "Household members can insert chore_templates"
  on public.chore_templates for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.household_members hm
      where hm.household_id = chore_templates.household_id and hm.user_id = auth.uid()
    )
  );

create policy "Household members can update chore_templates"
  on public.chore_templates for update
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = chore_templates.household_id and hm.user_id = auth.uid()
    )
  );

create policy "Household members can delete chore_templates"
  on public.chore_templates for delete
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = chore_templates.household_id and hm.user_id = auth.uid()
    )
  );

-- Chore entries (completions)
create table public.chore_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  chore_id uuid not null references public.chore_templates (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz default now() not null
);

alter table public.chore_entries enable row level security;

create table public.chore_entry_participants (
  entry_id uuid not null references public.chore_entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  points_earned numeric not null check (points_earned >= 0),
  primary key (entry_id, user_id)
);

alter table public.chore_entry_participants enable row level security;

create policy "Household members can view chore_entries"
  on public.chore_entries for select
  using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = chore_entries.household_id and hm.user_id = auth.uid()
    )
  );

create policy "Household members can insert chore_entries"
  on public.chore_entries for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.household_members hm
      where hm.household_id = chore_entries.household_id and hm.user_id = auth.uid()
    )
  );

create policy "Household members can view chore_entry_participants"
  on public.chore_entry_participants for select
  using (
    exists (
      select 1 from public.chore_entries ce
      join public.household_members hm on hm.household_id = ce.household_id and hm.user_id = auth.uid()
      where ce.id = chore_entry_participants.entry_id
    )
  );

create policy "Household members can insert chore_entry_participants"
  on public.chore_entry_participants for insert
  with check (
    exists (
      select 1 from public.chore_entries ce
      join public.household_members hm on hm.household_id = ce.household_id and hm.user_id = auth.uid()
      where ce.id = chore_entry_participants.entry_id
    )
  );

-- Trigger: create profile on signup (optional; we can also do it in app)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
