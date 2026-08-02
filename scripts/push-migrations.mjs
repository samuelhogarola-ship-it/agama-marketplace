import { spawn } from "node:child_process";
import fs from "node:fs";

if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const password = process.env.SUPABASE_DB_PASSWORD;
const ref = supabaseUrl?.match(/^https:\/\/([^.]+)\.supabase\.co$/)?.[1];

if (!ref || !password) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_DB_PASSWORD.");
}

const dbUrl = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
const child = spawn("supabase", ["db", "push", "--db-url", dbUrl], { stdio: "inherit" });

child.on("exit", (code) => process.exit(code ?? 1));
