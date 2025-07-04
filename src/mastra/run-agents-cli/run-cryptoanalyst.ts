#!/usr/bin/env tsx

import fs from "fs";
import { cryptoanalystOutputSchema } from "../agents/cryptoanalyst-agent.js";
import { mastra } from "../index.js";

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Error: Se requiere el texto cifrado a descifrar");
  console.error("Uso: tsx run-cryptoanalyst.ts <texto-cifrado>");
  console.error(
    'Ejemplo: tsx run-cryptoanalyst.ts "HO VRÑ EUÑOD HQ OD SODCD PDÑRU."'
  );
  console.error("");
  console.error("Ejemplo de archivo:");
  console.error("tsx run-cryptoanalyst.ts --file texto_cifrado.txt");
  process.exit(1);
}

let cipherText: string;

// Check if using file input
if (args[0] === "--file") {
  if (args.length < 2) {
    console.error("Error: Se requiere la ruta del archivo");
    console.error("Uso: tsx run-cryptoanalyst.ts --file <ruta-del-archivo>");
    process.exit(1);
  }

  const filePath = args[1];

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: El archivo ${filePath} no existe`);
    process.exit(1);
  }

  cipherText = fs.readFileSync(filePath, "utf-8").trim();
} else {
  // Use command line argument as cipher text
  cipherText = args.join(" ");
}

if (!cipherText.trim()) {
  console.error("Error: El texto cifrado no puede estar vacío");
  process.exit(1);
}

async function analyzeCipher(cipherText: string) {
  try {
    console.log("🔐 ANÁLISIS CRIPTOGRÁFICO");
    console.log("=".repeat(50));
    console.log(`📝 Texto cifrado: ${cipherText}`);
    console.log("=".repeat(50));

    console.log("\n🤖 Iniciando análisis con el agente criptoanalista...");

    // Get cryptoanalyst agent from Mastra instance (to use telemetry)
    const cryptoanalystAgent = mastra.getAgent("cryptoanalystAgent");

    const result = await cryptoanalystAgent.generate(cipherText, {
      output: cryptoanalystOutputSchema,
    });

    console.log("✅ Análisis completado!\n");

    // Display results in a formatted way
    console.log("🎯 RESULTADOS DEL CRIPTOANÁLISIS:");
    console.log("=".repeat(50));

    const data = result.object;

    if (data) {
      console.log("📄 INFORMACIÓN DEL DESCIFRADO:");
      console.log(`   💬 Texto original: "${data.originalText}"`);
      console.log(`   🔓 Método de cifrado: ${data.encryptionMethod}`);
      console.log(`   📊 Confianza: ${data.confidence}`);

      if (data.additionalInfo) {
        console.log(`   ℹ️  Información adicional: ${data.additionalInfo}`);
      }

      console.log("\n📈 EVALUACIÓN:");
      const confidence =
        typeof data.confidence === "number" ? data.confidence : 0;
      if (confidence >= 7) {
        console.log("   🟢 Alta confianza - Descifrado muy probable");
      } else if (confidence >= 4) {
        console.log("   🟡 Confianza media - Descifrado probable");
      } else if (confidence >= 1) {
        console.log("   🔶 Baja confianza - Descifrado posible");
      } else {
        console.log("   🔴 Muy baja confianza - Revisar resultado");
      }
    } else {
      console.log(
        "❌ No se pudo obtener un resultado estructurado del análisis"
      );
    }

    console.log("\n" + "=".repeat(50));
    console.log("✨ Criptoanálisis completado");
  } catch (error) {
    console.error("❌ Error durante el criptoanálisis:", error);
    process.exit(1);
  }
}

// Run the cipher analysis
analyzeCipher(cipherText).catch((error) => {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
});
