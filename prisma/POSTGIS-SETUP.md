## PostgreSQL Setup Instructions

1. **Install PostGIS**:
   ```sql
   CREATE EXTENSION postgis;
   ```

2. **Verify Installation**:
   ```sql
   SELECT PostGIS_Version();
   ```

3. **Database Connection**:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/heyra?schema=public"
   ```