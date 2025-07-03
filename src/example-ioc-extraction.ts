import {
  iocExtractionAgent,
  iocOutputSchema,
} from "./mastra/agents/ioc-extraction-agent.js";

// Example threat intelligence report
const threatReport = `
*** INFORME DE AMENAZA: Grupo 'Silent Serpent' - Q1 2025 ***

Análisis de la reciente campaña de espionaje atribuida al grupo APT "Silent Serpent". El vector de entrada principal fue la explotación de la vulnerabilidad CVE-2024-30103 en servidores de correo.

Una vez dentro, los actores desplegaron un malware dropper. El fichero, 'update_installer.dll', presenta el siguiente hash SHA256:
a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2

La comunicación con el servidor de Comando y Control (C2) se estableció con los siguientes dominios:
- system-update.ddns.net
- cdn.content-delivery.org

Se observó tráfico de red hacia la dirección IP 185.22.15.6. El análisis de un segundo artefacto, 'connector.exe' (MD5: f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4), reveló conexiones adicionales a auth.internal-service.net y a la IP 8.8.4.4.
`;

async function demonstrateIOCExtraction() {
  try {
    console.log(
      "🔍 Starting IOC Extraction Demo with Gemini 2.5 Flash via OpenRouter...\n"
    );

    // Use the IOC Extraction Agent with structured output
    const result = await iocExtractionAgent.generate(threatReport, {
      output: iocOutputSchema,
    });

    // Get the structured output
    const extractedIOCs = result.object;

    console.log("✅ IOC Extraction Results (powered by Gemini 2.5 Flash):");
    console.log("=========================================================\n");

    console.log("📍 IP Addresses:");
    extractedIOCs.ips.forEach((ip: string, index: number) => {
      console.log(`   ${index + 1}. ${ip}`);
    });

    console.log("\n🌐 Domains:");
    extractedIOCs.domains.forEach((domain: string, index: number) => {
      console.log(`   ${index + 1}. ${domain}`);
    });

    console.log("\n🔐 File Hashes:");
    extractedIOCs.hashes.forEach((hash: string, index: number) => {
      console.log(`   ${index + 1}. ${hash}`);
    });

    console.log("\n🚨 CVE Identifiers:");
    extractedIOCs.cves.forEach((cve: string, index: number) => {
      console.log(`   ${index + 1}. ${cve}`);
    });

    console.log("\n📋 Complete JSON Output:");
    console.log(JSON.stringify(extractedIOCs, null, 2));

    // Demonstrate schema validation
    console.log("\n✅ Schema Validation:");
    const validationResult = iocOutputSchema.safeParse(extractedIOCs);
    console.log(`   Schema valid: ${validationResult.success}`);

    // Show the types are properly inferred
    console.log("\n📊 Summary:");
    console.log(`   Total IPs: ${extractedIOCs.ips.length}`);
    console.log(`   Total Domains: ${extractedIOCs.domains.length}`);
    console.log(`   Total Hashes: ${extractedIOCs.hashes.length}`);
    console.log(`   Total CVEs: ${extractedIOCs.cves.length}`);
  } catch (error) {
    console.error("❌ Error during IOC extraction:", error);
    console.error(
      "💡 Make sure you have set the OPENROUTER_API_KEY environment variable"
    );
  }
}

// Run the demo
demonstrateIOCExtraction()
  .then(() => {
    console.log("\n🎉 IOC Extraction Demo Complete!");
    console.log("🤖 Powered by Google Gemini 2.5 Flash via OpenRouter");
  })
  .catch((error) => {
    console.error("❌ Demo failed:", error);
  });
