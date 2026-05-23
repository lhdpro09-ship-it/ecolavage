import { NextRequest } from "next/server";
import initDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const db = await initDb();

  // Si une date est passée, retourner les créneaux bloqués de ce jour
  if (date) {
    const blocked = await db.execute({
      sql: "SELECT id FROM blocked_dates WHERE date = ?",
      args: [date],
    });
    const slots = await db.execute({
      sql: "SELECT id, time_slot FROM blocked_slots WHERE date = ?",
      args: [date],
    });
    const bookings = await db.execute({
      sql: "SELECT time_slot FROM bookings WHERE date = ? AND status != 'cancelled'",
      args: [date],
    });
    return Response.json({
      fullDayBlocked: blocked.rows.length > 0,
      blockedSlots: slots.rows.map((r) => r.time_slot as string),
      bookedSlots: bookings.rows.map((r) => r.time_slot as string),
    });
  }

  // Sinon, retourner toutes les dates bloquées (jours complets + jours avec créneaux bloqués)
  const fullDays = await db.execute(
    "SELECT * FROM blocked_dates ORDER BY date ASC"
  );
  const slotDays = await db.execute(
    "SELECT DISTINCT date FROM blocked_slots ORDER BY date ASC"
  );
  return Response.json({
    blockedDates: fullDays.rows,
    slotDates: slotDays.rows.map((r) => r.date as string),
  });
}

export async function POST(request: NextRequest) {
  const { date, time_slot, block_full_day } = await request.json();
  if (!date) {
    return Response.json({ error: "Date requise" }, { status: 400 });
  }

  const db = await initDb();

  if (block_full_day) {
    // Bloquer toute la journée
    try {
      await db.execute({
        sql: "INSERT INTO blocked_dates (date, reason) VALUES (?, ?)",
        args: [date, "Indisponible"],
      });
    } catch {
      // déjà bloqué
    }
    // Supprimer les créneaux individuels (plus nécessaires)
    await db.execute({
      sql: "DELETE FROM blocked_slots WHERE date = ?",
      args: [date],
    });
  } else if (time_slot) {
    // Bloquer un créneau individuel
    try {
      await db.execute({
        sql: "INSERT INTO blocked_slots (date, time_slot) VALUES (?, ?)",
        args: [date, time_slot],
      });
    } catch {
      // déjà bloqué
    }
  }

  return Response.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { date, time_slot, unblock_full_day } = await request.json();
  if (!date) {
    return Response.json({ error: "Date requise" }, { status: 400 });
  }

  const db = await initDb();

  if (unblock_full_day) {
    await db.execute({
      sql: "DELETE FROM blocked_dates WHERE date = ?",
      args: [date],
    });
    await db.execute({
      sql: "DELETE FROM blocked_slots WHERE date = ?",
      args: [date],
    });
  } else if (time_slot) {
    await db.execute({
      sql: "DELETE FROM blocked_slots WHERE date = ? AND time_slot = ?",
      args: [date, time_slot],
    });
  }

  return Response.json({ success: true });
}
