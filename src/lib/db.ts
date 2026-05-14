import { createClient, type Client } from "@libsql/client";
import bcryptjs from "bcryptjs";

let _client: Client | null = null;
let _initialized = false;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:ecolavage.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

async function initDb(): Promise<Client> {
  const client = getClient();
  if (_initialized) return client;

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      address TEXT NOT NULL,
      bin_count INTEGER NOT NULL,
      price REAL NOT NULL,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS blocked_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      reason TEXT
    );

    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);

  const adminCheck = await client.execute("SELECT COUNT(*) as count FROM admin");
  if (Number(adminCheck.rows[0].count) === 0) {
    const hash = bcryptjs.hashSync("ecolavage2026", 10);
    await client.execute({
      sql: "INSERT INTO admin (username, password_hash) VALUES (?, ?)",
      args: ["admin", hash],
    });
  }

  const availCheck = await client.execute("SELECT COUNT(*) as count FROM availability");
  if (Number(availCheck.rows[0].count) === 0) {
    await seedAvailability(client);
  }

  _initialized = true;
  return client;
}

async function seedAvailability(client: Client) {
  const slots = [
    { day: 2, start: "17:00", end: "19:00" },
    { day: 3, start: "13:00", end: "19:00" },
    { day: 4, start: "17:00", end: "19:00" },
    { day: 6, start: "09:00", end: "18:00" },
    { day: 0, start: "09:00", end: "18:00" },
  ];

  for (const slot of slots) {
    await client.execute({
      sql: "INSERT INTO availability (day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, 1)",
      args: [slot.day, slot.start, slot.end],
    });
  }
}

export default initDb;
