// Ejecuta: npm run create:admins
// Crea/actualiza dos usuarios admin: scliente/scliente123 e invent/invet123

import bcrypt from "bcryptjs";
import { query } from "../src/db.js"; // ajusta la ruta si tu helper está en otro sitio

async function upsertUser(username, password, role = "admin") {
  const hash = await bcrypt.hash(password, 10);

  // IMPORTANTE: que `users.username` sea UNIQUE para que el ON DUPLICATE funcione
  await query(
    `INSERT INTO users (username, password_hash, role)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       role = VALUES(role)`,
    [username, hash, role]
  );

  console.log(`OK  →  ${username} (${role}) creado/actualizado`);
}

(async () => {
  try {
    await upsertUser("scliente", "scliente123", "admin");
    await upsertUser("invent",   "invet123",    "admin");
  } catch (e) {
    console.error("Error creando usuarios:", e);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
})();
