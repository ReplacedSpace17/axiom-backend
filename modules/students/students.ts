import { Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import IPFS from "../../utils/IPFS.ts"; // Correcto: sin las llaves
import BlockChainController from "../../utils/BlockChainController.ts"; // Correcto: sin las llaves
import { dbConnectionMiddleware } from "../../utils/Middleware.ts";
const Students = new Router();

Students.post("/students/experiments/add",dbConnectionMiddleware, async (ctx) => {
  try {
    const client = ctx.state.dbClient;
    const uuid = await crypto.randomUUID();
    const studentDir = `./modules/students/${uuid}`;
    await ensureDir(studentDir);

    // Leer la solicitud de tipo 'form-data'
    const body = await ctx.request.body({ type: "form-data" });
    const formData = await body.value.read({ maxSize: 10_000_000 }); // Máximo 10MB

    //console.log("🔍 **Datos del experimento recibidos:**");
    //console.log(formData.fields.experiment);

    // Procesar el JSON del experimento
    const experimentJson = formData.fields.experiment;
    if (!experimentJson) {
      ctx.response.status = 400;
      ctx.response.body = { error: "No se envió el experimento" };
      return;
    }

    const experiment = JSON.parse(experimentJson);
    let fileNames: string[] = [];

    // Guardar archivos en el servidor
    if (formData.files && formData.files.length > 0) {
      //console.log("\n📂 **Archivos recibidos:**");
      for (let i = 0; i < formData.files.length; i++) {
        const file = formData.files[i];
        const fileName = experiment.files[i].name; // Nombre correcto del archivo
        const filePath = join(studentDir, fileName);
        await Deno.writeFile(filePath, file.content);
        fileNames.push(fileName);
      }
      //console.log(`📂 **Archivos guardados en:** ${studentDir}`);

      // Obtener la configuración del host
      const configFilePath = join(Deno.cwd(), "env", "config_host_requirements.json");

      if (await exists(configFilePath)) {
        try {
          const fileStat = await Deno.stat(configFilePath);
          if (fileStat.isFile) {
            const fileContent = await Deno.readTextFile(configFilePath);
            const configData = JSON.parse(fileContent);

           // console.log("🌍 **host_ipfs_node:**", configData.host_ipfs_node);

            const ipfsHost = configData.host_ipfs_node;
            const ipfsNode = new IPFS(ipfsHost);
            const cid = await ipfsNode.uploadDirectory(studentDir);

            //console.log("\n✅ **Lista de archivos subidos a IPFS:**");
            fileNames.forEach((file) => console.log(`📄 ${file}`));
            //guardar la lista de archivos en listArchivos
            const listArchivos = fileNames;

            console.log(`\n🌍 **Accede a los archivos en:** http://127.0.0.1:8080/ipfs/${cid}`);

            // Si la subida fue exitosa, eliminar la carpeta local
            await Deno.remove(studentDir, { recursive: true });
            //guardar block
            const blockchainController = new BlockChainController();
            const responseblock = await new Promise((resolve) => {
              setTimeout(async () => {
                  const res = await blockchainController.saveCIDtoBlockchain(cid, formData.fields.experiment);
                  resolve(res); // 🔹 Resolver la promesa con el resultado
              }, 1000); // Da tiempo a loadConfig()
          });
          
          console.log("Experimento recibido correctamente", formData.fields.experiment);
          console.log("Guardado en IPFS con CID:", cid);
          // 🔹 Ahora `response` contiene la respuesta del Blockchain Controller
          console.log("📝 **Respuesta final:**", responseblock);
          
          // 🔹 Imprimir el status de la respuesta
          console.log("📝 **Status de la respuesta:**", responseblock.status);

            // Responder con los archivos y el enlace de IPFS
            /*
            ctx.response.body = {
              message: "Experimento recibido correctamente",
              files: fileNames,
              ipfs_url: `http://127.0.0.1:8080/ipfs/${cid}`,
            };*/
            //responder ocn un 500
         // console.log("############################## ", formData.fields.experiment);
          
          // 🔹 Si el status es 200, devuelve la respuesta
          if (responseblock.status === 200) {
           
            /////////////////////////////////////////////
              //responder con el responseblock
              if(responseblock.iscomplited == true){
               
                //guardar en la bd locla
                 ////////////////////////////////////////////////////////777
            const experimentData = JSON.parse(formData.fields.experiment);
            console.log("🔍 **Datos del experimento recibidos:**", responseblock);
            const db_data = {
              acceso_ipfs: responseblock.host,
              titulo: experimentData.title,
              descripcion: experimentData.description,
              etiquetas: JSON.stringify(experimentData.tags), // Convertir array a string
              referencias: JSON.stringify(experimentData.referenceCID), // Convertir array a string
              fecha_creacion: new Date(), // Asegurar que es formato de fecha válido
              cid_ipfs: cid,
              autores: JSON.stringify(experimentData.authors), // Convertir array de objetos a string
              archivos: JSON.stringify(listArchivos), // Convertir array a string
              transaccion: responseblock.transactionHash,
              block: responseblock.blockNumber,
              gasUsed: responseblock.gasUsed,
              maticPrice: responseblock.costInMatic,
              mxnPrice: responseblock.costInMxn
            };
            
            // Nueva consulta SQL con los campos adicionales
            const sql = `
              INSERT INTO Experiments 
              (acceso_ipfs, titulo, descripcion, etiquetas, referencias, fecha_creacion, cid_ipfs, autores, archivos, transaccion, block, gasUsed, maticPrice, mxnPrice) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            // Ejecutar consulta
            await client.query(sql, [
              db_data.acceso_ipfs,
              db_data.titulo,
              db_data.descripcion,
              db_data.etiquetas,
              db_data.referencias,
              db_data.fecha_creacion,
              db_data.cid_ipfs,
              db_data.autores,
              db_data.archivos,
              db_data.transaccion,
              db_data.block,
              db_data.gasUsed,
              db_data.maticPrice,
              db_data.mxnPrice
            ], (err, result) => {
              if (err) {
                console.error("Error insertando en la base de datos:", err);
                return;
              }
              console.log("Inserción exitosa, ID:", result.insertId);
            });
            
            
               
                console.log("📝 **La transacción se completó con éxito.**");

              }
              else{
                console.log(responseblock.message);
              }
              ctx.response.body = responseblock;

          } else {
              ctx.response.body = { error: "La transacción falló", details: response };
          }
          } else {
            console.error("❌ **La ruta de configuración no es un archivo válido.**");
          }
        } catch (error) {
          console.error("❌ **Error al leer o parsear el archivo de configuración:**", error.message);
        }
      } else {
        console.error("❌ **El archivo de configuración no existe.**");
      }
    } else {
      console.log("⚠️ **No se encontraron archivos en la solicitud.**");
    }


  } catch (error) {
    console.error("❌ **Error al procesar la solicitud:**", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Error interno del servidor" };
  }
});

//bajar los experimentos locales
Students.get("/students/experiments/get", dbConnectionMiddleware, async (ctx) => {
  try {
     // Obtener el cliente de la base de datos desde el middleware
     const client = ctx.state.dbClient;

     // Verificar si el usuario ya existe
     const response = await client.query(`
       SELECT * FROM Experiments
     `, []);
     //imprimir la respuesta
     ctx.response.body = response;
      console.log("🔍 **Datos de la base de datos:**", response);
  } catch (error) {
    console.error("❌ **Error al procesar la solicitud:**", error);
   
  }
});

Students.get("/students/experiments/get/:id", dbConnectionMiddleware, async (ctx) => {
  //instanciar el controlador de blockchain
  const blockchainController = new BlockChainController();
  //obtener el id del experimento
  await blockchainController.init();
  const cid = ctx.params.id;
  //obtener el experimento de la blockchain
  const responseblock = await new Promise((resolve) => {
    setTimeout(async () => {
        const res = await blockchainController.getExperimentDataFromBlockchain(cid);
        resolve(res); // 🔹 Resolver la promesa con el resultado
    }, 1000); // Da tiempo a loadConfig()
}
  );


  // 🔹 Ahora `response` contiene la respuesta del Blockchain Controlle
  console.log("📝 **Respuesta final:**", responseblock);
  //respondemos con la respuesta de la blockchain
  ctx.response.body = responseblock;
  
});

Students.get("/students/experiments/getAll/:id", dbConnectionMiddleware, async (ctx) => {
  const blockchainController = new BlockChainController();
  await blockchainController.init();
  
  const initialCid = ctx.params.id;
  const processedCids = new Set(); // Para evitar duplicados
  const listExperimentos = [];

  // Función recursiva para obtener datos de la blockchain
  const fetchExperimentData = async (cid) => {
    if (processedCids.has(cid)) return; // Evita procesar el mismo experimento varias veces
    processedCids.add(cid); // Marca el CID como procesado

    try {
      const responseblock = await new Promise((resolve) => {
        setTimeout(async () => {
          const res = await blockchainController.getExperimentDataFromBlockchain(cid);
          resolve(res);
        }, 1000);
      });

      if (responseblock) {
        listExperimentos.push(responseblock);

        // Procesar referencias recursivamente
        if (Array.isArray(responseblock.referencesCid)) {
          for (const refCid of responseblock.referencesCid) {
            if (refCid !== cid) { // Evitar auto-referencias
              await fetchExperimentData(refCid);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error obteniendo datos del experimento con CID ${cid}:`, error);
    }
  };

  // Iniciar la obtención de datos desde el CID inicial
  await fetchExperimentData(initialCid);

  // Responder con la lista de experimentos
  ctx.response.body = listExperimentos;
});




export default Students;
