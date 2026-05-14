import { NextRequest } from "next/server";
import bcryptjs from "bcryptjs";
import initDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return Response.json({ error: "Identifiants requis" }, { status: 400 });
  }

  const db = await initDb();
  const result = await db.execute({
    sql: "SELECT * FROM admin WHERE username = ?",
    args: [username],
  });

  const admin = result.rows[0];

  if (!admin || !bcryptjs.compareSync(password, admin.password_hash as string)) {
    return Response.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  const token = Buffer.from(`${admin.username}:${Date.now()}`).toString("base64");

  return Response.json({ token, username: admin.username });
}
