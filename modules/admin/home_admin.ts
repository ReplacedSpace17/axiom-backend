// deno-lint-ignore-file
import { Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import { dbConnectionMiddleware } from "../../utils/Middleware.ts"; // Importa el middleware de conexión a la base de datos

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
//Endpoint para obtener la lista de usuarios
home_admin.get("/su/usuarios", (context) => {
    context.response.body = "Lista de usuarios";
});

//Modificar usuarios
home_admin.put("/su/usuarios", (context) => {
    context.response.body = "Modificar la lista de usuarios";
});
//Eliminar usuarios
home_admin.delete("/su/usuarios", (context) => {
    context.response.body = "Eliminar la lista de usuarios";
});
//Agregar usuarios
home_admin.post("/su/usuarios", (context) => {
    context.response.body = "Agregar usuarios";
});


export default home_admin;