import { NextRequest } from "next/server";
import initDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await initDb();
  const result = await db.execute(
    "SELECT * FROM blocked_dates ORDER BY date ASC"
  );
  return Response.json({ blockedDates: result.rows });
}

export async function POST(request: NextRequest) {
  const { date, reason } = await request.json();
  if (!date) {
    return Response.json({ error: "Date requise" }, { status: 400 });
  }

  const db = await initDb();
  try {
    await db.execute({
      sql: "INSERT INTO blocked_dates (date, reason) VALUES (?, ?)",
      args: [date, reason || null],
    });
  } catch {
    return Response.json(
      { error: "Cette date est déjà bloquée" },
      { status: 409 }
    );
  }

  return Response.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: "ID requis" }, { status: 400 });
  }

  const db = await initDb();
  await db.execute({ sql: "DELETE FROM blocked_dates WHERE id = ?", args: [id] });
  return Response.json({ success: true });
}
