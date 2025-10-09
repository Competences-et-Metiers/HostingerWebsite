### Roadmap projet BDC x Dendreo (React 18 + Vite + Tailwind + Supabase)

Voici une roadmap pragmatique, découpée en phases avec livrables, décisions clés, et jalons. Elle couvre l’intégration Dendreo, le dev des fonctionnalités (vues bénéficiaire/consultant), et le déploiement public.

---

## Phase 0 — Cadrage et fondations (Semaine 1)

Objectifs

Aligner la cible fonctionnelle et technique, fixer les décisions d’intégration Dendreo ⇄ WebApp.

**Décisions à prendre**

**Source d'identité:**

Création de compte WebApp lors de l’ajout du bénéficiaire à une ADF.

OU

Création automatique du bénéficiaire dans Dendreo via API après inscription WebApp.


**Stratégie de synchronisation:**

- Webhooks Dendreo (si disponibles) pour événements ADF/inscription
- Polling planifié (cron Supabase Edge Functions) si pas de webhooks

Clé d’appariement: email comme identifiant primaire + fallback via ID Dendreo.

---

## Phase 1 — Architecture et socle technique (Semaines 2–3)

**Tech setup**

- Monorepo ou repo unique Vite (SPA), TypeScript strict.
- UI: Radix Primitives + composants shadcn-style, Framer Motion, Lucide.
- Auth: Supabase (email/password + magic link). RLS activées.
- State: React Query pour données serveur + Zustand (ou Context) pour UI state léger.
- Routage: React Router v6 (layout public/auth/role-based).

**Sécurité et conformité**

- RLS Supabase: policies par rôle (beneficiaire, consultant, admin).
- Chiffrement au repos (Supabase), TLS en transit. Rotation de secrets.
- Journalisation accès (table audit_logs).

**CI/CD**

- GitHub Actions: lint, type-check, tests unitaires, build.
- Previews par PR (Vercel/Netlify).
- Quality gates (coverage, Lighthouse CI).

**Livrables**

- Arborescence du projet, pipelines CI/CD, config Tailwind/PostCSS.
- Schéma base de données (SQL migrations).

---

## Phase 2 — Modèle de données et intégration Dendreo (Semaines 3–5)


Mapping de champs Dendreo ⇄ WebApp

- Bénéficiaire: id, email, prénom/nom → profiles/beneficiaries
- ADF: id, catégorie → adf_actions
- Créneaux: date/heure → adf_slots (planned_minutes)
- Temps passé: alimentation via retours Dendreo (presence/feuille d’émargement) → spent_minutes

Flux d’identité (choisir Option A ou B)

- Option A (recommandée si Dendreo reste CRM maître):
    1. Création/inscription bénéficiaire dans Dendreo à une ADF.
    2. Webhook/cron détecte l’inscription → upsert profiles + beneficiaries.
    3. Email d’invitation WebApp (Supabase magic link) envoyé automatiquement.
- Option B:
    1. Self-signup WebApp → création beneficiaries.
    2. Appel API Dendreo pour créer le bénéficiaire + inscription ADF choisie.
    3. Stockage des IDs Dendreo en retour.

Synchronisation

- Pull initial: import des bénéficiaires, ADFs, créneaux 12 derniers mois.
- Incrémental: toutes les 15 min via Edge Function + cursor par updated_at.
- Conflits: Supabase est lecture/écriture sur champs locaux; champs “maîtrisés par Dendreo” en lecture seule côté WebApp.
- Observabilité: sync_jobs + dashboards (Logflare/Supabase Logs).

Livrables

- Edge Functions: pull_beneficiaries, pull_adfs, pull_slots, push_beneficiary (Option B).
- Tests d’intégration sur sandbox Dendreo.

---

## Phase 3 — Fonctionnalités MVP (Semaines 5–8)

Vues Bénéficiaire

- Onboarding
    - Acceptation CGU/Consentement RGPD, mise à jour profil.
- Tableau de bord
    - Liste des ADFs avec statut, prochains créneaux.
    - Temps planifié vs passé (progress bars).
- Dossier BDC (structure)
    - Étapes BDC (diagnostic, investigation, synthèse) avec checklists.
    - Upload de livrables (CV, tests, documents) vers Supabase Storage.
    - Messagerie simple avec consultant (thread par ADF).
- Agenda
    - Créneaux synchronisés; ajout à calendrier (ICS).
- Notifications
    - Email + toast in-app (radix toast) pour nouveaux créneaux/modifs.

Vues Consultant

- Tableau de bord
    - Bénéficiaires suivis, ADFs en cours, alertes (retards, non‑connexion).
- Dossier BDC
    - Suivi des étapes, commentaires internes, assignation tâches.
    - Validation/horodatage des temps passés (si saisi côté WebApp).
- Planification
    - Lecture des créneaux Dendreo; proposition d’avenants (si périmètre).
- Exports
    - Génération de synthèses PDF (Puppeteer/Cloud Function) si besoin.

Transversal

- RBAC: garde de routes par rôle, RLS vérifiée par tests.
- Accessibilité: focus states, contrastes Tailwind, tests Axe.
- Animations légères Framer Motion (modales, steps).

Livrables

- Routes React Router v6
    - /login, /onboarding
    - /app (layout)
        - /app/beneficiaire/dashboard, /adf/:id, /agenda, /documents
        - /app/consultant/dashboard, /beneficiaires/:id, /adf/:id
- Composants UI (Button, Card, Dialog, Toast, DataTable).
- Tests E2E critiques (Playwright/Cypress) pour login, vues dashboards, sync.

---

## Phase 4 — Qualité, sécurité, conformité (Semaines 8–9)

- Tests
    - Unitaires (Vitest) ≥ 70% coverage sur hooks/services.
    - E2E smoke suite sur parcours critiques.
- Sécurité
    - Vérification RLS, tentatives d’escalade de rôle.
    - Rate limiting sur endpoints Edge Functions.
    - CSP header strict, désactivation de source inline.
- RGPD
    - Politique de confidentialité, mentions d’information.
    - Droit d’accès/suppression: endpoints pour export JSON du dossier BDC.
    - Durées de conservation documentées.
- Performance
    - Lighthouse ≥ 90 en PWA/Best Practices.
    - Code-splitting par route, prefetch intelligent.

Livrables

- DPA avec Supabase, Registre traitements, DPIA léger si nécessaire.
- Rapport de tests, plan de remédiation.

---

## Phase 5 — Déploiement public et SRE léger (Semaines 9–10)

Hébergement recommandé

- Frontend: Vercel (SSR non requis, SPA OK) ou Netlify.
- Backend: Supabase (DB Postgres + Auth + Storage + Edge Functions).
- Domaines: app.votre-domaine.fr avec HTTPS, redirections www → apex.
- Observabilité
    - Supabase Logs + Alertes (p95 latence, erreurs 5xx).
    - Sentry pour front-end, UptimeRobot/Better Stack pour disponibilité.

CI/CD

- Branch strategy: main (prod), develop (staging).
- Environnements: .env.staging / .env.prod stockés comme secrets.
- Promotion: merge PR → build preview → validation → tag release.

Livrables

- Playbook incident (rotation clés, rollback, restauration DB point-in-time).
- Runbook sync (relancer job, rejouer delta, inspection sync_jobs).

---

## Backlog détaillé (extraits)

EPIC Intégration Dendreo

- US: En tant qu’admin, je peux configurer la clé API Dendreo et tester la connexion.
- US: En tant que système, je synchronise les bénéficiaires créés/inscrits (pull).
- US: En tant que système, je crée un compte WebApp lors d’une nouvelle inscription Dendreo (Option A).
- US: En tant que consultant, je vois les ADFs et créneaux d’un bénéficiaire.

EPIC Dossier BDC

- US: En tant que bénéficiaire, je vois mes étapes BDC et leur avancement.
- US: Je dépose des documents et je les partage avec mon consultant.
- US: En tant que consultant, je valide l’étape et ajoute un commentaire.

EPIC Traçabilité du temps

- US: Visualiser temps planifié vs passé par ADF.
- US: Saisir/valider temps passé (si hors Dendreo) et exporter.

EPIC Déploiement/Qualité

- US: En tant qu’admin, je reçois des alertes de sync en échec.
- US: En tant qu’admin, je peux exporter toutes les données d’un bénéficiaire (RGPD).

Critères d’acceptation types

- Synchronisation complète < 15 min après modification côté Dendreo.
- RLS: un bénéficiaire ne peut jamais lire un autre dossier (tests négatifs).
- Temps passé affiché = valeur Dendreo (ou la plus récente si override local documenté).

---

## Risques et mitigations

- Variabilité API Dendreo ou limites de quota
    - Mitigation: backoff exponentiel, files d’attente, journalisation fine.
- Emails non délivrés (onboarding)
    - Mitigation: double canal (email + SMS si possible), lien de réenvoi.
- Désalignement des IDs/duplication
    - Mitigation: contrainte unique sur dendreo_*_id, procédures de merge.

---

## Estimation calendrier

- S1: Cadrage + RGPD
- S2–3: Socle technique + DB + CI/CD
- S3–5: Intégration Dendreo (pull/push) + sync incrémentale
- S5–8: MVP vues Bénéficiaire/Consultant
- S8–9: QA/Sécurité/Performance
- S9–10: Déploiement public + monitoring