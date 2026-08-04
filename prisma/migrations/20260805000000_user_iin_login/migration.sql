-- IIN is nullable during the legacy-data transition: existing production users
-- must be backfilled from a trusted source, never assigned fabricated identifiers.
-- All newly created login accounts require IIN at the application boundary.
ALTER TABLE "users" ADD COLUMN "iin" VARCHAR(12);

ALTER TABLE "users"
  ADD CONSTRAINT "users_iin_format_check"
  CHECK ("iin" IS NULL OR "iin" ~ '^[0-9]{12}$');

CREATE UNIQUE INDEX "users_iin_key" ON "users"("iin");
