import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DatabaseDiagnosticsPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  let result:
    | { ok: true; counts: Record<string, number> }
    | { ok: false; message: string };
  try {
    const { getDatabaseHealth } = await import("../../../lib/services/database-health.service");
    const health = await getDatabaseHealth();
    result = { ok: true, counts: health.counts };
  } catch (error) {
    result = { ok: false, message: error instanceof Error ? error.message : "Unknown database error" };
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-6 p-8 text-slate-900">
      <h1 className="text-3xl font-bold">PostgreSQL diagnostics</h1>
      {result.ok ? (
        <>
          <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">Connection is healthy.</p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(result.counts).map(([label, value]) => (
              <div className="rounded-xl border border-slate-200 p-4" key={label}>
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="text-2xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <>
          <p className="rounded-xl bg-rose-50 p-4 text-rose-800">Connection failed: {result.message}</p>
          <p>Start PostgreSQL, apply migrations, and seed the database using the commands in README.</p>
        </>
      )}
    </main>
  );
}
