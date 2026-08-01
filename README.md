# Happy Town

Happy Town is an English-school management application. The existing frontend remains intact; the repository now also contains a PostgreSQL/Prisma backend foundation for users, students, parents, teachers, curriculum, groups, lessons, attendance, homework, vocabulary, testing, monthly assessments, reviews, learning history, and audit logs.

## Requirements

- Node.js 22.13 or newer
- Docker Desktop with Docker Compose v2
- npm

## Local setup

```powershell
Copy-Item .env.example .env
npm install
npm run db:start
npm run db:migrate
npm run db:seed
npm run dev
```

Open the application at the URL printed by the dev server. In development only, `/dev/database` checks the PostgreSQL connection and shows record counts. It returns 404 in production.

The default values in `.env.example` are local-development credentials. Change all secrets outside local development and never commit `.env`.

## Database commands

| Command | Purpose |
| --- | --- |
| `npm run db:start` | Start the local PostgreSQL container |
| `npm run db:stop` | Stop containers without deleting data |
| `npm run db:reset` | Delete the local database volume and start a clean database |
| `npm run db:generate` | Generate the typed Prisma client |
| `npm run db:migrate` | Apply/create development migrations |
| `npm run db:seed` | Load deterministic, idempotent demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:d1:generate` | Generate legacy D1/Drizzle migrations |

`db:reset` is destructive for the local Docker volume. The seed refuses to run when `NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED=true` is explicitly set.

## Architecture

- `prisma/schema.prisma`: relational domain model and indexes.
- `prisma/migrations`: PostgreSQL DDL, including partial unique indexes and check constraints.
- `prisma/seed.ts`: deterministic demo dataset.
- `lib/db/prisma.ts`: server-only Prisma singleton using the PostgreSQL driver adapter.
- `lib/repositories`: typed read/query boundaries with explicit selections.
- `lib/services`: role checks, transactions, lifecycle rules, history, and audit writes.
- `lib/validators`: Zod input contracts.
- `lib/mappers`: stable DTO shapes for frontend consumers.

Students intentionally are not authentication users. Parents and teachers are `User` records with profiles; parent-to-student, teacher-to-group, course-to-book, and student-to-group links are separate historical entities. Operational records use archive/status fields rather than physical deletion. Derived records use uniqueness constraints to prevent duplicate attendance, homework status, word progress, test results, and monthly assessments.

The existing D1/Drizzle files are retained for compatibility with the current Sites starter. PostgreSQL/Prisma is the authoritative target backend for the new server layer; do not mix both persistence implementations inside one business transaction.

## Quality checks

```powershell
npm run db:generate
npx tsc --noEmit
npm run lint
npm test
```

For a production provider such as Neon or Supabase, use a pooled `DATABASE_URL` supported by the provider and keep migration/administrative connectivity separate when the provider recommends it. Run production migrations from CI with `prisma migrate deploy`; do not run the development migration command in a production runtime.
