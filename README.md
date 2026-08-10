# Happy Town

Happy Town is a Next.js application for managing an English school. PostgreSQL is the authoritative datastore; Prisma owns the schema, migrations and server-side data access. The admin portal provides persistent CRUD for parents, teachers, students and groups, including historical links and soft archive/restore.

## Requirements

- Node.js 24.16.0 (pinned in `.nvmrc` and `.node-version`)
- Docker Desktop with Docker Compose v2
- npm 11.13.0

## First local run

```bash
# Copy .env.example to .env, then fill every required local value
# (database URLs, Auth.js secret and all SEED_* credentials) before continuing.
cp .env.example .env
nvm use
npm ci
npm run db:start
npm run db:migrate
npm run db:seed
npm run db:check
npm run dev
```

Open `http://localhost:3000`. The seed creates one local login for each of ADMIN, TEACHER and PARENT using only the `SEED_*` values provided in `.env`. Use synthetic development identifiers only; never reuse credentials outside local development and never commit `.env`.

Always commit `package-lock.json` and use `npm ci` after cloning or pulling. The project bundles its own Inter font, pins the Node/npm toolchain and normalizes mobile viewport behavior, so text metrics and responsive breakpoints do not depend on the operating system. GitHub Actions verifies linting, types, tests and the production build on every push and pull request.

`/dev/database` is an ADMIN-only connection/count diagnostic in development and returns 404 in production.

## Database lifecycle

| Command | Purpose |
| --- | --- |
| `npm run db:start` | Start PostgreSQL and wait for its health check |
| `npm run db:stop` | Stop containers without deleting the named volume |
| `npm run db:reset` | **Destructive:** delete the local volume and start an empty database |
| `npm run db:migrate` | Create/apply development migrations |
| `npx prisma migrate deploy` | Apply committed migrations in CI/production |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:seed` | Load deterministic, idempotent development data |
| `npm run db:check` | Verify connection and print safe table counts (no password/URL) |
| `npm run db:studio` | Inspect the same PostgreSQL database with Prisma Studio |

Normal `docker compose down` and `npm run db:stop` preserve data in the `happy-town-postgres-data` named volume. Only `npm run db:reset` removes it. Seed refuses to run when `NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED=true` is explicitly supplied.

## Authentication and authorization

- Auth.js Credentials normalizes and verifies a 12-digit IIN/password pair on the server with bcrypt hashes. Email remains contact information and cannot be used as a login.
- Sessions and JWTs contain only the user id, name, contact email and role; IIN, raw passwords and hashes never reach the client.
- Protected pages validate the session and role on the server. Admin mutation routes independently require ADMIN and do not trust a client-supplied actor.
- Parent/student and teacher/group/student reads apply server-side ownership checks and return safe 401/403/404 responses.
- Login attempts, CRUD operations and relation changes write audit records without IINs, passwords or tokens. Login failures use a hashed, in-memory rate-limit key.

The IIN migration is intentionally staged for production safety: legacy rows may remain `NULL` until an administrator backfills verified identifiers from a trusted source. New ADMIN, TEACHER and PARENT accounts require a unique 12-digit IIN. Do not fabricate identifiers for existing users.
- The old demo role switcher is disabled; users must sign out and authenticate as another account.

## Architecture

- `prisma/schema.prisma` — relational domain model, enums, indexes and lifecycle fields.
- `prisma/migrations` — committed PostgreSQL migrations.
- `prisma/seed.ts` — deterministic, idempotent data and hashed development accounts.
- `lib/db/prisma.ts` — server-only Prisma singleton.
- `lib/repositories` — explicit selections, filtering, sorting and pagination.
- `lib/services` — transactions, authorization, archive/restore, relationship history and audit logging.
- `app/api` — protected route handlers with normalized safe errors.

Students intentionally are not authentication users. Parents and teachers are users with profiles. Parent/student, teacher/group and student/group associations are separate historical rows. Operational data uses status/archive fields instead of physical deletion.

The legacy D1/Drizzle files remain for compatibility with the original Sites starter, but must not be mixed with PostgreSQL inside a business transaction. Local development and the Vercel-oriented build use the standard Next.js Node runtime because Prisma's query engine is not compatible with the Vinext/Cloudflare Worker runtime.

## Hosted PostgreSQL and Vercel preparation

For Neon, Supabase or another managed provider:

1. Set `DATABASE_URL` to the runtime URL (pooled when recommended).
2. Set `DIRECT_URL` to the provider's direct connection for Prisma migrations. `prisma.config.ts` prefers it when present.
3. Generate a strong `AUTH_SECRET`, set `NEXT_PUBLIC_APP_URL` to the HTTPS application origin and use secure provider secrets.
4. Run `npx prisma migrate deploy` from CI or a controlled release job; never run `prisma migrate dev` in a production runtime.
5. Do not run the development seed against production.

Production deployment is intentionally outside the current implementation stage.

## Verification

```bash
docker compose config --quiet
npm run db:generate
npm run db:check
npm run verify:access
npm run lint
npm run typecheck
npm test
npm run build
```

The persistence acceptance check is: create through the UI, reload, restart Next.js, restart the PostgreSQL container without removing its volume, then confirm the same row via the UI and Prisma/SQL. Archive and restore should preserve its id and history.
