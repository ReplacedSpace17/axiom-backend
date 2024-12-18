import { Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import { searchConfigEnv } from "./Stage1.ts";

const config = new Router();

//---------------------------------------------------------------------- Endpoints de configuración
// Definir el endpoint GET /config/check
config.get("/config/check", async (ctx) => {
    try {
      // Verificar si "axiom_config" está configurado
      const isConfigured = searchConfigEnv("axiom_config");
  
      if (isConfigured) {
        ctx.response.status = 200;
        ctx.response.body = { success: true, message: "Configuración correcta: axiom_config está habilitado." };
      } else {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "Configuración incorrecta: axiom_config no está habilitado." };
      }
    } catch (error) {
      console.error("Error en /config/check:", error);
      ctx.response.status = 500;
      ctx.response.body = { success: false, message: "Error interno al verificar la configuración." };
    }
});

// Definir el endpoint POST /check-database
config.post("/check-database", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    console.log("Datos recibidos:", body);

    // Simula la verificación de la base de datos
    const databaseIsHealthy = true;

    if (databaseIsHealthy) {
      ctx.response.status = 200;
      ctx.response.body = { success: true, message: "La base de datos está operativa." };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { success: false, message: "Error en la base de datos." };
    }
  } catch (error) {
    console.error("Error:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Ocurrió un error en la solicitud." };
  }
});

export default config;
