import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

// Generar una clave HMAC segura
async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-512" },
    true, // La clave será exportable
    ["sign", "verify"]
  );
}

// Función para crear un token
export async function createToken(userId: string) {
  const key = await generateKey(); // Generamos la clave HMAC
  const payload = {
    sub: userId, // 'sub' (subject) se usa comúnmente para almacenar el ID del usuario
    iat: getNumericDate(new Date()), // Fecha de emisión en formato NumericDate
    exp: getNumericDate(60 * 60), // El token expira en 1 hora
  };

  const header = { alg: "HS512", typ: "JWT" };
  const jwt = await create(header, payload, key); // Generamos el token JWT
  return jwt;
}

// Función para verificar un token
export async function verifyToken(token: string) {
  const key = await generateKey(); // Usamos la misma clave HMAC para verificar el token
  try {
    const decoded = await verify(token, key); // Verificamos el token
    return decoded; // Retornamos el payload decodificado
  } catch (error) {
    console.error("Error de verificación de token:", error);
    throw new Error("Token inválido o expirado");
  }
}
