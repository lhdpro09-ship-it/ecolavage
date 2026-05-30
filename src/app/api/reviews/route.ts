import initDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await initDb();
  const result = await db.execute("SELECT * FROM reviews ORDER BY created_at DESC");
  return Response.json({ reviews: result.rows });
}
