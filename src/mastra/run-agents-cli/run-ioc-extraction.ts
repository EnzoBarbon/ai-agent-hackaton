#!/usr/bin/env tsx

import fs from "fs";
import { extname } from "path";
import {
  iocExtractionAgent,
  iocOutputSchema,
} from "../agents/ioc-extraction-agent";

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Error: Se requiere la ruta del archivo de texto");
  console.error("Uso: tsx run-ioc-extraction.ts <ruta-del-archivo>");
  console.error("Ejemplo: tsx run-ioc-extraction.ts ./threat-report.txt");
  console.error("\nFormatos soportados:");
  console.error("  .txt - Archivos de texto plano");
  console.error("  .md  - Archivos Markdown");
  console.error("  .log - Archivos de log");
  console.error("\nEjemplos de uso:");
  console.error('  tsx run-ioc-extraction.ts "./informe-amenazas.txt"');
  console.error('  tsx run-ioc-extraction.ts "./threat-intelligence.md"');
  console.error('  tsx run-ioc-extraction.ts "./security-log.log"');
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
    console.log("🔍 EXTRACCIÓN DE INDICADORES DE COMPROMISO (IOCs)");
    console.log("=".repeat(70));
    console.log(`📄 Archivo: ${filePath}`);
    console.log("=".repeat(70));

    // Read file content
    const fileContent = fs.readFileSync(filePath, "utf-8");

    if (!fileContent.trim()) {
      console.error("Error: El archivo está vacío");
      process.exit(1);
    }

    console.log("🤖 Analizando contenido con el agente de extracción IOC...");

    // Run the IOC extraction agent
    const result = await iocExtractionAgent.generate(fileContent, {
      output: iocOutputSchema,
    });

    const extractedIOCs = result.object;

    // Display results
    console.log("\n" + "=".repeat(70));
    console.log("📊 INDICADORES DE COMPROMISO EXTRAÍDOS:");
    console.log("=".repeat(70));

    // Display IPs
    console.log(`\n🌐 DIRECCIONES IP (${extractedIOCs.ips.length}):`);
    if (extractedIOCs.ips.length > 0) {
      extractedIOCs.ips.forEach((ip, index) => {
        console.log(`   ${index + 1}. ${ip}`);
      });
    } else {
      console.log("   No se encontraron direcciones IP");
    }

    // Display domains
    console.log(`\n🌍 DOMINIOS (${extractedIOCs.domains.length}):`);
    if (extractedIOCs.domains.length > 0) {
      extractedIOCs.domains.forEach((domain, index) => {
        console.log(`   ${index + 1}. ${domain}`);
      });
    } else {
      console.log("   No se encontraron dominios");
    }

    // Display hashes
    console.log(`\n🔐 HASHES (${extractedIOCs.hashes.length}):`);
    if (extractedIOCs.hashes.length > 0) {
      extractedIOCs.hashes.forEach((hash, index) => {
        console.log(`   ${index + 1}. ${hash}`);
      });
    } else {
      console.log("   No se encontraron hashes");
    }

    // Display CVEs
    console.log(`\n🛡️  CVEs (${extractedIOCs.cves.length}):`);
    if (extractedIOCs.cves.length > 0) {
      extractedIOCs.cves.forEach((cve, index) => {
        console.log(`   ${index + 1}. ${cve}`);
      });
    } else {
      console.log("   No se encontraron CVEs");
    }

    // Summary
    const totalIOCs =
      extractedIOCs.ips.length +
      extractedIOCs.domains.length +
      extractedIOCs.hashes.length +
      extractedIOCs.cves.length;

    console.log("\n" + "=".repeat(70));
    console.log("📈 RESUMEN:");
    console.log("=".repeat(70));
    console.log(`📊 Total de IOCs extraídos: ${totalIOCs}`);
    console.log(`🌐 IPs: ${extractedIOCs.ips.length}`);
    console.log(`🌍 Dominios: ${extractedIOCs.domains.length}`);
    console.log(`🔐 Hashes: ${extractedIOCs.hashes.length}`);
    console.log(`🛡️  CVEs: ${extractedIOCs.cves.length}`);

    console.log("\n✨ ANÁLISIS COMPLETADO EXITOSAMENTE");

    // Output raw JSON from the model
    console.log("\n" + "=".repeat(70));
    console.log("🔧 RAW JSON OUTPUT FROM MODEL:");
    console.log("=".repeat(70));
    console.log(JSON.stringify(extractedIOCs, null, 2));

    // Save results to JSON file
    const outputFile = filePath.replace(
      /\.(txt|md|log|text)$/i,
      "_ioc_analysis.json"
    );
    const outputData = {
      timestamp: new Date().toISOString(),
      inputFile: filePath,
      agent: "IOC Extraction Agent",
      extractedIOCs: extractedIOCs,
      summary: {
        totalIOCs,
        ipsCount: extractedIOCs.ips.length,
        domainsCount: extractedIOCs.domains.length,
        hashesCount: extractedIOCs.hashes.length,
        cvesCount: extractedIOCs.cves.length,
      },
    };

    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    console.log(`📁 Resultados guardados en: ${outputFile}`);
  } catch (error) {
    console.error("❌ Error en la extracción de IOCs:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
});
