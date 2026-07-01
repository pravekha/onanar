# Onanar — PRD

## Original Problem Statement
Build "Onanar" — India's Opportunity Desk for Creative Practitioners. Tagline: "Creative opportunities, opened up." Centralise scattered creative opportunities (grants, scholarships, residencies, fellowships, open calls, awards, commissions, funds, mentorships) for Indian artists; make them searchable, matchable, saveable and trackable, with admin management, weekly digest generation and an impact dashboard.

## Design System (Feb 2026 — Bento overhaul)
- Palette: Dark Indigo #23003F (ink), Red-Orange #F94500 (flame), Light Purple #BCACCE (lilac), Light Yellow #FFFDB4 (butter), off-white #FBF9F4 (paper)
- Fonts: **Host Grotesk** (display/headers, bold, tight tracking) + **Instrument Sans** (body/UI)
- Layout: Asymmetric bento grids across every page (col-span-12 grid), rounded-3xl tiles (24px), soft shadows, 16–24px gaps
- Marker-highlight text on key phrases (butter/lilac block behind words in headlines)
- Numbered section labels (01 / 02 / 03) in flame, uppercase tracking
- Pill-shaped tags/badges (rounded-full), pill-shaped buttons, filter selects and inputs
- Contrast pairs: indigo+lilac, orange+indigo, purple+yellow, yellow+orange
- Card colour rotation across grids (`cardVariantAt(index)` helper cycles white / lilac / butter / ink)

## Architecture
- FastAPI (port 8001, /api prefix) + MongoDB (motor) + React 19 (CRA/craco, Tailwind, shadcn conventions)
- Auth: JWT bearer (PyJWT + bcrypt), token in localStorage, 7-day expiry; roles artist/admin; admin seeded from .env
- Match scoring: rule-based /100 (discipline 25, location 15, career stage 15, preferred type 15, keywords/tags 15, deadline urgency 10, difficulty fit 5)
- 71 real opportunities imported from user's Excel; supports rolling/recurring deadlines

## User Personas
- Artist: discovers, filters, saves, tracks opportunities; maintains match profile
- Admin: curates listings, verification, publication, digests, impact metrics

## Core Requirements
Landing, Directory (search + 6 filters + pagination), Detail (eligibility/docs/similar/status actions), Artist Profile, Tracker (6 statuses + notes), Admin Dashboard, Add/Edit form, Digest Builder (4 copy formats), Impact Dashboard.

## Implemented
- JWT auth (register/login/me), seeded admin, protected routes
- 71 real opportunities across all disciplines/types/source types with rolling + dated deadlines
- Directory with debounced search + 6 filters + 24/page pagination
- Bento OpportunityCard with 5 color variants + match score bar
- Detail page with bento sidebar, match summary tile, similar opportunities
- Artist profile (18 spec fields) powering match scores
- Tracker with 6-status pipeline, notes (blur-save), status filter pills
- Admin dashboard with color-rotated stat tiles + distribution bars + full CRUD table
- Add/Edit opportunity form (sectioned bento)
- Digest builder with 4 formats (WhatsApp/Email/Instagram/LinkedIn) + clipboard copy
- Impact dashboard: asymmetric bento stat grid + before/after chart + editable metrics
- **Feb 2026: Full bento-grid UI overhaul with Host Grotesk + Instrument Sans typography**

## Test Credentials
See /app/memory/test_credentials.md (admin@onanar.in/admin123, artist@test.in/artist123)

## Deferred (by user)
- Real email digest delivery via Resend (API key received `re_DU6FdAMJ_...`, verified sender `pravekhais@gmail.com`, deferred: "set up email paths later")
- Google/Gmail login for artists
- Deadline reminder notifications

## Backlog / Next Tasks
- P1: Wire up Resend email delivery for digests (key & email captured)
- P1: Google (Gmail) social login via Emergent-managed Google Auth
- P1: Automated deadline reminder emails to artists
- P2: Public shareable "This Week's Opportunities" page (no-login digest link)
- P2: Admin UI for direct Excel file uploads (currently script-based)
- P2: Opportunity cover images / media
- P2: CORS_ORIGINS explicit for production; migrate on_event → lifespan
- P2: Institution dashboard, multilingual support (deferred from V1)
