import { z } from "zod";
import { InvoiceAnalysisResultSchema } from "../agents/factura-agente";
import { mastra } from "../index";
import { extractTextFromPdf } from "../tools/extract-text-from-pdf";

export interface FacturaAnalysisInput {
  filePath: string;
  questions: string[];
}

export interface FacturaAnalysisResult {
  answers: Array<{
    question: string;
    answer: string;
  }>;
  structuredData: z.infer<typeof InvoiceAnalysisResultSchema>;
  rawText: string;
  filePath: string;
}

/**
 * Orchestrates the complete invoice analysis workflow:
 * 1. Extracts text from PDF
 * 2. Analyzes invoice and extracts structured data
 * 3. Answers questions about the invoice
 */
export async function runFacturaAnalysisWorkflow(
  input: FacturaAnalysisInput
): Promise<FacturaAnalysisResult> {
  const { filePath, questions } = input;

  console.log("🚀 Starting invoice analysis workflow...");
  console.log(`   File: ${filePath}`);
  console.log(`   Questions: ${questions.length}`);

  // Get agents from Mastra instance (to use telemetry)
  const facturaAnalisisAgent = mastra.getAgent("facturaAnalisisAgent");
  const facturaQAAgent = mastra.getAgent("facturaQAAgent");

  // Step 1: Extract text from PDF
  console.log("\n📄 Step 1: Extracting text from PDF...");
  const text = await extractTextFromPdf(filePath);

  if (!text.trim()) {
    throw new Error("No text could be extracted from the PDF file");
  }

  console.log(`✅ Text extracted successfully (${text.length} characters)`);

  // Step 2: Analyze invoice and extract structured data
  console.log(
    "\n🤖 Step 2: Analyzing invoice with AI to extract structured data..."
  );
  const analysisResult = await facturaAnalisisAgent.generate(
    `Analiza la siguiente factura de electricidad y extrae toda la información estructurada:

${text}`,
    {
      output: InvoiceAnalysisResultSchema,
    }
  );

  const structuredData = analysisResult.object;
  console.log("✅ Invoice analysis completed");

  // Step 3: Answer questions about the invoice
  console.log(
    `\n🔍 Step 3: Answering ${questions.length} questions about the invoice...`
  );

  const answers = [];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`   Pregunta ${i + 1}/${questions.length}: ${question}`);

    try {
      const prompt = `
Datos estructurados de la factura (JSON):
${JSON.stringify(structuredData, null, 2)}

Datos sin estructurar de la factura (texto original). IMPORTANTE: Primero utiliza los datos estructurados para responder la pregunta.
Pero es posible que esos datos estructurados les falte información. Por eso, si no encuentras la información en los datos estructurados, utiliza el texto original para responder la pregunta:
${text}

Pregunta: ${question}

Por favor responde la pregunta usando los datos proporcionados. Si necesitas realizar cálculos, usa la herramienta de cálculo disponible.
      `;

      console.log(`\n🔍 Calling Q&A Agent with telemetry enabled...`);
      console.log(`📋 Prompt length: ${prompt.length} characters`);
      console.log(
        `🛠️ Tools available: ${Object.keys(facturaQAAgent.tools || {}).join(", ")}`
      );
      console.log(`⏱️ Starting agent execution...`);

      const result = await facturaQAAgent.generate(prompt);

      console.log(`✅ Agent execution completed`);
      console.log(`📝 Response length: ${result.text.length} characters`);

      answers.push({
        question,
        answer: result.text,
      });

      console.log(`   ✅ Respondida`);
    } catch (error) {
      console.error(`   ❌ Error answering question "${question}":`, error);
      answers.push({
        question,
        answer: `Error al procesar la pregunta: ${error instanceof Error ? error.message : "Error desconocido"}`,
      });
    }
  }

  console.log("✅ All questions answered");
  console.log("🎉 Workflow completed successfully!\n");

  return {
    answers,
    structuredData,
    rawText: text,
    filePath,
  };
}
