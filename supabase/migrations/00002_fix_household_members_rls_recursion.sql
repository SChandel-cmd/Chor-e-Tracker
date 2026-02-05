-- Fix infinite recursion: policies on household_members were querying household_members,
-- which re-triggered the same policies. Use SECURITY DEFINER functions so the check
-- runs with owner privileges and bypasses RLS.

create or replace function public.is_household_member(p_household_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id and hm.user_id = p_user_id
  );
$$;

create or replace function public.is_household_owner(p_household_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id and hm.user_id = p_user_id and hm.role = 'owner'
  );
$$;

-- Drop recursive policies
drop policy if exists "Users can view household_members for their households" on public.household_members;
drop policy if exists "Owners can delete household_members" on public.household_members;

-- Recreate using helper functions (no self-reference)
create policy "Users can view household_members for their households"
  on public.household_members for select
  using (public.is_household_member(household_id, auth.uid()));

create policy "Owners can delete household_members"
  on public.household_members for delete
  using (public.is_household_owner(household_id, auth.uid()));
