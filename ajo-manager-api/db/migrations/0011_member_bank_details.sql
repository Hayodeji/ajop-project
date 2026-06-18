-- Migration: Add bank details to group members

alter table public.group_members
  add column if not exists bank_name text null,
  add column if not exists account_number text null,
  add column if not exists account_name text null;