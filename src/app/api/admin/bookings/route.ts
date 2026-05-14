import { NextRequest } from "next/server";
import initDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await initDb();
  const result = await db.execute("SELECT * FROM bookings ORDER BY date DESC, time_slot ASC");
  return Response.json({ bookings: result.rows });
}

export async function PATCH(request: NextRequest) {
  const { id, status } = await request.json();

  if (!id || !status) {
    return Response.json({ error: "ID et statut requis" }, { status: 400 });
  }

  const validStatuses = ["confirmed", "cancelled", "completed"];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: "Statut invalide" }, { status: 400 });
  }

  const db = await initDb();
  const result = await db.execute({
    sql: "UPDATE bookings SET status = ? WHERE id = ?",
    args: [status, id],
  });

  if (result.rowsAffected === 0) {
    return Response.json({ error: "Réservation non trouvée" }, { status: 404 });
  }

  return Response.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: "ID requis" }, { status: 400 });
  }

  const db = await initDb();
  await db.execute({ sql: "DELETE FROM bookings WHERE id = ?", args: [id] });
  return Response.json({ success: true });
}
