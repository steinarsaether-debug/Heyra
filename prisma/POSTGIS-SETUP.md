## PostgreSQL Setup Instructions

### Recommended Local Workflow

1. Use the root `.env` file for Prisma CLI commands.
2. Start the local PostGIS database:
   ```bash
   docker compose up -d db
   ```
3. Generate the Prisma client:
   ```bash
   npm run db:generate
   ```
4. Apply migrations:
   ```bash
   npm run db:migrate:dev
   ```

### PostGIS Verification

Run this after the container is up:

```sql
SELECT PostGIS_Version();
```

The initial migration also creates the extension automatically with:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Database Connection

```env
DATABASE_URL="postgresql://heyra:localdev@localhost:5434/heyra?schema=public"
```
