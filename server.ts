// deno-lint-ignore-file
import { Application } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import { Client } from "https://deno.land/x/mysql/mod.ts";
import config from "./modules/configuration/config-axiom.ts"; // Rutas de configuración
import login from "./modules/login/login.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { dbConnectionMiddleware } from "./utils/Middleware.ts";

import test from "./modules/configuration/test.ts";
import home_admin from "./modules/admin/home_admin.ts";
import Students from "./modules/students/students.ts";

// Crear la aplicación
const app = new Application();

//cors
app.use(
  oakCors({
    origin: "*", // Puedes restringir a ciertos dominios aquí si lo prefieres
    methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Encabezados permitidos
    optionsSuccessStatus: 200, // Para navegadores antiguos
  })
);


// Aplicar el middleware a todas las rutas excepto los endpoints especificados
app.use(async (ctx, next) => {
  const excludedPaths = ["/config/test/db", "/config/set/state", "/axiom/test"];
  if (excludedPaths.includes(ctx.request.url.pathname)) {
    await next();
  } else {
    await dbConnectionMiddleware(ctx, next);
  }
});

// --------------------------------------- Usar las rutas de configuración (config-axiom.ts)
app.use(test.routes());
app.use(test.allowedMethods());


// --------------------------------------- Usar las rutas de configuración (config-axiom.ts)
app.use(config.routes());
app.use(config.allowedMethods());

// --------------------------------------- Usar las rutas de login (login.ts)
app.use(login.routes());
app.use(login.allowedMethods());
//--------------------------------------- Usar las rutas de Home Admin (home_admin.ts)
app.use(home_admin.routes());
app.use(home_admin.allowedMethods());

//--------------------------------------- Usar las rutas de Students (students.ts)
app.use(Students.routes());
app.use(Students.allowedMethods());

// Función para cargar la configuración desde el archivo JSON
async function loadDatabaseConfig() {
  const data = await Deno.readTextFile("./env/database.json");
  return JSON.parse(data);
}

// Función principal que revisa el estado y conecta si es necesario
async function monitorAndConnect() {
  while (true) {
    try {
      // Cargar la configuración desde el archivo JSON en cada intento
      const { server, port, username, password, database, state } = await loadDatabaseConfig();

      // Imprimir en consola la configuración de la base de datos
      console.log("Credenciales:", { server, port, username, password, database, state });

      if (state === false) {
        console.log("La base de datos no está habilitada. Monitoreando el estado...");
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Espera 3 segundos antes de volver a comprobar
        continue; // Si el estado es falso, vuelve a comprobar en 3 segundos
      }

      // Si el estado es true, intentar conectar a la base de datos
      if (server && username && password && database) {
        const client = await new Client().connect({
          hostname: server,
          username: username,
          db: database,
          password: password,
        });

        // Realizar un SELECT después de la conexión exitosa
        const result = await client.query("SHOW TABLES;");
        if (result.length > 0) {
          console.log("Conexión exitosa a la base de datos.");
          break; // Salir del bucle si la conexión es exitosa
        }
      } else {
        console.error("Faltan configuraciones en el archivo database.json. Verifica tu configuración.");
      }

    } catch (error) {
      console.error("Error al conectar a la base de datos. Reintentando en 5 segundos...");
      console.error(error); // Imprimir todo el objeto de error
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Esperar 5 segundos antes de intentar nuevamente
    }
  }
}

//
// Iniciar la función de monitoreo
monitorAndConnect();

//Iniciar el nodo ipfs

// Iniciar el servidor
await app.listen({ port: 8000 }).catch((err) => {
  console.error("Error al iniciar el servidor", err);
});
