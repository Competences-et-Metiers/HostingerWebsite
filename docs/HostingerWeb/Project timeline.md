### Detailed tasks by sprint

#### Sprint 1 (Oct 13–Oct 24): Foundations

- ~~Discovery and scope~~
    - ~~Confirm MVP scope: personas (Beneficiary, Consultant, Admin), success metrics, legal constraints (RGPD)~~
    - ~~Map BDC workflow stages (onboarding → assessment → sessions → synthesis → restitution)~~
- ~~Access and environments~~
    - ~~Request/verify Dendreo API credentials + sandbox; document rate limits and scopes~~
    - ~~Create Supabase project (prod/stage), enable Auth providers, set RLS strategy~~
- ~~Architecture and repo~~
    - ~~Vite + React 18 + TS mono-repo or single package; commit lint, Prettier/ESLint~~
    - ~~CI/CD: GitHub Actions (typecheck, test, build, preview deploy to Vercel/Netlify/Fly)~~
    - ~~Environments and secrets management (stage/prod), .env strategy~~
- ~~Quality scaffolding~~
    - ~~Testing baseline (Vitest, React Testing Library), e2e (Playwright)~~
    - ~~Error reporting + observability (Sentry/Alternatives), logging standard~~
    - ~~Security checklist kickoff (CSP, CORS, dependency scanning)~~
- ~~Deliverables: Project brief, user flows, architecture diagram, CI/CD green, access verified~~

#### Sprint 2 (Oct 27–Nov 7): Design system + Auth + App shell

- ~~Design system~~
    - ~~Tailwind config (tokens, dark mode), Radix primitives, shadcn-style components (Button, Input, Select, Dialog, Tabs, Toast)~~
    - ~~Icon strategy (Lucide), motion guidelines (Framer Motion)~~
- ~~App shell and navigation~~
    - ~~React Router v6 routes, code-splitting, lazy boundaries, skeleton loaders~~
    - ~~Global layout, header, sidebar, breadcrumbs, 404/500 pages~~
- ~~Authentication~~
    - ~~Supabase email/password + magic link; session persistence; protected routes/guards~~
    - ~~Basic account profile page; signout; password reset~~
- ~~Deliverables: Component library v0, Auth flows, App shell, Route guards~~

#### Sprint 3 (Nov 10–Nov 21): BDC domain + Forms + Dendreo sync POC

- Domain and data modeling
    - ERD for BDC: Beneficiary, Consultant, BDC, Session, Document, Assessment, Progress, Notes
    - Supabase tables + Row Level Security (tenant-safe), policies, indices
- Form engine
    - Zod schemas for BDC questionnaires; react-hook-form setup; field components; autosave
    - Draft/publish mechanics, validation, error UX
- Dendreo integration POC
    - OAuth/Token storage strategy; example endpoints; sync of participants/sessions
    - Background jobs/cron for sync (Edge Functions or scheduled tasks)
- Dashboards
    - Beneficiary home: next steps, upcoming sessions, documents
    - Consultant view: assigned BDCs, statuses, actions
- Deliverables: Working POC syncing Dendreo entities, first BDC forms, dashboards

#### Sprint 4 (Nov 24–Dec 5): End‑to‑end BDC journey

- BDC workflow
    - Create BDC from Dendreo cohort/lead; session planning and re-scheduling
    - Milestones and status transitions; activity timeline
- Documents and storage
    - Supabase Storage: upload/download policies, signed URLs, virus scan hook (if used)
    - Export PDF for synthesis/report; template and theming
- Communication
    - Email notifications (transactional provider) for invitations, reminders, updates
    - In‑app notifications (Toast + inbox), notification preferences center
- Analytics and reporting
    - Event tracking plan; funnels; admin stats (conversion, completion, satisfaction)
- QA Round 1
    - Test matrix across browsers/devices; fix priority defects
- Deliverables: E2E BDC flow usable on staging + documentation

#### Sprint 5 (Dec 8–Dec 19): Hardening, UAT, and MVP release

- Security and compliance
    - Finalize RLS, scope-based access; audit logs; admin impersonation safeguards
    - CSP, CORS, rate limiting, dependency audit, secrets rotation
    - RGPD: privacy policy, data retention, export/delete, DPA with providers
- Performance and a11y
    - Performance budget: LCP/INP targets, bundle analysis, image optimization
    - Accessibility pass: keyboard nav, focus traps, color contrast, ARIA
- Internationalization and content
    - fr-FR copy review, date/number formats; i18n hooks for future locales
- UAT and release
    - UAT scenarios with real users (Consultant/Admin)
    - Migration scripts, backfill jobs; runbooks (on-call, incident, rollback)
    - Go‑live checklist; production deploy by Fri, Dec 19, 2025
- Deliverables: Signed UAT, release notes, runbooks, MVP live