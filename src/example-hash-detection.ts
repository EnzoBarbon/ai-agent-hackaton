// Load environment variables
import { config } from "dotenv";
config();

import {
  hashDetectionAgent,
  hashDetectionOutputSchema,
} from "./mastra/agents/hash-detection-agent";

async function runHashDetectionExample() {
  console.log("🔍 Hash Detection Agent Example");
  console.log("=".repeat(50));

  // Example 1: Training data from the problem
  const trainingData = `*** Notas de Análisis de Malware - 20250630 ***

Muestra 1: 'payload.dll'
El hash MD5 del fichero es d41d8cd98f00b204e9800998ecf8427e.
También hemos calculado el SHA-1: da39a3ee5e6b4b0d3255bfef95601890afd80709.

Muestra 2: 'installer.msi'
Este instalador es más complejo. El análisis de VirusTotal muestra un hash principal (SHA-256) de e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.
Un analista apuntó este hash como SHA-1: 5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a.

Muestra 3: 'kernel_driver.sys'
Hash de alta entropía detectado, 128 caracteres de longitud:
cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e
El hash difuso (ssdeep) para comparar similitudes es: 3072:Z3z1y2xWv... (el resto no es relevante para el análisis).

Muestra 4: Log de sistema
El log muestra una entrada truncada del hash del proceso: "firwall block for process with hash 900150983cd24fb0d696...".`;

  try {
    console.log("📝 Analyzing training data...\n");
    console.log("Input:", trainingData.substring(0, 200) + "...\n");

    const result = await hashDetectionAgent.generate(trainingData, {
      output: hashDetectionOutputSchema,
    });

    console.log("🎯 Detected Hashes:");
    console.log(JSON.stringify(result.object.hashes, null, 2));

    // Display results in a nice table format
    console.log("\n📊 Hash Detection Results:");
    console.log("-".repeat(80));
    console.log("Hash Value".padEnd(50) + " | " + "Type".padEnd(20));
    console.log("-".repeat(80));

    result.object.hashes.forEach((hash) => {
      const truncatedHash =
        hash.valor.length > 45
          ? hash.valor.substring(0, 45) + "..."
          : hash.valor;
      console.log(truncatedHash.padEnd(50) + " | " + hash.tipo.padEnd(20));
    });

    console.log("-".repeat(80));
    console.log(`Total hashes detected: ${result.object.hashes.length}`);
  } catch (error) {
    console.error("❌ Error analyzing hashes:", error);
  }

  console.log("\n" + "=".repeat(50));

  // Example 2: Mixed language report
  const mixedLanguageReport = `*** TECHNICAL ANALYSIS / ANÁLISIS TÉCNICO ***

Malware Sample Analysis:
- File: suspicious.bin
- MD5 checksum: f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4
- SHA-1 hash: a9b8c7d6e5f4a9b8c7d6e5f4a9b8c7d6e5f4a9b8
- SHA-256: 123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0

Similarity analysis (ssdeep): 2048:malwareSignature:comparison
Log entry shows: "Process blocked, hash: abc123def456..."`;

  try {
    console.log("📝 Analyzing mixed language report...\n");

    const result2 = await hashDetectionAgent.generate(mixedLanguageReport, {
      output: hashDetectionOutputSchema,
    });

    console.log("🎯 Detected Hashes:");
    console.log(JSON.stringify(result2.object.hashes, null, 2));

    console.log("\n📊 Hash Detection Results:");
    console.log("-".repeat(80));
    console.log("Hash Value".padEnd(50) + " | " + "Type".padEnd(20));
    console.log("-".repeat(80));

    result2.object.hashes.forEach((hash) => {
      const truncatedHash =
        hash.valor.length > 45
          ? hash.valor.substring(0, 45) + "..."
          : hash.valor;
      console.log(truncatedHash.padEnd(50) + " | " + hash.tipo.padEnd(20));
    });

    console.log("-".repeat(80));
    console.log(`Total hashes detected: ${result2.object.hashes.length}`);
  } catch (error) {
    console.error("❌ Error analyzing mixed language report:", error);
  }

  console.log("\n" + "=".repeat(50));

  // Example 3: No hashes present
  const noHashReport = `General IT maintenance report:
This is a routine system check. All services are running normally.
No security incidents detected during this period.`;

  try {
    console.log("📝 Analyzing report with no hashes...\n");

    const result3 = await hashDetectionAgent.generate(noHashReport, {
      output: hashDetectionOutputSchema,
    });

    console.log("🎯 Detected Hashes:");
    console.log(JSON.stringify(result3.object.hashes, null, 2));
    console.log(`Total hashes detected: ${result3.object.hashes.length}`);
  } catch (error) {
    console.error("❌ Error analyzing no-hash report:", error);
  }

  console.log("\n✅ Hash detection examples completed!");
}

// Run the example if this file is executed directly
if (require.main === module) {
  runHashDetectionExample().catch(console.error);
}

export { runHashDetectionExample };
