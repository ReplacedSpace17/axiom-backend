import { Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import { Client } from "https://deno.land/x/mysql/mod.ts";
import { hashPassword } from "../../utils/Hash.ts"; // Importa la función de hash
import { dbConnectionMiddleware } from "../../utils/Middleware.ts"; // Importa el middleware de conexión a la base de datos

const config = new Router();

//---------------------------------------------------------------------- Endpoints de configuración

// Endpoint para el test de conexión a la base de datos -- (1.1)
config.post("/config/test/db", async (ctx) => {
  var statusSQL= 0;
  try {
    // Recibir los datos de configuración desde el body
    const body = await ctx.request.body().value;
    const { server, port, username, password, database } = body;

    console.log("Configuración de la base de datos (endpoint):", { server, port, username, password, database });

    // Intentar conectar a la base de datos usando los parámetros recibidos
    const client = await new Client().connect({
      hostname: server,
      username: username,
      db: database,
      password: password,
      port: port, // Usar el puerto del body
    });
    const result = await client.query("SHOW TABLES;");
    if (result.length > 0) {
      console.log("---------------------------- Conexion exitosa ----------------------------");
      statusSQL=200;
      ctx.response.body = { success: true, message: "Conexión exitosa a la base de datos." };
    }
    else{
      console.log("---------------------------- Conexion fallida ----------------------------");
      statusSQL=500;
      ctx.response.body = { success: false, message: "Conexión fallida a la base de datos." };
    }
    // Si la conexión es exitosa, cerramos la conexión y respondemos
    await client.close();
    ctx.response.status = statusSQL;
    

  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Error al conectar a la base de datos." };
  }
});

//Cambia el valor del state en el archivo database.json --(1.2)
config.post("/config/set/state", async (ctx) => {
  try {
    // Leer el cuerpo de la solicitud
    const requestBody = await ctx.request.body().value;
    
    // Verificar que los datos recibidos son correctos
    const { server, port, username, password, database } = requestBody;
    if (!server || !port || !username || !password || !database) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Faltan campos necesarios en el cuerpo de la solicitud." };
      return;
    }

    // Ruta del archivo de configuración
    const filePath = "./env/database.json";
    
    // Verificar si el archivo existe
    try {
      await Deno.stat(filePath); // Verifica si el archivo existe
    } catch (error) {
      console.error("El archivo no se encuentra:", error);
      ctx.response.status = 400;
      ctx.response.body = { message: "El archivo de configuración no existe." };
      return;
    }

    // Leer el archivo JSON
    const data = await Deno.readTextFile(filePath);
    const configData = JSON.parse(data);
    //convertir el port de string a int
    const puertoRecibido = parseInt(port);
    // Actualizar los valores en el archivo con los datos recibidos
    configData.server = server;
    configData.port = puertoRecibido;
    configData.username = username;
    configData.password = password;
    configData.database = database;
    configData.state = true; // Cambiar el estado a true

    // Escribir el archivo actualizado
    await Deno.writeTextFile(filePath, JSON.stringify(configData, null, 2));

    // Responder al cliente que la actualización fue exitosa
    ctx.response.status = 200;
    ctx.response.body = { message: "Configuración de la base de datos actualizada correctamente." };
  } catch (error) {
    console.error("Error al actualizar el estado:", error);

    // Detallar el tipo de error
    if (error instanceof Deno.errors.PermissionDenied) {
      ctx.response.status = 403;
      ctx.response.body = { message: "Permiso denegado al intentar modificar el archivo." };
    } else if (error instanceof SyntaxError) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Error de formato en el archivo JSON." };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { message: "Error inesperado al actualizar la configuración." };
    }
  }
});

// Endpoint para obtener las credenciales del super usuario (2.1)
config.post("/config/set/superuser", dbConnectionMiddleware, async (ctx) => {
  try {
    // Obtener el cuerpo de la solicitud {"username": "admin", "password": "admin"}
    const requestBody = await ctx.request.body().value;
    const { username, password } = requestBody;

    if (!username || !password) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Faltan los parámetros 'username' o 'password'." };
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(password);
    
    // Obtener la fecha y hora actual
    // Convertir la fecha a formato MySQL (YYYY-MM-DD HH:MM:SS)
const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');


    // Obtener el cliente de la base de datos desde el middleware
    const client = ctx.state.dbClient;

    // Realizar el INSERT en la base de datos
    const result = await client.query(`
      INSERT INTO Accounts (username, password, role, date_time)
      VALUES (?, ?, ?, ?)
    `, [username, hashedPassword, 'superuser', dateTime]);

    // Verificar si la inserción fue exitosa
    if (result) {
      console.log(">_Nuevo superusuario creado exitosamente.");
      ctx.response.status = 200;
      ctx.response.body = { message: "Superusuario creado exitosamente." };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { message: "Error al crear el superusuario." };
    }
  } catch (error) {
    console.error("Error al procesar las credenciales:", error);
    ctx.response.status = 500;
    ctx.response.body = { message: "Error interno del servidor." };
  }
});

//Endpoint para crear laboratorios (2.2)
config.post("/config/set/laboratory", dbConnectionMiddleware, async (ctx) => {
  try {
    // Obtener el cuerpo de la solicitud {"nombre": "Lab1", "investigador": "Dr. Smith"}
    const requestBody = await ctx.request.body().value;
    const { nombre, investigador } = requestBody;

    if (!nombre || !investigador) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Faltan los parámetros 'nombre' o 'investigador'." };
      return;
    }

    // Obtener la fecha y hora actual
    const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Obtener el cliente de la base de datos desde el middleware
    const client = ctx.state.dbClient;

    // Realizar el INSERT en la base de datos
    const result = await client.query(`
      INSERT INTO Laboratories (nombre, investigador, fecha)
      VALUES (?, ?, ?)
    `, [nombre, investigador, dateTime]);

    // Verificar si la inserción fue exitosa
    if (result) {
      console.log(">_Nuevo laboratorio creado exitosamente.");
      ctx.response.status = 200;
      ctx.response.body = { message: "Laboratorio creado exitosamente." };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { message: "Error al crear el laboratorio." };
    }
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    ctx.response.status = 500;
    ctx.response.body = { message: "Error interno del servidor." };
  }
});

//Endpoint obtener todos los laboratorios (2.3)
config.get("/config/get/laboratories", dbConnectionMiddleware, async (ctx) => {
  try {
    // Obtener el cliente de la base de datos desde el middleware
    const client = ctx.state.dbClient;

    // Realizar la consulta SELECT para obtener todos los laboratorios
    const result = await client.query("SELECT * FROM Laboratories");

    // Verificar si se obtuvieron resultados
    if (result.length > 0) {
      console.log(">_Laboratorios obtenidos exitosamente.");
      ctx.response.status = 200;
      ctx.response.body = { laboratories: result };  // Devolver los laboratorios en el cuerpo de la respuesta
    } else {
      ctx.response.status = 404;
      ctx.response.body = { message: "No se encontraron laboratorios." };
    }
  } catch (error) {
    console.error("Error al obtener los laboratorios:", error);
    ctx.response.status = 500;
    ctx.response.body = { message: "Error interno del servidor." };
  }
});

//Endpoint para crear un nuevo usuario (3.4)
config.post("/config/set/user", dbConnectionMiddleware, async (ctx) => {
  try {
    // Obtener el cuerpo de la solicitud {"username": "admin", "password": "admin", "lab_id": 1}
    const requestBody = await ctx.request.body().value;
    const { username, password, lab_id } = requestBody;

    if (!username || !password || !lab_id) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Faltan los parámetros 'username', 'password' o 'lab_id'." };
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(password);
    
    // Obtener la fecha y hora actual en formato MySQL (YYYY-MM-DD HH:MM:SS)
    const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Obtener el cliente de la base de datos desde el middleware
    const client = ctx.state.dbClient;

    // Realizar el INSERT en la tabla Accounts
    const result = await client.query(`
      INSERT INTO Accounts (username, password, role, date_time)
      VALUES (?, ?, ?, ?)
    `, [username, hashedPassword, 'user', dateTime]);

    // Verificar si la inserción fue exitosa
    if (result) {
      // Obtener el ID del usuario recién insertado
      const { insertId } = result;

      // Realizar el INSERT en la tabla Laboratory_Accounts para la relación
      const relationResult = await client.query(`
        INSERT INTO Laboratory_Accounts (id_laboratory, id_account)
        VALUES (?, ?)
      `, [lab_id, insertId]);

      // Verificar si la relación fue insertada exitosamente
      if (relationResult) {
        console.log(">_Nuevo usuario creado y asociado al laboratorio.");
        ctx.response.status = 200;
        ctx.response.body = { message: "Usuario creado y asociado al laboratorio exitosamente." };
      } else {
        ctx.response.status = 500;
        ctx.response.body = { message: "Error al asociar el usuario al laboratorio." };
      }
    } else {
      ctx.response.status = 500;
      ctx.response.body = { message: "Error al crear el usuario." };
    }
  } catch (error) {
    console.error("Error al procesar las credenciales:", error);
    ctx.response.status = 500;
    ctx.response.body = { message: "Error interno del servidor." };
  }
});

//Endpoint para guardar informacion del instituto (4.1)
config.post("/config/set/institute", dbConnectionMiddleware, async (ctx) => {
  try {
    // Get the request body
    const requestBody = await ctx.request.body().value;

    // Destructure the request body to get the institute details
    const { name, city, state, country } = requestBody;

    // Validate required fields
    if (!name || !city || !state || !country) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Missing required fields: 'name', 'city', 'state', or 'country'." };
      return;
    }

    // Get the current date and time (in MySQL format)
    const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Get the database client from the middleware
    const client = ctx.state.dbClient;

    // Insert the new institute into the database
    const result = await client.query(`
      INSERT INTO Institute (name, city, state, country, date)
      VALUES (?, ?, ?, ?, ?)
    `, [name, city, state, country, dateTime]);

    // Check if the insertion was successful
    if (result) {
      console.log(">_New institute created successfully.");
      ctx.response.status = 200;
      ctx.response.body = { message: "Institute created successfully." };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { message: "Error while creating the institute." };
    }
  } catch (error) {
    console.error("Error while processing the request:", error);
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error." };
  }
});

//test
config.post("/test", dbConnectionMiddleware, async (ctx) => {
  try {
    // Obtener el cliente de la base de datos del contexto
    const client = ctx.state.dbClient;

    // Ejecutar la consulta SHOW TABLES
    const result = await client.query("SHOW TABLES");

    // Verificar si hay tablas en la base de datos
    if (result.length > 0) {
      ctx.response.status = 200;
      ctx.response.body = { message: "Conexión exitosa. Tablas en la base de datos:", tables: result };
    } else {
      ctx.response.status = 200;
      ctx.response.body = { message: "Conexión exitosa. No hay tablas en la base de datos." };
    }
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error);
    ctx.response.status = 500;
    ctx.response.body = { message: "Error al ejecutar la consulta SHOW TABLES." };
  }
});

export default config;
