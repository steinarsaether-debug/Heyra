# Heyra - Critical Project Information

## Deployment

| Item | Value |
|------|-------|
| Live URL | https://heyra.vercel.app |
| Vercel Project | steinarsaether-8270s-projects/heyra |
| Vercel Production Branch | main |
| Preview Branch | codex-heyra-phase1-foundation |
| GitHub Repo | steinarsaether-debug/Heyra |

## Service Access

### Vercel (Hosting & Deployments)

| Item | Value |
|------|-------|
| Team | steinarsaether-8270s-projects |
| Dashboard | https://vercel.com/steinarsaether-8270s-projects/heyra |
| Settings | https://vercel.com/steinarsaether-8270s-projects/heyra/settings |
| Env Vars | https://vercel.com/steinarsaether-8270s-projects/heyra/settings/environment-variables |

**CLI authentication:**
```bash
npm install -g vercel          # Install CLI
vercel login                   # Authenticate (opens browser)
vercel link                    # Link local repo to project (select "heyra")
vercel env pull .env.local     # Pull DATABASE_URL + AUTH_SECRET locally
```

### Neon (PostgreSQL Database)

| Item | Value |
|------|-------|
| Org | Heyra |
| Org ID | org-royal-sea-82977069 |
| Project ID | bitter-math-00504333 |
| Dashboard | https://console.neon.tech/app/projects/bitter-math-00504333 |
| Compute Endpoint | ep-wandering-butterfly-a13gdnn9 |
| Region | aws-eu-central-1 |
| Compute Size | 0.25 – 2 CU (autoscaling) |

**CLI authentication:**
```bash
npm install -g neonctl          # Install CLI
neonctl auth                    # Authenticate (opens browser)

# All commands require org + project flags:
neonctl branches list --org-id org-royal-sea-82977069 --project-id bitter-math-00504333
neonctl databases list --org-id org-royal-sea-82977069 --project-id bitter-math-00504333 --branch production
```

> **Note:** Direct Neon CLI access requires an invite to the Heyra org. For most work, pulling env vars via `vercel env pull` is sufficient — the `DATABASE_URL` connects directly to Neon.

---

## Demo Accounts

Password for all: `HeyraDemo2026!`

| Email | Role | Notes |
|-------|------|-------|
| admin@heyra.local | ADMIN | Full admin access |
| landowner@heyra.local | LANDOWNER | Property management |
| hunter@heyra.local | HUNTER | Booking & hunting |
| service@heyra.local | HUNTER | + Approved ServiceProvider "Fjellklar Service" in Voss |

## Auth

- NextAuth v4.24.13 with Credentials provider (email/password)
- JWT session strategy
- bcryptjs (12 rounds) for password hashing
- Requires `AUTH_SECRET` and `DATABASE_URL` env vars

## Key Commands

```bash
# Deploy pipeline
git push origin <branch>              # Triggers Vercel preview deploy
git push origin main                  # Triggers Vercel production deploy

# Database
npm run db:migrate:deploy             # Apply migrations to production DB
npm run seed:demo                     # Seed demo accounts
npm run db:migrate:dev                # Create new migration (local dev)

# Development
npm run dev                           # Local dev server
npm run build                         # Production build
npm test                              # Run tests
npm run lint                          # Lint

# CLIs
vercel env pull .env.local            # Pull production env vars locally
neonctl branches list                 # List Neon branches
```

## Environment Variables (Required in Vercel)

| Variable | Description |
|----------|-------------|
| DATABASE_URL | Neon PostgreSQL connection string (pooled, with `?sslmode=require`) |
| AUTH_SECRET | Random secret for NextAuth JWT signing |

### Environment Variable Flow

```
Vercel Dashboard (Settings → Env Vars)
  ↓  vercel env pull .env.local
Local .env.local (gitignored — NEVER commit)
  ↓  read by Next.js + Prisma at runtime
App (dev server / build)
```

- **Production/Preview:** Vercel injects env vars automatically at build and runtime.
- **Local dev:** Run `vercel env pull .env.local` to sync. The file is gitignored.
- **CI:** Vercel handles env vars for deployments. No manual setup needed.
- **Prisma:** Reads `DATABASE_URL` from the environment. No separate Prisma `.env` or `prisma/.env.local` should be used when `.env.local` exists.
- **Source of truth:** Treat `.env.local` as the only local DB/auth source of truth to avoid drifting Neon endpoints across files.

---

## Collaborator Onboarding

See [docs/COLLABORATOR-SETUP.md](./COLLABORATOR-SETUP.md) for the full step-by-step guide.

**Access checklist (project owner must send invites):**
- [ ] GitHub — collaborator invite to `steinarsaether-debug/Heyra`
- [ ] Vercel — team member invite to `steinarsaether-8270s-projects`
- [ ] Neon — org member invite to `Heyra` (optional, only for direct DB CLI access)
