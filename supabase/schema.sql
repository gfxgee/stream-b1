-- Digitalfeet Calculator POC — Supabase schema
-- Run this once in the Supabase SQL editor for your project.
--
-- NOTE: POC with test data only. No RLS policies are defined here because the
-- app talks to Supabase exclusively from the server using the service_role key
-- (which bypasses RLS). Do not expose these tables to the anon/public client.

-- leads — one row per form submission (including price-only exits)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  situation text not null,
  url text,
  budget_band text,
  timeline text,
  project_type text,
  company text,
  industry text,
  team_size text,
  email text,                 -- null if price-only exit
  chosen_path text            -- 'email_plan' | 'book_maia' | 'dig_deeper' | 'price_only'
);

-- plans — the AI output, 1:1 with a lead (populated once Gemini is wired up)
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  created_at timestamptz default now(),
  price_min int,
  price_max int,
  currency text default 'NOK',
  plan_markdown text,         -- the written plan
  raw_json jsonb,             -- full model response for debugging
  quality_score int           -- 1-5, filled in manually later (mimics Maia's scoring)
);
