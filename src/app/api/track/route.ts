import initDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const db = await initDb();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    await db.execute("UPDATE visits SET count = count + 1 WHERE id = 1");
    await db.execute({
      sql: "INSERT INTO visit_days (date, count) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET count = count + 1",
      args: [today],
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}

export async function GET() {
  const db = await initDb();
  const total = await db.execute("SELECT count FROM visits WHERE id = 1");
  const days = await db.execute(
    "SELECT date, count FROM visit_days ORDER BY date DESC LIMIT 60"
  );
  return Response.json({
    count: total.rows[0]?.count ?? 0,
    days: days.rows,
  });
}
