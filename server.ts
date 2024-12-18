import { Application } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import config from "./modules/configuration/config-axiom.ts"; // Importar el router desde config-axiom.ts
import login from "./modules/login/login.ts";

const app = new Application();

// Usar las rutas de configuración (config-axiom.ts)
app.use(config.routes());
app.use(config.allowedMethods());

//Usar las rutas de login (login.ts)
app.use(login.routes());
app.use(login.allowedMethods());


// Definir un mensaje de bienvenida para rutas no especificadas
app.use((ctx) => {
  ctx.response.body = "¡Hola, Deno!";
});

console.log("Servidor escuchando en http://localhost:8000");
await app.listen({ port: 8000 });
