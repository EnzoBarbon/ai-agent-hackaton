import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Common Spanish words to help identify correct decryption
const commonSpanishWords = [
  "el",
  "la",
  "de",
  "en",
  "y",
  "a",
  "es",
  "se",
  "no",
  "te",
  "lo",
  "le",
  "da",
  "su",
  "por",
  "son",
  "con",
  "para",
  "al",
  "del",
  "los",
  "las",
  "una",
  "un",
  "ser",
  "era",
  "esta",
  "esto",
  "todo",
  "pero",
  "mas",
  "hay",
  "bien",
  "donde",
  "quien",
  "desde",
  "todos",
  "durante",
  "este",
  "ese",
  "aqui",
  "alla",
  "muy",
  "solo",
  "sin",
  "sobre",
  "hasta",
  "tanto",
  "antes",
  "despues",
  "entonces",
  "cuando",
  "como",
  "que",
  "qué",
  "quien",
  "donde",
  "porque",
  "como",
  "cual",
  "si",
  "sí",
  "mayor",
  "menor",
  "mejor",
  "peor",
  "hola",
  "adios",
  "gracias",
  "plaza",
  "sol",
  "brilla",
  "reunion",
  "sera",
  "horas",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "cita",
  "secreta",
  "jueves",
];

function caesarDecrypt(text: string, shift: number): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isUpperCase = char === char.toUpperCase();
    const upperChar = char.toUpperCase();

    if (upperChar >= "A" && upperChar <= "Z") {
      const charCode = upperChar.charCodeAt(0);
      // Decrypt
      const newCharCode = ((charCode - 65 - shift + 26) % 26) + 65;
      const newChar = String.fromCharCode(newCharCode);
      result += isUpperCase ? newChar : newChar.toLowerCase();
    } else {
      // For Ñ, spaces, punctuation, etc., leave them as they are.
      result += char;
    }
  }
  return result;
}

function scoreText(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  for (const word of words) {
    if (commonSpanishWords.includes(word)) {
      score += 1;
    }
  }

  return score;
}

export const caesarCipherTool = createTool({
  id: "caesar-cipher-decryption",
  description:
    "Attempts to decrypt a Caesar cipher by trying different shifts and returning the most likely Spanish text",
  inputSchema: z.object({
    encryptedText: z.string().describe("The encrypted text to decrypt"),
  }),
  outputSchema: z.object({
    decryptedText: z.string(),
    shift: z.number(),
    confidence: z.number(),
    method: z.string(),
  }),
  execute: async ({ context }) => {
    const { encryptedText } = context;
    let bestDecryption = "";
    let bestScore = -1;
    let bestShift = 0;

    // Try all possible shifts (0-25)
    for (let shift = 0; shift < 26; shift++) {
      const decrypted = caesarDecrypt(encryptedText, shift);
      const score = scoreText(decrypted);

      if (score > bestScore) {
        bestScore = score;
        bestDecryption = decrypted;
        bestShift = shift;
      }
    }

    return {
      decryptedText: bestDecryption,
      shift: bestShift,
      confidence: bestScore,
      method: "Caesar Cipher",
    };
  },
});
