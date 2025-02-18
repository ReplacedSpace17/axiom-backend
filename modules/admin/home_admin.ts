// deno-lint-ignore-file
import { Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import { dbConnectionMiddleware } from "../../utils/Middleware.ts"; // Importa el middleware de conexión a la base de datos
import {hashPassword} from "../../utils/Hash.ts"; // Importa la función para hashear contraseñas
const home_admin = new Router();

//------------------------------------------------- LABORAORIOS -------------------------------------------------
//Endpoint para obtener la lista de laboratorios
home_admin.get("/su/laboratorios", async (context) => {
    try {
        // Obtener el cliente de la base de datos desde el middleware
        const client = context.state.dbClient;

        // Obtener todos los laboratorios
        const laboratories = await client.query("SELECT * FROM Laboratories;");

        // Construir la respuesta incluyendo los estudiantes de cada laboratorio
        const enrichedLaboratories = await Promise.all(
            laboratories.map(async (lab: { id: any; }) => {
                // Obtener los estudiantes asociados al laboratorio
                const students = await client.query(
                    `
                    SELECT Accounts.id, Accounts.username, Accounts.role, Accounts.date_time
                    FROM Laboratory_Accounts
                    INNER JOIN Accounts ON Laboratory_Accounts.id_account = Accounts.id
                    WHERE Laboratory_Accounts.id_laboratory = ? AND Accounts.role = 'user';
                    `,
                    [lab.id]
                );

                // Agregar la clave "estudiantes" con la lista obtenida
                return {
                    ...lab,
                    estudiantes: students,
                };
            })
        );

        // Enviar la lista de laboratorios enriquecida en la respuesta
        context.response.body = enrichedLaboratories;
    } catch (e) {
        console.error("Error al obtener la lista de laboratorios:", e);
        context.response.status = 500;
        context.response.body = { error: "Error interno del servidor" };
    }
});

home_admin.put("/su/laboratorios", async (context) => {
    try {
        // Obtener el cuerpo de la solicitud
        const { id, nombre, investigador } = await context.request.body().value;

        // Validar los datos recibidos
        if (!id || !nombre || !investigador) {
            context.response.status = 400;
            context.response.body = { error: "Faltan datos requeridos (id, nombre, investigador)." };
            return;
        }

        // Obtener el cliente de la base de datos desde el middleware
        const client = context.state.dbClient;

        // Actualizar el laboratorio en la base de datos
        const result = await client.execute(
            "UPDATE Laboratories SET nombre = ?, investigador = ? WHERE id = ?;",
            [nombre, investigador, id]
        );

        // Verificar si la actualización afectó alguna fila
        if (result.affectedRows === 0) {
            context.response.status = 404;
            context.response.body = { error: "No se encontró un laboratorio con el ID proporcionado." };
            return;
        }

        // Responder con éxito
        context.response.status = 200;
        context.response.body = { message: "Laboratorio actualizado exitosamente." };
    } catch (e) {
        console.error("Error al modificar el laboratorio:", e);
        context.response.status = 500;
        context.response.body = { error: "Error interno del servidor." };
    }
});

home_admin.delete("/su/laboratorios", async (context) => {
    try {
        // Obtener el ID del laboratorio del cuerpo de la solicitud
        const { id } = await context.request.body().value;

        if (!id) {
            context.response.status = 400;
            context.response.body = { error: "Se requiere un ID de laboratorio." };
            return;
        }

        // Obtener el cliente de la base de datos desde el middleware
        const client = context.state.dbClient;

        // Iniciar una transacción para garantizar consistencia
        await client.beginTransaction();

        // Eliminar las asociaciones en la tabla Laboratory_Accounts
        await client.execute("DELETE FROM Laboratory_Accounts WHERE id_laboratory = ?;", [id]);

        // Eliminar el laboratorio de la tabla Laboratories
        const result = await client.execute("DELETE FROM Laboratories WHERE id = ?;", [id]);

        // Confirmar la transacción
        await client.commit();

        if (result.affectedRows > 0) {
            context.response.status = 200;
            context.response.body = { message: `Laboratorio con ID ${id} eliminado correctamente.` };
        } else {
            context.response.status = 404;
            context.response.body = { error: `Laboratorio con ID ${id} no encontrado.` };
        }
    } catch (e) {
        console.error("Error al eliminar el laboratorio:", e);
        context.response.status = 500;
        context.response.body = { error: "Error interno del servidor." };

        // Revertir la transacción en caso de error
        if (context.state.dbClient) {
            await context.state.dbClient.rollback();
        }
    }
});


home_admin.post("/su/laboratorios", async (context) => {
    try {
        // Obtener los datos del cuerpo de la solicitud
        const { nombre, investigador } = await context.request.body().value;

        // Validar que los campos requeridos estén presentes
        if (!nombre || !investigador) {
            context.response.status = 400;
            context.response.body = { error: "Los campos 'nombre' e 'investigador' son obligatorios." };
            return;
        }

        // Obtener el cliente de la base de datos desde el middleware
        const client = context.state.dbClient;

        // Insertar el nuevo laboratorio en la base de datos
        const result = await client.execute(
            "INSERT INTO Laboratories (nombre, investigador) VALUES (?, ?);",
            [nombre, investigador]
        );

        // Verificar que el laboratorio fue agregado correctamente
        if (result.affectedRows > 0) {
            context.response.status = 201; // Código HTTP para creación exitosa
            context.response.body = {
                message: "Laboratorio agregado correctamente.",
                laboratorio: {
                    id: result.lastInsertId,
                    nombre,
                    investigador
                }
            };
        } else {
            context.response.status = 500;
            context.response.body = { error: "Error al agregar el laboratorio." };
        }
    } catch (e) {
        console.error("Error al agregar el laboratorio:", e);
        context.response.status = 500;
        context.response.body = { error: "Error interno del servidor." };
    }
});

//------------------------------------------------- USUARIOS -------------------------------------------------
home_admin.get("/su/usuarios", dbConnectionMiddleware, async (ctx) => {
    try {
      // Obtener el cliente de la base de datos desde el middleware
      const client = ctx.state.dbClient;
  
      // Consultar los usuarios con sus laboratorios
      const users = await client.query(`
        SELECT A.id, A.username, A.date_time, L.nombre as laboratorio, L.id AS lab_id
        FROM Accounts A
        JOIN Laboratory_Accounts LA ON A.id = LA.id_account
        JOIN Laboratories L ON LA.id_laboratory = L.id
      `);
  
      if (users.length === 0) {
        ctx.response.status = 404;
        ctx.response.body = { message: "No se encontraron usuarios." };
        return;
      }
  
      // Enviar la respuesta con los usuarios
      ctx.response.status = 200;
      ctx.response.body = { usuarios: users };
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
      ctx.response.status = 500;
      ctx.response.body = { message: "Error interno del servidor." };
    }
  });
  

//Modificar usuarios
home_admin.put("/su/usuarios", (context) => {
    context.response.body = "Modificar la lista de usuarios";
});

//Eliminar usuarios
home_admin.delete("/su/usuarios/:id", dbConnectionMiddleware, async (ctx) => {
  const { id } = ctx.params; // Obtener el id desde los parámetros de la URL
  const client = ctx.state.dbClient;

  try {
      // Eliminar la relación entre el estudiante y los laboratorios
      await client.query("DELETE FROM Laboratory_Accounts WHERE id_account = ?", [id]);

      // Eliminar el estudiante de la tabla Students
      await client.query("DELETE FROM Students WHERE id_accounts = ?", [id]);

      // Eliminar la cuenta del estudiante en la tabla Accounts
      const result = await client.query("DELETE FROM Accounts WHERE id = ?", [id]);

      // Verificar si se eliminó la cuenta
      if (result.affectedRows === 0) {
          ctx.response.status = 404;
          ctx.response.body = { message: "No se encontró el usuario con el id proporcionado" };
          return;
      }

      ctx.response.status = 200;
      ctx.response.body = { message: "Estudiante y cuenta eliminados con éxito" };
  } catch (error) {
      console.error("Error eliminando el estudiante:", error);
      ctx.response.status = 500;
      ctx.response.body = { message: "Error en el servidor al eliminar el estudiante" };
  }
});



//Endpoint para crear un nuevo usuario (4.1)
home_admin.post("/su/usuarios", dbConnectionMiddleware, async (ctx) => {
  try {
    // Obtener el cuerpo de la solicitud {"username": "admin", "password": "admin", "lab_id": 1}
    const requestBody = await ctx.request.body().value;
    const { username, password, lab_id } = requestBody;

    console.log("Cuerpo de la solicitud:", { username, password, lab_id });

    if (!username || !password || !lab_id) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Faltan los parámetros 'username', 'password' o 'lab_id'." };
      return;
    }

    // Obtener el cliente de la base de datos desde el middleware
    const client = ctx.state.dbClient;

    // Verificar si el usuario ya existe
    const existingUser = await client.query(`
      SELECT * FROM Accounts WHERE username = ?
    `, [username]);

    if (existingUser.length > 0) {
      ctx.response.status = 409; // HTTP 409 Conflict
      ctx.response.body = { message: `El usuario '${username}' ya existe.` };
      console.log(">_El usuario ya existe.");
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(password);

    // Obtener la fecha y hora actual en formato MySQL (YYYY-MM-DD HH:MM:SS)
    const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Imprimir valores a guardar
    console.log("Valores a guardar:", { username, hashedPassword, lab_id, dateTime });

    // Realizar el INSERT en la tabla Accounts
    const result = await client.query(`
      INSERT INTO Accounts (username, password, role, date_time)
      VALUES (?, ?, ?, ?)
    `, [username, hashedPassword, 'user', dateTime]);

    // Verificar si la inserción fue exitosa
    if (result) {
      const [newUser] = await client.query(`
        SELECT * FROM Accounts WHERE id = LAST_INSERT_ID()
      `);
      const { id } = newUser;

      console.log("ID del usuario insertado:", id);

      // Realizar el INSERT en la tabla Laboratory_Accounts para la relación
      const relationResult = await client.query(`
        INSERT INTO Laboratory_Accounts (id_laboratory, id_account)
        VALUES (?, ?)
      `, [lab_id, id]);

      // Verificar si la relación fue insertada exitosamente
      if (relationResult) {
        console.log(">_Nuevo usuario creado y asociado al laboratorio.");
        ctx.response.status = 200;
        ctx.response.body = {
          message: "Usuario creado y asociado al laboratorio exitosamente.",
          usuario: { id, username, lab_id, dateTime },
        };
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

export default home_admin;