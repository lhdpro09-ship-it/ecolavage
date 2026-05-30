import { NextRequest } from "next/server";
import initDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { client_name, rating, comment } = await request.json();
  if (!client_name || !rating || !comment) {
    return Response.json({ error: "Tous les champs sont requis" }, { status: 400 });
  }

  const db = await initDb();
  await db.execute({
    sql: "INSERT INTO reviews (client_name, rating, comment) VALUES (?, ?, ?)",
    args: [client_name, rating, comment],
  });

  return Response.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: "ID requis" }, { status: 400 });
  }

  const db = await initDb();
  await db.execute({ sql: "DELETE FROM reviews WHERE id = ?", args: [id] });
  return Response.json({ success: true });
}
