# Heyra — Collaborator Setup Plan (Windows + Claude Code)

Use this as a Claude Code plan: paste it into Claude Code and let it walk you through each step.

---

## Prerequisites

- Git installed and GitHub account with repo access
- Node.js v20+ (LTS) — download from https://nodejs.org
- Claude Code installed
- A terminal: PowerShell, Windows Terminal, or Git Bash

---

## Step 1: Clone the repo

```powershell
git clone https://github.com/steinarsaether-debug/Heyra.git
cd Heyra
npm install
```

## Step 2: Install CLIs

```powershell
npm install -g vercel neonctl
```

## Step 3: Authenticate Vercel

Ask Steinar to invite you to the Vercel team `steinarsaether-8270s-projects` first.

```powershell
vercel login
```

This opens a browser for OAuth. Once authenticated:

```powershell
vercel link
```

Select the existing project `heyra` when prompted.

## Step 4: Pull environment variables

```powershell
vercel env pull .env.local
```

This creates `.env.local` with `DATABASE_URL` (Neon) and `AUTH_SECRET`. This file is gitignored — never commit it.

## Step 5: Generate Prisma client

```powershell
npx prisma generate
```

## Step 6: Verify database connection

```powershell
npx dotenv-cli -e .env.local -- npx prisma db pull --print
```

If this prints the schema, the database connection works.

## Step 7: Run the dev server

```powershell
npm run dev
```

Visit http://localhost:3000/auth/login and test with a demo account:

| Email | Password | Role |
|-------|----------|------|
| admin@heyra.local | HeyraDemo2026! | ADMIN |
| landowner@heyra.local | HeyraDemo2026! | LANDOWNER |
| hunter@heyra.local | HeyraDemo2026! | HUNTER |
| service@heyra.local | HeyraDemo2026! | HUNTER + Service Provider |

## Step 8: Verify build

```powershell
npm run build
npm test
npm run lint
```

All three should pass before pushing any changes.

---

## Workflow: Making changes

1. Create a feature branch: `git checkout -b my-feature`
2. Make changes, test locally
3. Push: `git push origin my-feature`
4. Vercel auto-deploys a preview URL for the branch
5. Create a PR to `main` on GitHub
6. Merging to `main` triggers production deploy to https://heyra.vercel.app

---

## Key commands reference

```powershell
# Development
npm run dev                           # Start local dev server
npm run build                         # Production build
npm test                              # Run tests
npm run lint                          # Lint check

# Database
npm run db:migrate:deploy             # Apply pending migrations
npm run seed:demo                     # Re-seed demo accounts
npx prisma studio                     # Visual DB browser

# Vercel
vercel env pull .env.local            # Refresh env vars
vercel                                # Manual preview deploy
vercel --prod                         # Manual production deploy

# Neon (requires org flag)
neonctl branches list --org-id org-royal-sea-82977069 --project-id bitter-math-00504333
```

---

## Troubleshooting

### "prisma: command not found"
Run `npm install` first — Prisma is a dev dependency.

### Database connection refused
Make sure `.env.local` exists and has the correct `DATABASE_URL`. Re-run `vercel env pull .env.local`.

### Auth errors on login
The `AUTH_SECRET` must match between your `.env.local` and Vercel. Pull fresh env vars with `vercel env pull .env.local`.

### Windows-specific: line ending issues
If you get lint errors about line endings:
```powershell
git config core.autocrlf input
```

### PostGIS / geometry errors
Neon has PostGIS enabled. If you see geometry-related migration errors, they should resolve — Neon supports PostGIS natively.

---

## Access checklist

Before starting, confirm with Steinar that you have:
- [ ] GitHub repo collaborator invite accepted
- [ ] Vercel team invite (steinarsaether-8270s-projects)
- [ ] Neon org invite (Heyra org) — only needed if you want direct DB access via neonctl
