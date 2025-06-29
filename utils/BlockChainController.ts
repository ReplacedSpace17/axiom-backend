import { join } from "https://deno.land/std/path/mod.ts";

class BlockChainController {
  private host: string = "";
  private addressWallet: string = "";
  private privateKey: string = "";
  private alchemyApiKey: string = "";
  private ipfsHost: string = "";

  constructor() {
    this.init(); // Carga la configuración al instanciar
  }

  // Método asíncrono para cargar configuración
  private async init() {
    await this.loadConfig();

  }

  // Cargar configuración desde un archivo JSON
  private async loadConfig() {
    try {
      const configFilePath = join(
        Deno.cwd(),
        "env",
        "config_host_requirements.json",
      );
      const fileContent = await Deno.readTextFile(configFilePath);
      const configData = JSON.parse(fileContent);

      this.host = configData.host_blockchain_controller;
      this.addressWallet = configData.addressWallet;
      this.privateKey = configData.privateKey;
      this.alchemyApiKey = configData.alchemyApiKey;
      this.ipfsHost = configData.host_ipfs_node;

      ////console.log("✅ **Configuración cargada correctamente:**");
      //console.log("🌍 host_blockchain_controller:", this.host);
      //console.log("👛 addressWallet:", this.addressWallet);
      //console.log("🔑 privateKey: (Oculto por seguridad)");
      //console.log("🛠️ alchemyApiKey:", this.alchemyApiKey);
    } catch (error) {
      console.error("❌ **Error al leer la configuración:**", error.message);
    }
  }

  // Enviar un POST con el CID y los datos del experimento a la blockchain
  async saveCIDtoBlockchain(cid: string, experiment: string) {
    if (!this.host) {
      console.error(
        "❌ **Host no configurado. Asegúrate de que el archivo JSON sea válido.**",
      );
      return { error: "Host no configurado" }; // Retornar error en caso de fallo
    }

    try {
      const experimentData = JSON.parse(experiment);

      //console.log("🚀 **Datos del Experimento:**");
      Object.keys(experimentData).forEach((key) => {
        //console.log(`🔑 ${key}:`, experimentData[key]);
      });

      const bodyData = {
        cid,
        addressWallet: this.addressWallet,
        privateKey: this.privateKey,
        alchemyApiKey: this.alchemyApiKey,
        host: this.ipfsHost,
        title: experimentData.title || "Título no proporcionado",
        description: experimentData.description ||
          "Descripción no proporcionada",
        authors: experimentData.authors || [],
        tags: experimentData.tags || [],
        referenceCID: experimentData.referenceCID || [],
        date: experimentData.date || new Date().toISOString().split("T")[0],
        timestamp: experimentData.timestamp ||
          new Date().toISOString().split("T")[1].split(".")[0],
      };

      //console.log("🚀 **Enviando a:**", `${this.host}/write/blockchain`);
      //console.log("📦 **Payload enviado:**", bodyData);
      //console.log("host de ipfs", this.ipfsHost);
      const response = await fetch(`${this.host}/write/blockchain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const responseData = await response.json();
      //console.log("✅ **Respuesta del Blockchain Controller:**", responseData);

      return responseData; // 🔹 RETORNAR EL RESPONSE
    } catch (error) {
      console.error("❌ **Error al procesar el experimento:**", error.message);
      return { error: error.message }; // 🔹 RETORNAR EL ERROR
    }
  }

  //Trar los datos de un experimento en blockchain
  async getExperimentDataFromBlockchain(cid: string) {
    //imprimir el valor de host

    if (!this.host) {
      console.error(
        "❌ **Host no configurado. Asegúrate de que el archivo JSON sea válido.**",
      );
      return { error: "Host no configurado" }; // Retornar error en caso de fallo
    }

    try {
      //bajar el id
      
      const response = await fetch(`${this.host}/blockchain/research/${cid}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const responseData = await response.json();
      //console.log("✅ **Respuesta del Blockchain Controller:**", responseData);

      return responseData; // 🔹 RETORNAR EL RESPONSE
    } catch (error) {
      console.error("❌ **Error al obneter el experimento:**", error.message);
      return { error: error.message }; // 🔹 RETORNAR EL ERROR
    }
  }
}

// **Ejemplo de uso**
// const blockchainController = new BlockChainController();
// setTimeout(() => blockchainController.saveCIDtoBlockchain("cidEjemplo", JSON.stringify({ title: "Test", description: "Prueba", authors: [] })), 1000);

export default BlockChainController;
