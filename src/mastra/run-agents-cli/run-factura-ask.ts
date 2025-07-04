#!/usr/bin/env tsx

import fs from "fs";
import { extname } from "path";
import { runFacturaAnalysisWorkflow } from "../workflows/factura-analysis-workflow";

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    "Error: Se requiere la ruta del archivo PDF y al menos una pregunta"
  );
  console.error(
    'Uso: tsx run-factura-ask.ts <ruta-del-archivo-pdf> "<pregunta1>" ["<pregunta2>"] [...]'
  );
  console.error(
    'Ejemplo: tsx run-factura-ask.ts ./factura.pdf "¿Cuál es mi IBAN?" "¿Qué día consumí más?"'
  );
  console.error("\nEjemplos de preguntas:");
  console.error('  "¿Qué día es el que más kWh he consumido?"');
  console.error('  "¿Qué mes tuve el mayor consumo promedio?"');
  console.error('  "¿Cuál es mi IBAN?"');
  console.error('  "¿Qué días de mayo consumí más de 5 kWh?"');
  console.error('  "¿Cuánto pagué en total por Derechos de acceso?"');
  console.error(
    '  "¿En cuántos domicilios he vivido y cuántos días en cada uno?"'
  );
  console.error('  "Dime el consumo de todos los fines de semana de mayo"');
  console.error(
    '  "¿Qué día es el que más kWh he consumido en horario Valle?"'
  );
  console.error('  "¿Cuánto he pagado total en impuestos?"');
  process.exit(1);
}

const filePath = args[0];
const questions = args.slice(1); // All arguments after the first one are questions

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: El archivo ${filePath} no existe`);
  process.exit(1);
}

// Check if file is a PDF
const fileExtension = extname(filePath).toLowerCase();
if (fileExtension !== ".pdf") {
  console.error(
    `Error: El archivo debe ser un PDF. Archivo proporcionado: ${fileExtension}`
  );
  process.exit(1);
}

async function main() {
  try {
    console.log(
      "📋 ANÁLISIS DE FACTURA ELÉCTRICA CON PREGUNTAS PERSONALIZADAS"
    );
    console.log("=".repeat(70));
    console.log(`📄 Archivo: ${filePath}`);
    console.log(`❓ Preguntas a analizar: ${questions.length}`);

    questions.forEach((question, index) => {
      console.log(`   ${index + 1}. ${question}`);
    });

    console.log("=".repeat(70));

    // Run the complete workflow
    const result = await runFacturaAnalysisWorkflow({
      filePath,
      questions,
    });

    // Display structured data summary
    console.log("📊 RESUMEN DE LA FACTURA:");
    console.log("=".repeat(50));

    const data = result.structuredData;
    console.log(`👤 Cliente: ${data.customer.name}`);
    console.log(`📄 Factura #: ${data.invoice.number}`);
    console.log(`📅 Fecha: ${data.invoice.date}`);
    console.log(`💶 Total: €${data.total}`);
    console.log(
      `⚡ Consumo Promedio Diario: ${data.avg_daily_consumption} kWh`
    );

    console.log("\n" + "=".repeat(70));
    console.log("💡 RESPUESTAS A TUS PREGUNTAS:");
    console.log("=".repeat(70));

    // Display all Q&A results
    result.answers.forEach((qa, index) => {
      console.log(`\n${index + 1}. 🔍 ${qa.question}`);
      console.log(`   💡 ${qa.answer}`);
      console.log("-".repeat(50));
    });

    console.log("\n✨ ANÁLISIS COMPLETADO EXITOSAMENTE");

    // Save results to JSON file
    const outputFile = filePath.replace(".pdf", "_custom_analysis.json");
    const outputData = {
      timestamp: new Date().toISOString(),
      inputFile: filePath,
      questionsAsked: questions,
      structuredData: result.structuredData,
      questionsAndAnswers: result.answers,
      summary: {
        totalQuestions: questions.length,
        customerName: data.customer.name,
        invoiceNumber: data.invoice.number,
        totalAmount: data.total,
        avgDailyConsumption: data.avg_daily_consumption,
      },
    };

    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    console.log(`📁 Resultados guardados en: ${outputFile}`);
  } catch (error) {
    console.error("❌ Error en el análisis de la factura:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
});
