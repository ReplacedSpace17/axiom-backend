// Functions.ts
// Stage 1: Funciones necesarias para la configuración y verificación de la base de datos


const searchConfigEnv = (variable_env: string): boolean => {
/**
 * Busca en las variables de entorno si una clave específica está configurada.
 * @param variable_env Nombre de la variable de entorno a buscar.
 * @returns {boolean} `true` si está configurada y `false` en caso contrario.
*/
    const config = Deno.env.get(variable_env);
    return config === "true";
};

export { searchConfigEnv };
