-- Ajo Manager — initial schema
-- Run this once in Supabase SQL editor (or via Supabase CLI).
-- All monetary values are stored in kobo (integer, 1 Naira = 100 kobo).

-- =========================================================================
-- Enums
-- =========================================================================

create type group_frequency as enum ('weekly', 'biweekly', 'monthly');
create type contribution_status as enum ('pending', 'paid', 'late');

-- =========================================================================
-- Tables
-- =========================================================================

create table public.groups (
  id                   uuid        primary key default gen_random_uuid(),
  admin_id             uuid        not null references auth.users(id) on delete cascade,
  name                 text        not null,
  contribution_amount  bigint      not null check (contribution_amount > 0),
  frequency            group_frequency not null,
  member_count         int         not null check (member_count between 2 and 100),
  current_cycle        int         not null default 1 check (current_cycle >= 1),
  public_token         text        not null unique,
  created_at           timestamptz not null default now()
);

create index groups_admin_id_idx      on public.groups (admin_id);
create index groups_public_token_idx  on public.groups (public_token);

create table public.group_members (
  id               uuid        primary key default gen_random_uuid(),
  group_id         uuid        not null references public.groups(id) on delete cascade,
  name             text        not null,
  phone            text        not null,
  payout_position  int         not null check (payout_position >= 1),
  is_active        boolean     not null default true,
  joined_at        timestamptz not null default now(),
  unique (group_id, payout_position),
  unique (group_id, phone)
);

create index group_members_group_id_idx on public.group_members (group_id);

create table public.contributions (
  id            uuid        primary key default gen_random_uuid(),
  group_id      uuid        not null references public.groups(id) on delete cascade,
  member_id     uuid        not null references public.group_members(id) on delete cascade,
  cycle_number  int         not null check (cycle_number >= 1),
  status        contribution_status not null default 'pending',
  paid_at       timestamptz null,
  marked_by     uuid        null references auth.users(id) on delete set null,
  unique (member_id, cycle_number)
);

create index contributions_group_id_idx   on public.contributions (group_id);
create index contributions_member_id_idx  on public.contributions (member_id);
create index contributions_status_idx     on public.contributions (status);

create table public.payouts (
  id            uuid        primary key default gen_random_uuid(),
  group_id      uuid        not null references public.groups(id) on delete cascade,
  member_id     uuid        not null references public.group_members(id) on delete cascade,
  cycle_number  int         not null check (cycle_number >= 1),
  amount        bigint      not null check (amount > 0),
  paid_out_at   timestamptz not null default now(),
  receipt_url   text        null,
  unique (group_id, cycle_number)
);

create index payouts_group_id_idx  on public.payouts (group_id);
create index payouts_member_id_idx on public.payouts (member_id);

-- =========================================================================
-- Row Level Security
--
-- Notes:
--   - The NestJS API uses the service_role key, which BYPASSES RLS.
--   - These policies are defense-in-depth: they protect against direct
--     client access using the anon key (which we do not do by design)
--     and enforce the invariant that an admin can only see their own data.
--   - The public dashboard endpoint is served by NestJS using service_role
--     and scopes by public_token — no RLS policy needed for that path.
-- =========================================================================

alter table public.groups          enable row level security;
alter table public.group_members   enable row level security;
alter table public.contributions   enable row level security;
alter table public.payouts         enable row level security;

-- groups: admin owns
create policy "groups_owner_select" on public.groups
  for select using (admin_id = auth.uid());

create policy "groups_owner_insert" on public.groups
  for insert with check (admin_id = auth.uid());

create policy "groups_owner_update" on public.groups
  for update using (admin_id = auth.uid())
              with check (admin_id = auth.uid());

create policy "groups_owner_delete" on public.groups
  for delete using (admin_id = auth.uid());

-- group_members: accessible via parent group
create policy "group_members_owner_select" on public.group_members
  for select using (
    exists (select 1 from public.groups g
            where g.id = group_members.group_id and g.admin_id = auth.uid())
  );

create policy "group_members_owner_insert" on public.group_members
  for insert with check (
    exists (select 1 from public.groups g
            where g.id = group_members.group_id and g.admin_id = auth.uid())
  );

create policy "group_members_owner_update" on public.group_members
  for update using (
    exists (select 1 from public.groups g
            where g.id = group_members.group_id and g.admin_id = auth.uid())
  );

create policy "group_members_owner_delete" on public.group_members
  for delete using (
    exists (select 1 from public.groups g
            where g.id = group_members.group_id and g.admin_id = auth.uid())
  );

-- contributions: accessible via parent group
create policy "contributions_owner_select" on public.contributions
  for select using (
    exists (select 1 from public.groups g
            where g.id = contributions.group_id and g.admin_id = auth.uid())
  );

create policy "contributions_owner_insert" on public.contributions
  for insert with check (
    exists (select 1 from public.groups g
            where g.id = contributions.group_id and g.admin_id = auth.uid())
  );

create policy "contributions_owner_update" on public.contributions
  for update using (
    exists (select 1 from public.groups g
            where g.id = contributions.group_id and g.admin_id = auth.uid())
  );

create policy "contributions_owner_delete" on public.contributions
  for delete using (
    exists (select 1 from public.groups g
            where g.id = contributions.group_id and g.admin_id = auth.uid())
  );

-- payouts: accessible via parent group
create policy "payouts_owner_select" on public.payouts
  for select using (
    exists (select 1 from public.groups g
            where g.id = payouts.group_id and g.admin_id = auth.uid())
  );

create policy "payouts_owner_insert" on public.payouts
  for insert with check (
    exists (select 1 from public.groups g
            where g.id = payouts.group_id and g.admin_id = auth.uid())
  );

create policy "payouts_owner_update" on public.payouts
  for update using (
    exists (select 1 from public.groups g
            where g.id = payouts.group_id and g.admin_id = auth.uid())
  );

create policy "payouts_owner_delete" on public.payouts
  for delete using (
    exists (select 1 from public.groups g
            where g.id = payouts.group_id and g.admin_id = auth.uid())
  );
