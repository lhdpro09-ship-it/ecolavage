import { NextRequest } from "next/server";
import initDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const dateStr = request.nextUrl.searchParams.get("date");
  if (!dateStr) {
    return Response.json({ error: "Date requise" }, { status: 400 });
  }

  const dateObj = new Date(dateStr + "T00:00:00");
  const dayOfWeek = dateObj.getDay();

  const db = await initDb();

  const blocked = await db.execute({
    sql: "SELECT id FROM blocked_dates WHERE date = ?",
    args: [dateStr],
  });
  if (blocked.rows.length > 0) {
    return Response.json({ slots: [] });
  }

  const availResult = await db.execute({
    sql: "SELECT start_time, end_time FROM availability WHERE day_of_week = ? AND is_available = 1",
    args: [dayOfWeek],
  });

  if (availResult.rows.length === 0) {
    return Response.json({ slots: [] });
  }

  const bookingsResult = await db.execute({
    sql: "SELECT time_slot FROM bookings WHERE date = ? AND status != 'cancelled'",
    args: [dateStr],
  });
  const bookedSlots = new Set(bookingsResult.rows.map((b) => b.time_slot as string));

  const blockedSlotsResult = await db.execute({
    sql: "SELECT time_slot FROM blocked_slots WHERE date = ?",
    args: [dateStr],
  });
  const blockedSlotSet = new Set(blockedSlotsResult.rows.map((r) => r.time_slot as string));

  const slots: { start: string; end: string }[] = [];

  for (const avail of availResult.rows) {
    const startTime = avail.start_time as string;
    const endTime = avail.end_time as string;
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    let currentH = startH;
    let currentM = startM;

    while (currentH < endH || (currentH === endH && currentM < endM)) {
      let nextH = currentH + 1;
      let nextM = currentM;
      if (nextH > endH || (nextH === endH && nextM > endM)) {
        nextH = endH;
        nextM = endM;
      }

      const slotStart = `${String(currentH).padStart(2, "0")}:${String(currentM).padStart(2, "0")}`;
      const slotEnd = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
      const slotLabel = `${slotStart} - ${slotEnd}`;

      if (!bookedSlots.has(slotLabel) && !blockedSlotSet.has(slotLabel)) {
        slots.push({ start: slotStart, end: slotEnd });
      }

      currentH = nextH;
      currentM = nextM;
    }
  }

  return Response.json({ slots });
}
