// middlewares/dbConnectionMiddleware.ts
import { Client } from "https://deno.land/x/mysql/mod.ts";

// Cargar la configuración desde el archivo JSON
async function loadDatabaseConfig() {
  const data = await Deno.readTextFile("./env/database.json");
  return JSON.parse(data);
}

// Middleware para establecer la conexión a la base de datos
const dbConnectionMiddleware = async (ctx: any, next: Function) => {
  const { server, port, username, password, database, state } = await loadDatabaseConfig();

  if (state === true && server && username && password && database) {
    // Crear el cliente de MySQL y conectar
    const client = await new Client().connect({
      hostname: server,
      username: username,
      db: database,
      password: password,
      port: port, // Si el puerto está en la configuración
    });

    // Almacenar la conexión en el contexto
    ctx.state.dbClient = client;

    // Llamar al siguiente middleware o ruta
    await next();

    // Cerrar la conexión después de la respuesta
    client.close();
  } else {
    ctx.response.status = 500;
    ctx.response.body = { message: "Faltan las configuraciones de la base de datos o el estado está deshabilitado." };
  }
};

export { dbConnectionMiddleware };
