import fs from "fs";
import pdf from "pdf-parse";

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);

  try {
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (err) {
    throw new Error("Error al procesar el PDF: " + (err as Error).message);
  }
}
