import { Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";

const test = new Router();

//---------------------------------------------------------------------- Endpoints de configuración
// Endpoint para el test de conexión a la base de datos -- (1.1)
test.get("/axiom/test", async (ctx) => {
ctx.response.body = { message: "Welcome to AxiomBackend" };
});

export default test;
