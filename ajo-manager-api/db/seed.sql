-- AjoPot — Complete Database Schema
-- Consolidated from migrations 0001–0012.
-- Run once in Supabase SQL Editor on a fresh project.
-- All monetary values stored in kobo (1 Naira = 100 kobo).

-- =========================================================================
-- Enums
-- =========================================================================
create type group_frequency       as enum ('weekly', 'biweekly', 'monthly');
create type contribution_status   as enum ('pending', 'paid', 'late');
create type subscription_plan     as enum ('basic', 'smart', 'pro');
-- NOTE: 'trialing' (not 'trial') — matches the NestJS SubscriptionStatus enum
create type subscription_status   as enum ('trialing', 'active', 'payment_failed', 'cancelled', 'expired');

-- =========================================================================
-- Tables
-- =========================================================================

create table public.groups (
  id                   uuid            primary key default gen_random_uuid(),
  admin_id             uuid            not null references auth.users(id) on delete cascade,
  name                 text            not null,
  contribution_amount  bigint          not null check (contribution_amount > 0),
  late_fee_amount      bigint          not null default 0,
  frequency            group_frequency not null,
  member_count         int             not null check (member_count between 2 and 100),
  current_cycle        int             not null default 1 check (current_cycle >= 1),
  public_token         text            not null unique,
  created_at           timestamptz     not null default now()
);

create index groups_admin_id_idx     on public.groups (admin_id);
create index groups_public_token_idx on public.groups (public_token);

create table public.group_members (
  id                uuid        primary key default gen_random_uuid(),
  group_id          uuid        not null references public.groups(id) on delete cascade,
  name              text        not null,
  phone             text        not null,
  payout_position   int         not null check (payout_position >= 1),
  outstanding_fines bigint      not null default 0,
  is_active         boolean     not null default true,
  joined_at         timestamptz not null default now(),
  bank_name         text        null,
  account_number    text        null,
  account_name      text        null,
  unique (group_id, phone)
);

create index group_members_group_id_idx on public.group_members (group_id);
-- Partial unique: only active members must have distinct positions
create unique index group_members_active_payout_position_idx
  on public.group_members (group_id, payout_position)
  where is_active = true;

create table public.contributions (
  id                  uuid                primary key default gen_random_uuid(),
  group_id            uuid                not null references public.groups(id) on delete cascade,
  member_id           uuid                not null references public.group_members(id) on delete cascade,
  cycle_number        int                 not null check (cycle_number >= 1),
  status              contribution_status not null default 'pending',
  paid_at             timestamptz         null,
  marked_by           uuid                null references auth.users(id) on delete set null,
  member_replied_paid boolean             not null default false,
  due_date            timestamptz         null,
  created_at          timestamptz         not null default now(),
  unique (member_id, cycle_number)
);

create index contributions_group_id_idx  on public.contributions (group_id);
create index contributions_member_id_idx on public.contributions (member_id);
create index contributions_status_idx    on public.contributions (status);

create table public.payouts (
  id           uuid        primary key default gen_random_uuid(),
  group_id     uuid        not null references public.groups(id) on delete cascade,
  member_id    uuid        not null references public.group_members(id) on delete cascade,
  cycle_number int         not null check (cycle_number >= 1),
  amount       bigint      not null check (amount > 0),
  paid_out_at  timestamptz not null default now(),
  receipt_url  text        null,
  unique (group_id, cycle_number)
);

create index payouts_group_id_idx  on public.payouts (group_id);
create index payouts_member_id_idx on public.payouts (member_id);

create table public.profiles (
  id            uuid              primary key default gen_random_uuid(),
  user_id       uuid              not null unique references auth.users(id) on delete cascade,
  name          text              not null,
  phone         text              null,
  email         text              null,
  plan          subscription_plan not null default 'basic',
  is_pro        boolean           not null default false,
  referral_code text              unique,
  referred_by   text              null,
  role          text              not null default 'user' check (role in ('user', 'super_admin')),
  is_suspended  boolean           not null default false,
  created_at    timestamptz       not null default now()
);

create unique index profiles_phone_unique on public.profiles (phone) where phone is not null;
create index idx_profiles_user_id         on public.profiles (user_id);
create index idx_profiles_role            on public.profiles (role);

create table public.subscriptions (
  id                         uuid                primary key default gen_random_uuid(),
  user_id                    uuid                not null unique references auth.users(id) on delete cascade,
  plan                       subscription_plan   not null,
  status                     subscription_status not null default 'trialing',
  trial_ends_at              timestamptz         null,
  current_period_start       timestamptz         null,
  current_period_end         timestamptz         null,
  paystack_reference         text                null,
  paystack_customer_code     text                null,
  paystack_subscription_code text                null,
  retry_count                int                 not null default 0,
  custom_group_limit         int                 null,
  custom_member_limit        int                 null,
  limits_note                text                null,
  created_at                 timestamptz         not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions (user_id);
create index idx_subscriptions_status  on public.subscriptions (status);

create table public.payment_events (
  id                 uuid        primary key default gen_random_uuid(),
  event_type         text        not null,
  paystack_reference text        null,
  user_id            uuid        null references auth.users(id) on delete set null,
  payload            jsonb       null,
  created_at         timestamptz not null default now()
);

create table public.reminder_logs (
  id              uuid        primary key default gen_random_uuid(),
  contribution_id uuid        null references public.contributions(id) on delete set null,
  member_id       uuid        null references public.group_members(id) on delete set null,
  sent_at         timestamptz not null default now(),
  channel         text        not null default 'whatsapp'
);

create table public.audit_logs (
  id          uuid        primary key default gen_random_uuid(),
  actor_id    uuid        null references auth.users(id) on delete set null,
  action      text        not null,
  target_type text        null,
  target_id   uuid        null,
  metadata    jsonb       null,
  created_at  timestamptz not null default now()
);

create table public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        null references auth.users(id) on delete cascade,
  message    text        not null,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  body        text        not null,
  target_plan text        null,
  channel     text        not null default 'in_app',
  sent_at     timestamptz null,
  created_by  uuid        null references auth.users(id) on delete set null
);

create table public.user_announcement_reads (
  user_id         uuid        not null references auth.users(id) on delete cascade,
  announcement_id uuid        not null references public.announcements(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

-- =========================================================================
-- Row Level Security
-- NestJS uses service_role key which bypasses RLS.
-- These policies protect against direct anon-key access.
-- =========================================================================

alter table public.groups                  enable row level security;
alter table public.group_members           enable row level security;
alter table public.contributions           enable row level security;
alter table public.payouts                 enable row level security;
alter table public.profiles                enable row level security;
alter table public.subscriptions           enable row level security;
alter table public.payment_events          enable row level security;
alter table public.reminder_logs           enable row level security;
alter table public.audit_logs              enable row level security;
alter table public.notifications           enable row level security;
alter table public.announcements           enable row level security;
alter table public.user_announcement_reads enable row level security;

-- groups
create policy "groups_owner_select" on public.groups for select using (admin_id = auth.uid());
create policy "groups_owner_insert" on public.groups for insert with check (admin_id = auth.uid());
create policy "groups_owner_update" on public.groups for update using (admin_id = auth.uid()) with check (admin_id = auth.uid());
create policy "groups_owner_delete" on public.groups for delete using (admin_id = auth.uid());

-- group_members (via parent group)
create policy "group_members_owner_select" on public.group_members for select using (
  exists (select 1 from public.groups g where g.id = group_members.group_id and g.admin_id = auth.uid())
);
create policy "group_members_owner_insert" on public.group_members for insert with check (
  exists (select 1 from public.groups g where g.id = group_members.group_id and g.admin_id = auth.uid())
);
create policy "group_members_owner_update" on public.group_members for update using (
  exists (select 1 from public.groups g where g.id = group_members.group_id and g.admin_id = auth.uid())
);
create policy "group_members_owner_delete" on public.group_members for delete using (
  exists (select 1 from public.groups g where g.id = group_members.group_id and g.admin_id = auth.uid())
);

-- contributions (via parent group)
create policy "contributions_owner_select" on public.contributions for select using (
  exists (select 1 from public.groups g where g.id = contributions.group_id and g.admin_id = auth.uid())
);
create policy "contributions_owner_insert" on public.contributions for insert with check (
  exists (select 1 from public.groups g where g.id = contributions.group_id and g.admin_id = auth.uid())
);
create policy "contributions_owner_update" on public.contributions for update using (
  exists (select 1 from public.groups g where g.id = contributions.group_id and g.admin_id = auth.uid())
);
create policy "contributions_owner_delete" on public.contributions for delete using (
  exists (select 1 from public.groups g where g.id = contributions.group_id and g.admin_id = auth.uid())
);

-- payouts (via parent group)
create policy "payouts_owner_select" on public.payouts for select using (
  exists (select 1 from public.groups g where g.id = payouts.group_id and g.admin_id = auth.uid())
);
create policy "payouts_owner_insert" on public.payouts for insert with check (
  exists (select 1 from public.groups g where g.id = payouts.group_id and g.admin_id = auth.uid())
);
create policy "payouts_owner_update" on public.payouts for update using (
  exists (select 1 from public.groups g where g.id = payouts.group_id and g.admin_id = auth.uid())
);
create policy "payouts_owner_delete" on public.payouts for delete using (
  exists (select 1 from public.groups g where g.id = payouts.group_id and g.admin_id = auth.uid())
);

-- profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

-- subscriptions
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);

-- notifications
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);
