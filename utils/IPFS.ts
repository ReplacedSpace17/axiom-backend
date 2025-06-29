
class IPFS {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  // Método para crear un archivo de prueba
  private async createTestFile() {
    const encoder = new TextEncoder();
    const data = encoder.encode("Hello World!");
    await Deno.writeFile("./test.txt", data);
    console.log("Archivo de prueba creado: test.txt");
  }

  // Método para subir un archivo a IPFS
  async upload(filePath: string): Promise<string> {
    const formData = new FormData();
    const file = await Deno.readFile(filePath);
    const blob = new Blob([file], { type: "application/octet-stream" });
    formData.append("file", blob, filePath);

    // Hacer la solicitud al nodo IPFS local
    const response = await fetch(`${this.apiUrl}/add`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error al subir el archivo a IPFS");
    }

    const data = await response.json();
    const cid = data.Hash;
    console.log(`Archivo agregado a IPFS con CID: ${cid}`);
    console.log(`Accede a tu archivo en: http://127.0.0.1:8080/ipfs/${cid}`);
    return cid;
  }

  // Método de prueba que genera un archivo y lo sube
  async test() {
    const testFilePath = "./test.txt";

    try {
      await this.createTestFile();
      const cid = await this.upload(testFilePath);
      console.log(`CID del archivo de prueba: ${cid}`);
      return cid;
    } catch (error) {
      console.error("Error en el test:", error);
      return null;
    }
  }

  async uploadDirectory(directoryPath: string): Promise<string> {
    const formData = new FormData();
    const files = await this.getFilesInDirectory(directoryPath);
  
    for (const file of files) {
      formData.append("file", file, file.name);
    }
  
    // Subir la carpeta a IPFS con wrap-with-directory=true para obtener un solo CID
    const response = await fetch(`${this.apiUrl}/add?wrap-with-directory=true`, {
      method: "POST",
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error("Error al subir la carpeta a IPFS");
    }
  
    // Extraer el último CID de la respuesta (es el de la carpeta completa)
    const responseText = await response.text();
    const lines = responseText.trim().split("\n");
    const lastLine = JSON.parse(lines[lines.length - 1]);
  
    //console.log(`\n📂 **Carpeta subida a IPFS**`);
    //console.log(`📦 CID de la carpeta: ${lastLine.Hash}`);
    //console.log(`🌍 Accede a los archivos en: http://127.0.0.1:8080/ipfs/${lastLine.Hash}`);
  
    return lastLine.Hash; // Retorna el CID
  }
  

  async getFilesInDirectory(dirPath: string) {
    const files = [];
    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isFile) {
        const filePath = `${dirPath}/${entry.name}`;
        const fileContent = await Deno.readFile(filePath);
        const blob = new Blob([fileContent], { type: "application/octet-stream" });
        files.push(new File([blob], entry.name));
      }
    }
    return files;
  }
}

// Exportar
export default IPFS;
