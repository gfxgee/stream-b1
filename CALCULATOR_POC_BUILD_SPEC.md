# Digitalfeet Calculator — POC Build Spec

> **Status:** Personal prototype / proof-of-concept. **Not** the production B1 deliverable.
> The production Calculator uses Claude API + Make + ClickUp (owned by Jason). This POC
> deliberately uses a different, free stack to explore the shape of the product.

> **HARD RULE — test data only.** Gemini's free tier permits Google to use your inputs for
> training. Never enter real prospect/customer data. Use fabricated examples only.

---

## 1. What we're building

A web "Calculator" — really an **AI-driven project-plan generator** wearing a calculator's
clothing. A visitor describes their situation in plain language across a 5-step form. The app
calls an AI model, which returns a **personalized project plan** containing:

- A **price range** (not a single fixed number)
- A short written plan tailored to their situation
- **Three paths forward:** Email Plan (A / DIY), Book Maia (B / with us), Dig Deeper (C / think about it)
- A **price-only closer** that lets them see the range and exit without giving an email

There is no fixed pricing formula. Interpreting free-text input into a sensible plan is the
job of the language model.

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | Single app, frontend + API routes |
| Styling | **Tailwind CSS** | Breakpoints: mobile 375px, desktop 1440px |
| AI | **Google Gemini API — `gemini-2.5-flash`** | Free tier: ~10 RPM, 250 req/day. Use Flash (not Flash-Lite) for plan quality. Pro is NOT on the free tier as of 2026. |
| Database | **Supabase** (Postgres + JS client) | Free tier is fine for POC |
| Hosting (optional) | Vercel free tier | Only if you want it online; local is fine |

## 3. Accounts / keys needed (all free at POC scale, no card)

1. **Google AI Studio** → create a Gemini API key.
2. **Supabase** → create a project; grab the Project URL and the `anon` + `service_role` keys.
3. **Node.js 20+** installed locally.

Store all keys in `.env.local` (never commit). Provide a committed `.env.example` with blank values.

## 4. Architecture / data flow

```
Visitor → 5-step form (client)
        → POST /api/generate (server)
            → validate inputs
            → (optional) fetch + extract text from submitted URL
            → build prompt → call Gemini (force JSON output)
            → parse { priceRange, plan, paths }
            → insert lead + plan into Supabase
            → return plan JSON
        → render plan + path buttons + price-only exit (client)
```

Keep the Gemini call **server-side only** (API route), so the key is never exposed to the browser.

## 5. Form steps (5 steps)

1. **Situation** — free text: "Describe your situation / what you want to build." (the key AI input)
2. **Website URL** — their current site, if any (used for optional scrape context).
3. **Scope signals** — a few structured selects: rough budget band, timeline, project type.
4. **About them** — company name, industry, team size.
5. **Email gate** — email address + the path choice CTA. Include a "Just show me the price range" link (price-only closer) that reveals the range without requiring email.

Client-side state across steps (e.g. `useReducer` or a simple context). Validate before advancing.

## 6. Data model (Supabase)

```sql
-- leads
create table leads (
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

-- plans (the AI output, 1:1 with a lead)
create table plans (
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
```

The `quality_score` column lets you replay the spec's quality gate yourself: generate ~30
plans on fake inputs and self-score them, targeting a median of 3.5.

## 7. The Gemini prompt (design notes)

- **Force structured output.** Ask for JSON only, matching a fixed schema, so parsing is reliable:
  ```json
  {
    "price_min": 60000,
    "price_max": 110000,
    "currency": "NOK",
    "plan_markdown": "## Your plan\n- ...",
    "recommended_path": "book_maia",
    "rationale": "one sentence"
  }
  ```
- **System instruction** should: describe Digitalfeet as a web/digital agency; explain the two
  reference products as price anchors — **Quick Launch ≈ 60,000 NOK / ~80h** and
  **Custom Build ≈ 110,000 NOK / ~150h**; instruct it to produce a realistic range bounded
  roughly by those anchors; keep the plan concise and concrete.
- **Latency target:** the live customer plan should render in **under 30 seconds**. Flash is fast
  enough; keep output tokens modest.
- Handle the model returning malformed JSON: retry once, then fall back to a friendly error.

## 8. Build sequence (suggested order for Claude Code)

1. Scaffold Next.js + TypeScript + Tailwind. Get the 5-step form clicking through with local state and validation — no backend yet.
2. Stand up Supabase, run the schema SQL, wire form submit to insert a `leads` row.
3. Add `/api/generate` calling Gemini with a hardcoded prompt; get *any* plan back end-to-end.
4. Iterate the prompt to return the structured JSON above; render the price range + plan nicely.
5. Add the three path buttons + price-only exit; persist `chosen_path`; add the `quality_score` field.
6. Polish responsive layout at 375px and 1440px; loading + error states.

## 9. Out of scope for the POC (don't build these)

- ClickUp / Make integration, Microsoft Bookings, nurture email sequences.
- Auth, real customer data, production hosting hardening.
- The separate "Maia briefing" prompt (the production version fires 1h before a sales call).

Keep it a single, self-contained app that proves the core loop: free-text in → AI plan + paths out → stored in a DB.
