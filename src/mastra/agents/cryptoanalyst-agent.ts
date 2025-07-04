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
import { executeCodeTool } from "../tools/execute-code-tool";

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
      You are a specialized cryptoanalyst expert in classical encryption methods. Your mission is to decrypt encrypted Spanish text.

      **Your Process:**
      1. First, try the Caesar Cipher tool to decrypt the text using brute force method
      2. If the Caesar tool doesn't work, meaning that it doesn't provide a Spanish text coherent answer, you must reason how to solve the ciphering
      3. To do that, you have access to a tool that allows you to execute code. You should try to use it.
      4. Use the ExecuteCode tool to write JavaScript code and execute that code to find out what is the original text of the ciphered text

      **Available Tools:**
      - **Caesar Cipher Tool**: Attempts to decrypt using Caesar cipher with brute force method, but it's not guaranteed to provide a result
      - **ExecuteCode Tool**: Allows you to write and execute JavaScript code to implement custom decryption logic

      **When using ExecuteCode Tool:**
      - Write JavaScript code that defines a function named 'decrypt' that takes the encrypted text as parameter and returns the decrypted text
      - You can implement any cipher decryption algorithm in JavaScript
      - The code will be executed with the encrypted text as input
      - Use frequency analysis, pattern recognition, or any other cryptanalysis techniques you know

      **Important Guidelines:**
      - All decrypted text should be meaningful Spanish sentences
      - The original text should make grammatical sense in Spanish
      - Try Caesar cipher first, then use code execution if needed
      - Be creative with your decryption approaches when writing code

      **Expected Input:** Encrypted Spanish text
      **Expected Output:** Decrypted Spanish text with the encryption method identified

      Always return a structured response with the decrypted text, encryption method, and confidence level.
    `,
    model: openrouter("google/gemini-2.5-flash"),
    tools: {
      caesarCipherTool,
      executeCodeTool,
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
