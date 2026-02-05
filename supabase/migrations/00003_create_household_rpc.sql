-- Create household via RPC so inserts run with definer rights (bypass RLS)
-- while still requiring auth.uid(). Fixes "new row violates row-level security"
-- when the session JWT is not applied to the insert request (e.g. server actions).

create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_household_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.households (name, created_by)
  values (p_name, v_uid)
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_uid, 'owner');

  return v_household_id;
end;
$$;
