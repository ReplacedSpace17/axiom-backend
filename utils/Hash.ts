import { hash, compare } from "https://deno.land/x/bcrypt/mod.ts";

// Función para hashear la contraseña
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await hash(password);  // Hashear la contraseña
    return hashedPassword;  // Retornar el hash
  } catch (error) {
    console.error("Error al hashear la contraseña:", error);
    throw new Error("No se pudo hashear la contraseña");
  }
};

// Función para comparar la contraseña con el hash
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    const isMatch = await compare(password, hashedPassword);  // Comparar la contraseña con el hash
    return isMatch;  // Retorna true si coinciden, false si no
  } catch (error) {
    console.error("Error al comparar la contraseña:", error);
    throw new Error("No se pudo comparar la contraseña");
  }
};
