# DevNote

**A developer's project memory.** DevNote is a workspace for keeping the context of your side‑projects alive — not just *what* you're building, but *where you left off* and *why* you made the calls you made.

It tracks projects, to‑dos, rich notes, decisions, files, and a full activity history, and lets you share a project with teammates by e‑mail with role‑based access.

> Built as a learning project with a strict, reviewable, layered architecture on top of Angular + Supabase.

---

## ✨ Features

- **Projects** — create, edit (name, description, status, stage, *next action*), and delete. Eight lifecycle states (idea → planning → in progress → blocked → testing → on hold → done → archived).
- **To‑dos** — categories (task / bug), a status workflow (backlog → next → in progress → blocked → done), grouped lists, and **drag‑and‑drop manual ordering** (Angular CDK).
- **Snapshot ("where I left off")** — an at‑a‑glance summary that aggregates your next action, open work, blockers, recently touched items, and counts. Pure derived data — no extra tables.
- **Rich‑text notes** — a full document editor (TipTap / ProseMirror): headings, lists, checklists, tables, images, links, highlight, text color, and code blocks.
- **Decisions log** — captures the *why*, not just the *what*: context, the chosen path, rejected alternatives, and rationale.
- **File attachments** — uploaded to a **private** Supabase Storage bucket, downloaded via short‑lived **signed URLs**.
- **Activity history** — a read‑only timeline, logged automatically in the service layer on meaningful changes (status change, next‑action change, to‑do added / done, note added, decision added).
- **Collaboration** — invite teammates by e‑mail with **owner / editor / viewer** roles. Access is enforced with membership‑based Row‑Level Security; invite e‑mails are sent from a Supabase Edge Function via Resend.
- **Dark / light theme** — Notion‑ and Obsidian‑inspired design, responsive down to mobile.

---

## 🧱 Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | **Angular 20** (standalone components, signals, new control flow), TypeScript, SCSS |
| Backend / DB | **Supabase** — PostgreSQL, Auth, Row‑Level Security, Storage, Edge Functions (Deno) |
| Rich text | **TipTap** (ProseMirror) |
| Interactions | **Angular CDK** (drag & drop) |
| E‑mail | **Resend** (transactional) |
| Hosting | Static SPA on **Netlify / Cloudflare Pages** |

---

## 🏛️ Architecture

DevNote follows a strict layered architecture so every change stays reviewable and the data source stays swappable:

```
Component / Page (UI)
      ↓ calls only a service
Feature Service (business logic + activity logging)
      ↓ calls only an abstract repository
Repository (abstract contract)
      ↓ implementation bound via Angular DI (useClass)
SupabaseRepository (the single point of DB contact + snake_case ↔ camelCase mapper)
      ↓
Supabase (Postgres + Auth + Storage)
```

Ground rules that are enforced throughout:

- **No component ever calls the database directly** — everything goes through a service → repository.
- **The domain model ≠ the DB row.** Translation lives in a single `toDomain()` mapper; `any` is allowed *only* inside that mapper.
- **The abstract repository is written first**, the Supabase implementation second, wired in `app.config.ts` with `useClass`.
- **Row‑Level Security is enabled on every table.** After collaboration was added, access became membership‑based (`owner` / `editor` / `viewer`) via `SECURITY DEFINER` helper functions to avoid RLS recursion.
- Enums and status labels are defined **once** and reused (DRY).

### Project structure

```
src/app/
  core/
    supabase/       # single SupabaseClient wrapper
    auth/           # auth service + route guard
    theme/          # dark/light theme service
  domain/           # pure models + abstract repositories + services (DB-agnostic)
    project/  todo/  note/  decision/  attachment/  activity/  snapshot/  collaboration/
  data/             # Supabase repository implementations + mappers
  features/
    auth/           # login / sign-up
    projects/       # project list + project detail (the main workspace)
  shared/
    workspace-shell/  # sidebar layout
    rich-editor/      # reusable TipTap editor
db/                 # SQL migrations (schema + RLS)
supabase/functions/ # Edge Functions (invite-member)
```

---

## 🚀 Getting started

### 1. Prerequisites
- Node.js 20+
- A free [Supabase](https://supabase.com) project

### 2. Database
Run the SQL files in [`db/`](db/) in the Supabase **SQL Editor**, in order:
1. Core tables (`projects`, `todos`, `notes`, `decisions`, `attachments`, `activities`) + RLS.
2. [`db/01_collaboration.sql`](db/01_collaboration.sql) — membership + invitations + membership‑based RLS.
3. [`db/02_collaboration_rpc.sql`](db/02_collaboration_rpc.sql) — the members RPC.

Create a **private** Storage bucket named `project-files` and enable the Email auth provider.

### 3. Configure environment
Copy the example file to the two real environment files (they are git‑ignored so your keys never get committed):

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.prod.ts
# then set production: true in environment.prod.ts
```

Fill in your Supabase URL and the **publishable (anon)** key — it's safe to expose in the browser because RLS protects your data. Never use the `service_role` key here.

### 4. Run

```bash
npm install
npm start          # http://localhost:4200
```

### 5. Build & deploy

```bash
npm run build      # outputs dist/devnote/browser
```

Deploy the `dist/devnote/browser` folder to any static host (Netlify / Cloudflare Pages). A `_redirects` file is included for SPA routing. For collaboration e‑mails, deploy the `invite-member` Edge Function and set the `RESEND_API_KEY` and `APP_URL` secrets.

---

## 🗺️ Roadmap

- To‑do priorities + filtering
- Custom domain + verified sending domain for invite e‑mails
- Version notes, roadmap horizons, entity linking

---

Built with care as a portfolio / learning project. Feedback welcome.
