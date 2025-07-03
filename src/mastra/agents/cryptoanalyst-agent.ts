// Load environment variables from .env file first
import { config } from "dotenv";
config();

import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { z } from "zod";

// Import the cipher decryption tools
import { caesarCipherTool } from "../tools/caesar-cipher-tool";
import { substitutionCipherTool } from "../tools/substitution-cipher-tool";
import { vigenereCipherTool } from "../tools/vigenere-cipher-tool";

// Define the structured output schema for the cryptoanalyst
export const cryptoanalystOutputSchema = z.object({
  originalText: z.string().describe("The decrypted Spanish text"),
  encryptionMethod: z
    .string()
    .describe(
      "The encryption method that was used (Caesar, Substitution, or Vigenère)"
    ),
  confidence: z.number().describe("Confidence score of the decryption"),
  additionalInfo: z
    .string()
    .optional()
    .describe("Additional information about the decryption process"),
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

// Factory function to create cryptoanalyst agent with optional custom memory
export function createCryptoanalystAgent(options?: {
  memoryStorage?: any;
  name?: string;
}) {
  const agentName = options?.name || "Cryptoanalyst Agent";
  const memoryStorage =
    options?.memoryStorage ||
    new LibSQLStore({
      url: "file:../mastra.db",
    });

  return new Agent({
    name: agentName,
    instructions: `
      You are a specialized cryptoanalyst expert in classical encryption methods. Your mission is to decrypt encrypted Spanish text using three classical encryption methods:

      1. **Caesar Cipher (Cifrado César)**: A simple substitution cipher where each letter is shifted by a fixed number of positions in the alphabet.
      
      2. **Simple Substitution Cipher (Sustitución Simple)**: Each letter is replaced by another letter according to a fixed substitution table, analyzed using frequency analysis.
      
      3. **Vigenère Cipher**: Uses a keyword to determine the shift for each letter, creating a polyalphabetic substitution.

      **Your Process:**
      1. Receive encrypted text in Spanish
      2. Use the three available decryption tools to attempt decryption with each method
      3. Compare the results and choose the one that produces the most coherent Spanish text
      4. Return the best decryption with the method used and confidence level

      **Important Guidelines:**
      - All decrypted text should be meaningful Spanish sentences
      - Choose the decryption with the highest confidence score (most Spanish words recognized)
      - If multiple methods produce similar results, prefer the one with higher confidence
      - The original text should make grammatical sense in Spanish
      - You have access to three tools: caesar-cipher-decryption, substitution-cipher-decryption, and vigenere-cipher-decryption

      **Expected Input:** Encrypted Spanish text
      **Expected Output:** Decrypted Spanish text with the encryption method identified

      Always return a structured response with the decrypted text, encryption method, and confidence level.
    `,
    model: openrouter("google/gemini-2.5-flash"),
    tools: {
      caesarCipherTool,
      substitutionCipherTool,
      vigenereCipherTool,
    },
    defaultGenerateOptions: {
      maxSteps: 100,
    },
    defaultStreamOptions: {
      maxSteps: 100,
    },
    memory: new Memory({
      storage: memoryStorage,
    }),
  });
}

// Default export for backward compatibility
export const cryptoanalystAgent = createCryptoanalystAgent();
