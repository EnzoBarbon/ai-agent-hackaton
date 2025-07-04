#!/usr/bin/env tsx

import fs from "fs";
import { extname } from "path";
import { z } from "zod";
import {
  facturaAnalisisAgent,
  InvoiceAnalysisResultSchema,
} from "../agents/factura-agente.js";
import { extractTextFromPdf } from "../tools/extract-text-from-pdf.js";

type InvoiceData = z.infer<typeof InvoiceAnalysisResultSchema>;

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Error: Se requiere la ruta del archivo de la factura");
  console.error("Uso: tsx run-factura.ts <ruta-del-archivo>");
  console.error("Ejemplo: tsx run-factura.ts ./factura.pdf");
  process.exit(1);
}

const filePath = args[0];

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: El archivo ${filePath} no existe`);
  process.exit(1);
}

async function processInvoice(filePath: string) {
  try {
    console.log(`📄 Procesando factura: ${filePath}`);

    let textContent: string;
    const fileExtension = extname(filePath).toLowerCase();

    // Determine file type and extract text accordingly
    if (fileExtension === ".pdf") {
      console.log("🔍 Extrayendo texto del PDF...");
      textContent = await extractTextFromPdf(filePath);
    } else if (fileExtension === ".txt") {
      console.log("📖 Leyendo archivo de texto...");
      textContent = fs.readFileSync(filePath, "utf-8");
    } else {
      throw new Error(
        `Tipo de archivo no soportado: ${fileExtension}. Solo se admiten archivos .pdf y .txt`
      );
    }

    if (!textContent.trim()) {
      throw new Error(
        "El archivo está vacío o no se pudo extraer texto del mismo"
      );
    }

    console.log("🤖 Analizando factura con IA...");

    // Process with the factura agent
    const result = await facturaAnalisisAgent.generate(
      `Analiza la siguiente factura de electricidad y extrae toda la información estructurada:

${textContent}`,
      {
        output: InvoiceAnalysisResultSchema,
      }
    );

    console.log("✅ Análisis completado!\n");

    // Display results in a formatted way
    console.log("📊 RESULTADOS DEL ANÁLISIS:\n");
    console.log("=".repeat(50));

    const data = result.object;

    console.log("👤 INFORMACIÓN DEL CLIENTE:");
    console.log(`   Nombre: ${data.customer.name}`);
    console.log(`   Dirección: ${data.customer.address}`);

    console.log("\n📄 INFORMACIÓN DE LA FACTURA:");
    console.log(`   Número: ${data.invoice.number}`);
    console.log(`   Fecha: ${data.invoice.date}`);
    console.log(`   Período: ${data.invoice.period}`);
    console.log(`   Tarifa: ${data.invoice.tariff}`);
    console.log(`   Contrato: ${data.invoice.contract}`);
    console.log(`   IBAN: ${data.invoice.iban}`);

    console.log("\n💰 DESGLOSE DE CARGOS:");
    console.log(
      `   Potencia Punta: ${data.charges.powerpunta.power} kW - €${data.charges.powerpunta.charge}`
    );
    if (data.charges.powervalle) {
      console.log(
        `   Potencia Valle: ${data.charges.powervalle.power} kW - €${data.charges.powervalle.charge}`
      );
    }
    console.log(`   Derechos de Acceso: €${data.charges.access}`);
    console.log(`   Equipos: €${data.charges.equipment}`);
    console.log(`   Impuestos: €${data.charges.taxes}`);

    if (data.charges.compensation) {
      console.log(`   Compensación Solar: €${data.charges.compensation}`);
    }
    if (data.charges.social) {
      console.log(`   Bono Social: €${data.charges.social}`);
    }

    if (data.charges.other && data.charges.other.length > 0) {
      console.log("   Otros Cargos:");
      data.charges.other.forEach((charge: { name: string; charge: number }) => {
        console.log(`     ${charge.name}: €${charge.charge}`);
      });
    }

    console.log(`\n💵 TOTAL: €${data.total}`);

    console.log("\n⚡ CONSUMO:");
    console.log(`   Puntos Utilizados: ${data.points_used}`);
    console.log(
      `   Consumo Promedio Diario: ${data.avg_daily_consumption} kWh`
    );

    console.log("\n📈 CONSUMO DIARIO (últimos registros):");
    const recentConsumption = data.daily_consumption.slice(-5); // Show last 5 days
    recentConsumption.forEach(
      (day: { date: string; punta: number; valle?: number; total: number }) => {
        const valleText = day.valle ? ` | Valle: ${day.valle} kWh` : "";
        console.log(
          `   ${day.date}: Punta: ${day.punta} kWh${valleText} | Total: ${day.total} kWh`
        );
      }
    );

    if (data.daily_consumption.length > 5) {
      console.log(`   ... y ${data.daily_consumption.length - 5} días más`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✨ Análisis completado exitosamente");
  } catch (error) {
    console.error("❌ Error al procesar la factura:", error);
    process.exit(1);
  }
}

// Run the invoice processing
processInvoice(filePath).catch((error) => {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
});
