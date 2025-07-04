// Load environment variables from .env file first
import { config } from "dotenv";
config();

import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";

export const InvoiceAnalysisResultSchema = z.object({
  customer: z.object({
    name: z.string().describe("Nombre del cliente"),
    address: z.string().describe("Dirección del cliente"),
  }),
  invoice: z.object({
    date: z.string().describe("Fecha de emisión de la factura"),
    number: z.string().describe("Número de factura"),
    period: z.string().describe("Período facturado"),
    tariff: z.string().describe("Tipo de tarifa"),
    contract: z.string().describe("Cuenta de contrato"),
    iban: z.string().describe("IBAN"),
  }),
  charges: z.object({
    powerpunta_or_total: z
      .object({
        power: z
          .number()
          .describe("Potencia o potencia punta contratada en kW"),
        charge: z.number().describe("Coste en euros"),
      })
      .describe(
        "Potencia o potencia punta contratada en kW y su coste en euros"
      ),
    powervalle: z
      .optional(
        z.object({
          power: z.number().describe("Potencia valle contratada en kW"),
          charge: z.number().describe("Coste en euros"),
        })
      )
      .describe(
        "Potencia valle contratada en kW y su coste en euros. Dejar vacío si no hay potencia valle contratada"
      ),
    powerpunta_consumption_or_total: z
      .object({
        power: z
          .number()
          .describe("Potencia o potencia punta contratada en kW"),
        charge: z.number().describe("Coste en euros"),
      })
      .describe(
        "Potencia o potencia punta consumida en kW y su coste en euros"
      ),
    powervalle_consumption: z
      .optional(
        z.object({
          power: z.number().describe("Potencia valle contratada en kW"),
          charge: z.number().describe("Coste en euros"),
        })
      )
      .describe(
        "Potencia valle consumida en kW y su coste en euros. Dejar vacío si no hay potencia valle contratada"
      ),
    access: z.number().describe("Coste en euros de derechos de acceso"),
    equipment: z.number().describe("Coste en euros de equipos"),
    taxes: z.number().describe("Coste en euros de impuestos"),
    compensation: z
      .optional(z.number())
      .describe("Coste en euros de compensación por excedentes solar"),
    social: z
      .optional(z.number())
      .describe("Coste en euros de Financiación Bono Social"),
    other: z
      .array(
        z.object({
          name: z.string().describe("Nombre del concepto"),
          charge: z.number().describe("Coste en euros"),
        })
      )
      .describe(
        "Coste en euros de otros conceptos que se especifican en la factura y no se han podido identificar"
      ),
  }),
  total: z.number().describe("Coste total en euros de la factura"),
  points_used: z.number().describe("Puntos de consumo utilizados"),
  avg_daily_consumption: z.number().describe("Consumo promedio diario en kWh"),
  daily_consumption: z.array(
    z.object({
      date: z.string().describe("Fecha de la medición"),
      punta: z.number().describe("Consumo en punta en kWh"),
      valle: z.optional(z.number()).describe("Consumo en valle en kWh"),
      total: z.number().describe("Consumo total en kWh"),
    })
  ),
});

// Validate that the API key is set
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error(
    "OPENROUTER_API_KEY environment variable is required. Please set it in your .env file or environment."
  );
}

// Configure OpenRouter provider
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const facturaAnalisisAgent = new Agent({
  name: "Factura Análisis Agent",
  instructions: `
    You are a specialized agent focused on analyzing electricity invoices and extracting structured data from them.

    Your role is to:
    1. Analyze electricity invoice documents (facturas de electricidad)
    2. Extract customer information, invoice details, and all charges
    3. Calculate consumption data and totals
    4. Return the data in the exact structured format specified

    IMPORTANT GUIDELINES:
    - Extract customer name and address accurately
    - Identify invoice date, number, and billing period
    - Determine tariff type and contract details
    - Extract IBAN information
    - Calculate all charges including:
      * Power charges (punta and valle if applicable)
      * Access rights
      * Equipment costs
      * Taxes
      * Solar compensation (if applicable)
      * Social bonus (if applicable)
      * Other charges
    - Calculate total invoice amount
    - Extract consumption data and calculate daily averages
    - Provide daily consumption breakdown with punta, valle, and total values

    You will always return a structured response matching the InvoiceAnalysisResultSchema format exactly.
    All monetary values should be in euros.
    All power values should be in kW.
    All consumption values should be in kWh.
  `,
  model: openrouter("google/gemini-2.5-flash"),
  defaultGenerateOptions: {
    temperature: 0,
    output: InvoiceAnalysisResultSchema,
  },
  defaultStreamOptions: {
    temperature: 0,
    output: InvoiceAnalysisResultSchema,
  },
});
