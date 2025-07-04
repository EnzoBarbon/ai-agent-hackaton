#!/usr/bin/env tsx

import fs from "fs";
import { extname } from "path";
import {
  hashDetectionAgent,
  hashDetectionOutputSchema,
} from "../agents/hash-detection-agent";

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Error: Se requiere la ruta del archivo de texto");
  console.error("Uso: tsx run-hash-detection.ts <ruta-del-archivo>");
  console.error("Ejemplo: tsx run-hash-detection.ts ./malware-analysis.txt");
  console.error("\nFormatos soportados:");
  console.error("  .txt - Archivos de texto plano");
  console.error("  .md  - Archivos Markdown");
  console.error("  .log - Archivos de log");
  console.error("\nEjemplos de uso:");
  console.error('  tsx run-hash-detection.ts "./analisis-malware.txt"');
  console.error('  tsx run-hash-detection.ts "./forensic-report.md"');
  console.error('  tsx run-hash-detection.ts "./security-analysis.log"');
  process.exit(1);
}

const filePath = args[0];

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: El archivo ${filePath} no existe`);
  process.exit(1);
}

// Check if file is a supported text format
const fileExtension = extname(filePath).toLowerCase();
const supportedExtensions = [".txt", ".md", ".log", ".text"];
if (!supportedExtensions.includes(fileExtension)) {
  console.error(`Error: Formato de archivo no soportado: ${fileExtension}`);
  console.error(`Formatos soportados: ${supportedExtensions.join(", ")}`);
  process.exit(1);
}

async function main() {
  try {
    console.log("🔐 DETECCIÓN Y CLASIFICACIÓN DE HASHES");
    console.log("=".repeat(70));
    console.log(`📄 Archivo: ${filePath}`);
    console.log("=".repeat(70));

    // Read file content
    const fileContent = fs.readFileSync(filePath, "utf-8");

    if (!fileContent.trim()) {
      console.error("Error: El archivo está vacío");
      process.exit(1);
    }

    console.log(
      "🤖 Analizando contenido con el agente de detección de hashes..."
    );

    // Run the hash detection agent
    const result = await hashDetectionAgent.generate(fileContent, {
      output: hashDetectionOutputSchema,
    });

    const detectedHashes = result.object;

    // Display results
    console.log("\n" + "=".repeat(70));
    console.log("📊 HASHES DETECTADOS Y CLASIFICADOS:");
    console.log("=".repeat(70));

    // Group hashes by type for better display
    const hashGroups: Record<string, string[]> = {};
    detectedHashes.hashes.forEach((hash) => {
      if (!hashGroups[hash.tipo]) {
        hashGroups[hash.tipo] = [];
      }
      hashGroups[hash.tipo].push(hash.valor);
    });

    if (detectedHashes.hashes.length === 0) {
      console.log("❌ No se encontraron hashes en el archivo");
    } else {
      // Display each hash type group
      Object.entries(hashGroups).forEach(([tipo, valores]) => {
        console.log(`\n🔹 ${tipo} (${valores.length}):`);
        valores.forEach((valor, index) => {
          // Truncate very long hashes for display
          const displayValue =
            valor.length > 80
              ? `${valor.substring(0, 40)}...${valor.substring(valor.length - 20)}`
              : valor;
          console.log(`   ${index + 1}. ${displayValue}`);
        });
      });

      // Display detailed breakdown
      console.log("\n" + "=".repeat(70));
      console.log("📈 DESGLOSE DETALLADO:");
      console.log("=".repeat(70));

      const typeCounts = {
        MD5: hashGroups["MD5"]?.length || 0,
        "SHA-1": hashGroups["SHA-1"]?.length || 0,
        "SHA-256": hashGroups["SHA-256"]?.length || 0,
        "SHA-512": hashGroups["SHA-512"]?.length || 0,
        ssdeep: hashGroups["ssdeep"]?.length || 0,
        parcial_desconocido: hashGroups["parcial_desconocido"]?.length || 0,
      };

      Object.entries(typeCounts).forEach(([tipo, count]) => {
        const emoji =
          {
            MD5: "🔵",
            "SHA-1": "🟢",
            "SHA-256": "🟡",
            "SHA-512": "🔴",
            ssdeep: "🟣",
            parcial_desconocido: "⚪",
          }[tipo] || "⚫";

        console.log(`${emoji} ${tipo}: ${count}`);
      });

      // Summary
      console.log("\n" + "=".repeat(70));
      console.log("📊 RESUMEN:");
      console.log("=".repeat(70));
      console.log(
        `📊 Total de hashes detectados: ${detectedHashes.hashes.length}`
      );
      console.log(`🔐 Tipos únicos de hash: ${Object.keys(hashGroups).length}`);

      const mostCommonType = Object.entries(typeCounts)
        .sort(([, a], [, b]) => b - a)
        .find(([, count]) => count > 0);

      if (mostCommonType) {
        console.log(
          `🏆 Tipo más común: ${mostCommonType[0]} (${mostCommonType[1]} hashes)`
        );
      }
    }

    console.log("\n✨ ANÁLISIS COMPLETADO EXITOSAMENTE");

    // Output raw JSON from the model
    console.log("\n" + "=".repeat(70));
    console.log("🔧 RAW JSON OUTPUT FROM MODEL:");
    console.log("=".repeat(70));
    console.log(JSON.stringify(detectedHashes, null, 2));

    // Save results to JSON file
    const outputFile = filePath.replace(
      /\.(txt|md|log|text)$/i,
      "_hash_analysis.json"
    );
    const outputData = {
      timestamp: new Date().toISOString(),
      inputFile: filePath,
      agent: "Hash Detection Agent",
      detectedHashes: detectedHashes.hashes,
      summary: {
        totalHashes: detectedHashes.hashes.length,
        hashTypes: Object.keys(hashGroups),
        typeCounts: Object.fromEntries(
          Object.entries(hashGroups).map(([type, hashes]) => [
            type,
            hashes.length,
          ])
        ),
      },
    };

    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    console.log(`📁 Resultados guardados en: ${outputFile}`);
  } catch (error) {
    console.error("❌ Error en la detección de hashes:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
});
