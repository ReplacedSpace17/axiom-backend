import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

// Define una clave HMAC segura y estática
const SECRET_KEY = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("your-secure-secret-key"), // Cambia esto por una clave segura
  { name: "HMAC", hash: "SHA-512" },
  false, // No se puede exportar
  ["sign", "verify"]
);

// Función para crear un token
export async function createToken(userId: string) {
  const payload = {
    sub: userId, // 'sub' (subject) almacena el ID del usuario
    iat: getNumericDate(new Date()), // Fecha de emisión
    exp: getNumericDate(60 * 60), // Expira en 1 hora
  };

  const header = { alg: "HS512", typ: "JWT" };
  const jwt = await create(header, payload, SECRET_KEY); // Genera el token JWT
  return jwt;
}

// Función para verificar un token
export async function verifyToken(token: string) {
  try {
    const decoded = await verify(token, SECRET_KEY); // Verifica el token
    return decoded; // Retorna el payload decodificado
  } catch (error) {
    console.error("Error de verificación de token:", error);
    throw new Error("Token inválido o expirado");
  }
}
