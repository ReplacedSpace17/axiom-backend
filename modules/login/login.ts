import { Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";

const login = new Router();

// Definir el endpoint POST /check-database
login.get("/login", async (ctx) => {
  
  ctx.response.body = "¡Hola, jfnr!";
   
});

export default login;
