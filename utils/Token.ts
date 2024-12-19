import { create } from "https://deno.land/x/djwt/mod.ts";

// Función para crear el token JWT
const createToken = async (userId: number): Promise<string> => {
  const secretKey = "your-secret-key";  // Usa una clave secreta segura (reemplaza por algo más seguro en producción)

  // Payload del JWT
  const payload = {
    sub: userId,  // ID del usuario
    iat: Math.floor(Date.now() / 1000),  // Fecha de emisión (en segundos desde el epoch)
    exp: Math.floor(Date.now() / 1000) + 3600,  // Fecha de expiración (1 hora después)
  };

  // Crear y firmar el token JWT
  const jwt = await create({ alg: "HS256", typ: "JWT" }, payload, secretKey);

  return jwt;  // Retornar el token
};

export { createToken };
