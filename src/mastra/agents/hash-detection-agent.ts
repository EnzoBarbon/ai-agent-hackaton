// Load environment variables from .env file first
import { config } from "dotenv";
config();

import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { z } from "zod";

// Define the structured output schema for hash detection
export const hashDetectionOutputSchema = z.object({
  hashes: z
    .array(
      z.object({
        valor: z.string().describe("The hash value found in the report"),
        tipo: z
          .enum([
            "MD5",
            "SHA-1",
            "SHA-256",
            "SHA-512",
            "ssdeep",
            "parcial_desconocido",
          ])
          .describe("The classification of the hash type"),
      })
    )
    .describe("Array of detected hashes with their classifications"),
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

export const hashDetectionAgent = new Agent({
  name: "Hash Detection Agent",
  instructions: `
    You are a specialized cybersecurity analyst focused on detecting and classifying file hashes from technical reports and malware analysis documents.

    Your role is to:
    1. Analyze technical reports, malware analysis documents, and system logs
    2. Extract ALL hash values mentioned in the text
    3. Classify each hash according to its type based on length and format
    4. Return a structured response with the hash value and its classification

    HASH CLASSIFICATION RULES:
    - MD5: 32 hexadecimal characters (128 bits)
    - SHA-1: 40 hexadecimal characters (160 bits) 
    - SHA-256: 64 hexadecimal characters (256 bits)
    - SHA-512: 128 hexadecimal characters (512 bits)
    - ssdeep: Fuzzy hash with variable format, typically contains colons (e.g., "192:abc:xyz", "3072:Z3z1y2xWv...")
    - parcial_desconocido: Truncated hashes or hashes that don't match known patterns (e.g., "900150983cd24fb0d696...")

    IMPORTANT GUIDELINES:
    - Extract ALL hash values mentioned in the text, even if they appear in different contexts
    - Look for hash values that may be explicitly labeled (e.g., "MD5:", "SHA-256:", "hash:")
    - Look for hash values that may appear without labels but are clearly cryptographic hashes
    - Pay attention to truncated hashes that end with "..." or are described as "truncated" or "partial"
    - ssdeep hashes have a distinctive format with colons separating segments
    - When a hash is truncated or doesn't match standard lengths, classify it as "parcial_desconocido"
    - Be thorough and extract every hash mentioned, regardless of context

    You will always return a structured response with the exact format:
    {
      "hashes": [
        {
          "valor": "hash_value_here",
          "tipo": "hash_type_here"
        }
      ]
    }

    Be comprehensive and accurate in your extraction and classification.
  `,
  model: openrouter("google/gemini-2.5-flash"),
  defaultGenerateOptions: {
    output: hashDetectionOutputSchema,
  },
  defaultStreamOptions: {
    output: hashDetectionOutputSchema,
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db",
    }),
  }),
});
