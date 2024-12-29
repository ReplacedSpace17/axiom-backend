import { Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import { Client } from "https://deno.land/x/mysql/mod.ts";
import { hashPassword, comparePassword } from "../../utils/Hash.ts"; // Importa la función de hash
import { dbConnectionMiddleware } from "../../utils/Middleware.ts"; // Importa el middleware de conexión a la base de datos
import {createToken} from "../../utils/Token.ts"; // Importa la función para crear el token

const login = new Router();

// POST /login para autenticar un usuario
login.post("/login/user", dbConnectionMiddleware, async (ctx) => {
  try {
    // Obtener el cuerpo de la solicitud (username y password)
    const requestBody = await ctx.request.body().value;
    const { username, password } = requestBody;

    if (!username || !password) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Missing 'username' or 'password'." };
      return;
    }

    // Obtener el cliente de la base de datos desde el middleware
    const client = ctx.state.dbClient;

    // Buscar el usuario por username en la base de datos
    const users = await client.query(`
      SELECT id, username, password FROM Accounts WHERE username = ?
    `, [username]);

    // Si el usuario no existe
    if (users.length === 0) {
      ctx.response.status = 401;
      ctx.response.body = { message: "Invalid username or password." };
      return;
    }

    // Obtener el usuario y su hash de la base de datos
    const user = users[0];
    const storedHash = user.password;

    // Comparar el hash de la base de datos con la contraseña proporcionada
    const isPasswordValid = await comparePassword(password, storedHash);

    if (!isPasswordValid) {
      ctx.response.status = 401;
      ctx.response.body = { message: "Invalid username or password." };
      return;
    }

    // Si la contraseña es válida, generar un token JWT
    const token = createToken(user.id); // Esta función crea el token con el ID del usuario

    // Devolver el token como respuesta
    ctx.response.status = 200;
    console.log("User logged in:", user.username, 'with id:', user.id, 'and token:', token, 'rol: user');
    ctx.response.body = { message: "Se ha inciado sesión correctamente", token: token, userId: user.id, rol: 'admin' };
  } catch (error) {
    console.error("Error during login:", error);
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error" };
  }
});

export default login;
