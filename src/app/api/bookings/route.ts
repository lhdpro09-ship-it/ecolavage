import { NextRequest } from "next/server";
import { v4 as uuid } from "uuid";
import initDb from "@/lib/db";
import { getPrice } from "@/lib/pricing";
import { sendClientConfirmation, sendAdminNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await initDb();
  const result = await db.execute("SELECT * FROM bookings ORDER BY date DESC, time_slot ASC");
  return Response.json({ bookings: result.rows });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { client_name, client_email, client_phone, address, bin_count, date, time_slot } = body;

  if (!client_name || !client_email || !client_phone || !address || !bin_count || !date || !time_slot) {
    return Response.json({ error: "Tous les champs sont requis" }, { status: 400 });
  }

  const bins = Number(bin_count);
  if (bins < 1 || bins > 3) {
    return Response.json({ error: "Nombre de bacs invalide" }, { status: 400 });
  }

  const price = getPrice(bins);
  const id = uuid();
  const db = await initDb();

  const existing = await db.execute({
    sql: "SELECT id FROM bookings WHERE date = ? AND time_slot = ? AND status != 'cancelled'",
    args: [date, time_slot],
  });

  if (existing.rows.length > 0) {
    return Response.json({ error: "Ce créneau est déjà réservé" }, { status: 409 });
  }

  await db.execute({
    sql: `INSERT INTO bookings (id, client_name, client_email, client_phone, address, bin_count, price, date, time_slot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, client_name, client_email, client_phone, address, bins, price, date, time_slot],
  });

  // Envoi des emails (on attend avant de répondre, sinon Vercel coupe la fonction)
  const bookingInfo = { id, client_name, client_email, client_phone, address, bin_count: bins, price, date, time_slot };
  try {
    await Promise.all([
      sendClientConfirmation(bookingInfo),
      sendAdminNotification(bookingInfo),
    ]);
  } catch (err) {
    console.error("Email send failed:", err);
  }

  return Response.json({ id, price, status: "confirmed" }, { status: 201 });
}
