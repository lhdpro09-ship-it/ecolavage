import initDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const db = await initDb();
    await db.execute("UPDATE visits SET count = count + 1 WHERE id = 1");
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}

export async function GET() {
  const db = await initDb();
  const result = await db.execute("SELECT count FROM visits WHERE id = 1");
  const count = result.rows[0]?.count ?? 0;
  return Response.json({ count });
}
