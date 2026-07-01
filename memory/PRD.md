# Onanar — PRD

## Original Problem Statement
Build "Onanar" — India's Opportunity Desk for Creative Practitioners. Tagline: "Creative opportunities, opened up." Centralise scattered creative opportunities (grants, scholarships, residencies, fellowships, open calls, awards, commissions, funds, mentorships) for Indian artists; make them searchable, matchable, saveable and trackable, with admin management, weekly digest generation and an impact dashboard. Editorial design: #F7F2EA bg, #1F1F1F text, #D94A2B accent, #4F6F52 green, #D8CFC2 borders. No gradients, cultural-journal feel.

## Architecture
- FastAPI (port 8001, /api prefix) + MongoDB (motor) + React 19 (CRA/craco, Tailwind, shadcn conventions)
- Auth: JWT bearer (PyJWT + bcrypt), token in localStorage, 7-day expiry; roles artist/admin; admin seeded from .env
- Fonts: Cormorant Garamond (display) + IBM Plex Sans (body)
- Seed: 46 realistic Indian creative opportunities (seed_data.py, seeded on startup if collection empty)
- Match scoring: rule-based /100 (discipline 25, location 15, career stage 15, preferred type 15, keywords/tags 15, deadline urgency 10, difficulty fit 5) computed server-side when artist has profile; returns score, reasons, cautions, summary

## User Personas
- Artist: discovers, filters, saves, tracks opportunities; maintains match profile
- Admin: curates listings, verification, publication, digests, impact metrics

## Core Requirements (static)
Landing, Directory (search + 6 filters), Detail (eligibility/docs/similar/status actions), Artist Profile, Tracker (6 statuses + notes), Admin Dashboard (stats + management), Add/Edit form, Digest Builder (4 copy formats), Impact Dashboard (before/after computed metrics).

## Implemented (June 2026 — MVP complete, tested 100% backend + frontend)
- JWT auth (register/login/me), seeded admin, protected routes (artist & admin)
- 46 seeded opportunities across all disciplines/types/source types with deadline states
- Directory with debounced search + discipline/type/location/career-stage/deadline-status/difficulty filters
- Opportunity cards: type, verified badge, deadline countdown badges, save toggle, match score bar
- Detail page: full fields, source link, similar opportunities, tracker status buttons, match summary + cautions
- Artist profile (all 18 spec fields) powering match scores
- Tracker: status pipeline, notes (blur-save), remove, filter tabs, last-updated
- Admin dashboard: 4 stat cards, discipline/type distribution bars, full table with edit/verify/publish/close/archive/delete
- Add/Edit opportunity form (all fields)
- Digest builder: filters → preview + WhatsApp/Email/Instagram/LinkedIn copy formats with clipboard buttons; increments digests_generated
- Impact dashboard: manual metrics + auto-tracked (opps added, applications tracked, artists, digests), computed time saved & % reduction, before/after chart

## Test Credentials
See /app/memory/test_credentials.md (admin@onanar.in/admin123, artist@test.in/artist123)

## Backlog / Next Tasks
- P1: Email digest actually sent (Resend/SendGrid); deadline reminder notifications
- P1: Match summary capitalization polish (capitalize() lowercases discipline names — cosmetic)
- P2: Set explicit CORS_ORIGINS for production deploy; migrate on_event → lifespan
- P2: Pagination for directory when listings grow; opportunity images; public share pages for digests
- P2: Institution dashboard, multilingual support (explicitly deferred from V1)
