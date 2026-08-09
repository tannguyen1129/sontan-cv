const fs = require("fs");

function readLocalEnv() {
  if (!fs.existsSync(".env")) return {};
  const values = {};
  for (const rawLine of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator > 0) {
      values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)) {
      values.ADMIN_EMAIL = line;
    }
  }
  return values;
}

const local = readLocalEnv();
const config = {
  supabaseUrl: process.env.SUPABASE_URL || local.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || local.SUPABASE_ANON_KEY || "",
  adminEmail: process.env.ADMIN_EMAIL || local.ADMIN_EMAIL || "",
};

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.warn("Supabase config is incomplete; the gallery will use browser-local storage.");
}

fs.writeFileSync(
  "journey-config.js",
  `window.JOURNEY_CONFIG = ${JSON.stringify(config)};\n`,
  { mode: 0o600 }
);
