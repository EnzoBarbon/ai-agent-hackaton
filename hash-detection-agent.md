# Hash Detection Agent Implementation Plan

## Overview

This agent acts as a specialized cybersecurity analyst that analyzes technical reports and classifies file hashes with precision. The agent combines AI-powered context understanding with structured output to extract and classify cryptographic hashes from malware analysis reports, system logs, and technical documentation.

## Problem Analysis

### Core Challenge

The agent must identify and classify different types of cryptographic hashes from technical reports while handling:

- **Multiple hash formats**: MD5, SHA-1, SHA-256, SHA-512, ssdeep
- **Contextual recognition**: Understanding when a string is actually a hash vs random hex
- **Truncated hashes**: Identifying partially shown or cut-off hashes
- **Variable presentations**: Hashes across multiple lines, with prefixes, in different contexts
- **Fuzzy hashes**: ssdeep format with variable structure

### Why AI Approach is Superior

1. **Context Understanding**: AI can distinguish between actual file hashes and random hexadecimal strings
2. **Truncation Detection**: Intelligent identification of partial hashes vs complete ones
3. **Format Flexibility**: Handles multiline hashes, unusual spacing, and various presentations
4. **Semantic Analysis**: Understands phrases like "hash MD5 del fichero es" or "SHA-256 is"
5. **Edge Case Handling**: Manages complex scenarios that regex patterns might miss

## Agent Architecture

### Core Agent Configuration

```typescript
// src/mastra/agents/hash-detection-agent.ts
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";

// Define the hash classification schema
export const hashClassificationSchema = z.object({
  valor: z.string().describe("The exact hash value found in the text"),
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
});

export const hashDetectionOutputSchema = z.array(hashClassificationSchema);

export const hashDetectionAgent = new Agent({
  name: "Hash Detection Agent",
  instructions: `
    You are a specialized cybersecurity analyst focused on extracting and classifying cryptographic hashes from technical reports.

    Your role is to:
    1. Analyze technical reports, malware analysis documents, and system logs
    2. Identify all cryptographic hashes mentioned in the text
    3. Classify each hash according to its type based on format and context
    4. Handle edge cases like truncated hashes and multiline presentations

    HASH CLASSIFICATION RULES:
    - MD5: 32 hexadecimal characters (128 bits)
    - SHA-1: 40 hexadecimal characters (160 bits)  
    - SHA-256: 64 hexadecimal characters (256 bits)
    - SHA-512: 128 hexadecimal characters (512 bits)
    - ssdeep: Fuzzy hash format like "3072:Z3z1y2xWv..." or "192:abc:xyz"
    - parcial_desconocido: Clearly truncated hashes or unrecognized patterns

    IMPORTANT GUIDELINES:
    - Only extract strings that are clearly presented as hashes in context
    - Look for contextual clues: "hash MD5", "SHA-256 is", "hash del fichero", etc.
    - For truncated hashes, preserve exactly what's shown including "..." if present
    - For multiline hashes, combine them into a single string
    - Distinguish between actual hashes and random hexadecimal strings
    - ssdeep hashes have format "blocksize:hash1:hash2" or may be truncated
    - Consider context: file analysis, malware reports, system logs, etc.

    CONTEXT UNDERSTANDING:
    - "El hash MD5 del fichero es X" → X is an MD5 hash
    - "SHA-256: X" → X is a SHA-256 hash  
    - "hash truncado: X..." → X is parcial_desconocido
    - "hash difuso (ssdeep): X" → X is ssdeep format
    - Random hex in non-hash context → ignore

    You will always return an array of objects with this exact format:
    [
      {
        "valor": "actual_hash_string",
        "tipo": "hash_type"
      }
    ]

    Be thorough in extraction but precise in classification. Only extract strings that are clearly identified as hashes in their context.
  `,
  model: openai("gpt-4o-mini"),
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db",
    }),
  }),
  defaultGenerateOptions: {
    output: hashDetectionOutputSchema,
  },
});
```

### Integration with Main Mastra Instance

```typescript
// src/mastra/index.ts (updated)
import { hashDetectionAgent } from "./agents/hash-detection-agent";

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: {
    weatherAgent,
    iocExtractionAgent,
    hashDetectionAgent,
  },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
```

## Implementation Strategy

### 1. AI-First Approach with Structured Output

**Why this approach:**

- Handles complex contextual understanding
- Manages edge cases automatically
- Provides consistent structured output
- Scales to handle various report formats

**Benefits:**

- **Context Awareness**: Understands when hex strings are actually hashes
- **Truncation Intelligence**: Identifies partial hashes vs. complete ones
- **Format Flexibility**: Handles multiline hashes and unusual presentations
- **Semantic Understanding**: Recognizes hash-related terminology in multiple languages
- **Automatic Structured Output**: `defaultGenerateOptions` forces the model to always return properly structured JSON, eliminating the need to specify the schema in every call

### 2. Hybrid Validation (Optional Enhancement)

```typescript
// Optional: Add validation layer for common patterns
const hashValidationPatterns = {
  MD5: /^[a-f0-9]{32}$/i,
  SHA1: /^[a-f0-9]{40}$/i,
  SHA256: /^[a-f0-9]{64}$/i,
  SHA512: /^[a-f0-9]{128}$/i,
  ssdeep: /^\d+:[a-zA-Z0-9+/=]+:[a-zA-Z0-9+/=]*$/,
  truncated: /^[a-f0-9]+\.{3}$/i,
};

// Use for post-processing validation if needed
```

### 3. Advanced Context Understanding

The agent will handle complex scenarios:

- **Multiline hashes**: Reconstruct from split lines
- **Embedded context**: Extract from sentences and paragraphs
- **Multiple formats**: Handle various presentation styles
- **Language variations**: Spanish, English, technical terminology

## Testing Environment

### Test Data Structure

```typescript
// src/mastra/tests/hash-detection-agent.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  hashDetectionAgent,
  hashDetectionOutputSchema,
} from "../agents/hash-detection-agent";

interface HashTestCase {
  name: string;
  input: string;
  expected: Array<{
    valor: string;
    tipo:
      | "MD5"
      | "SHA-1"
      | "SHA-256"
      | "SHA-512"
      | "ssdeep"
      | "parcial_desconocido";
  }>;
}

const testCases: HashTestCase[] = [
  {
    name: "Malware Analysis Report",
    input: `**_ Notas de Análisis de Malware - 20250630 _**
Muestra 1: 'payload.dll'
El hash MD5 del fichero es d41d8cd98f00b204e9800998ecf8427e.
También hemos calculado el SHA-1: da39a3ee5e6b4b0d3255bfef95601890afd80709.
Muestra 2: 'installer.msi'
Este instalador es más complejo. El análisis de VirusTotal muestra un hash principal (SHA256) de e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.
Un analista apuntó este hash como SHA-1:
5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a.
Muestra 3: 'kernel_driver.sys'
Hash de alta entropía detectado, 128 caracteres de longitud:
cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e
El hash difuso (ssdeep) para comparar similitudes es: 3072:Z3z1y2xWv... (el resto no es relevante para el análisis).
Muestra 4: Log de sistema
El log muestra una entrada truncada del hash del proceso: "firwall block for process with hash 900150983cd24fb0d696...".`,
    expected: [
      {
        valor: "d41d8cd98f00b204e9800998ecf8427e",
        tipo: "MD5",
      },
      {
        valor: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
        tipo: "SHA-1",
      },
      {
        valor:
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        tipo: "SHA-256",
      },
      {
        valor: "5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a",
        tipo: "SHA-1",
      },
      {
        valor:
          "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
        tipo: "SHA-512",
      },
      {
        valor: "3072:Z3z1y2xWv...",
        tipo: "ssdeep",
      },
      {
        valor: "900150983cd24fb0d696...",
        tipo: "parcial_desconocido",
      },
    ],
  },
];
```

### Comprehensive Test Suite

```typescript
describe("Hash Detection Agent", () => {
  let agent: typeof hashDetectionAgent;

  beforeEach(() => {
    agent = hashDetectionAgent;
  });

  describe("Hash Classification Functionality", () => {
    testCases.forEach((testCase) => {
      it(`should classify hashes correctly from ${testCase.name}`, async () => {
        // No need to specify output schema - it's set as default
        const result = await agent.generate(testCase.input);

        const detectedHashes = result.object;

        // Verify structure
        expect(Array.isArray(detectedHashes)).toBe(true);
        expect(detectedHashes).toHaveLength(testCase.expected.length);

        // Verify each hash classification
        testCase.expected.forEach((expectedHash, index) => {
          const detectedHash = detectedHashes.find(
            (h) => h.valor === expectedHash.valor
          );
          expect(detectedHash).toBeDefined();
          expect(detectedHash?.tipo).toBe(expectedHash.tipo);
        });
      });
    });
  });

  describe("Context-Aware Hash Detection", () => {
    it("should distinguish between actual hashes and random hex strings", async () => {
      const contextualReport = `
        File analysis report:
        The malware hash MD5 is abc123def456abc123def456abc123def456.
        Memory address: 0x1234ABCD (this is not a hash).
        The configuration contains hex values: FF00FF00 (color codes).
        SHA-256 verification: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
      `;

      // No need to specify output schema - it's set as default
      const result = await agent.generate(contextualReport);

      const detectedHashes = result.object;

      // Should extract actual hashes, not random hex
      expect(detectedHashes).toHaveLength(2);
      expect(
        detectedHashes.some(
          (h) =>
            h.valor === "abc123def456abc123def456abc123def456" &&
            h.tipo === "MD5"
        )
      ).toBe(true);
      expect(
        detectedHashes.some(
          (h) =>
            h.valor ===
              "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" &&
            h.tipo === "SHA-256"
        )
      ).toBe(true);

      // Should not extract memory addresses or color codes
      expect(detectedHashes.some((h) => h.valor.includes("1234ABCD"))).toBe(
        false
      );
      expect(detectedHashes.some((h) => h.valor.includes("FF00FF00"))).toBe(
        false
      );
    });

    it("should handle multiline hashes correctly", async () => {
      const multilineReport = `
        Large hash detected across multiple lines:
        SHA-512: cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5
        d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e
        
        Another hash:
        MD5: d41d8cd98f00b204e9800998ecf8427e
      `;

      const result = await agent.generate(multilineReport, {
        output: hashDetectionOutputSchema,
      });

      const detectedHashes = result.object;

      expect(detectedHashes).toHaveLength(2);
      expect(
        detectedHashes.some(
          (h) =>
            h.valor ===
              "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e" &&
            h.tipo === "SHA-512"
        )
      ).toBe(true);
    });

    it("should identify truncated hashes correctly", async () => {
      const truncatedReport = `
        System log entry:
        Process blocked with hash: 900150983cd24fb0d696...
        Partial hash found: abc123def456abc123def456abc123...
        Complete hash: d41d8cd98f00b204e9800998ecf8427e
      `;

      const result = await agent.generate(truncatedReport, {
        output: hashDetectionOutputSchema,
      });

      const detectedHashes = result.object;

      expect(detectedHashes).toHaveLength(3);
      expect(
        detectedHashes.some(
          (h) =>
            h.valor === "900150983cd24fb0d696..." &&
            h.tipo === "parcial_desconocido"
        )
      ).toBe(true);
      expect(
        detectedHashes.some(
          (h) =>
            h.valor === "abc123def456abc123def456abc123..." &&
            h.tipo === "parcial_desconocido"
        )
      ).toBe(true);
      expect(
        detectedHashes.some(
          (h) =>
            h.valor === "d41d8cd98f00b204e9800998ecf8427e" && h.tipo === "MD5"
        )
      ).toBe(true);
    });

    it("should handle ssdeep fuzzy hashes", async () => {
      const ssdeepReport = `
        Fuzzy hash analysis:
        ssdeep: 3072:Z3z1y2xWv+TgE9F2m8x7z1y2xWv+TgE9F2m8x7:Z3z1y2xWv+TgE9F2m8x7
        Partial ssdeep: 1536:abc123def456:xyz789
        Truncated fuzzy: 768:XYZ123...
      `;

      const result = await agent.generate(ssdeepReport, {
        output: hashDetectionOutputSchema,
      });

      const detectedHashes = result.object;

      expect(detectedHashes.length).toBeGreaterThan(0);
      expect(detectedHashes.some((h) => h.tipo === "ssdeep")).toBe(true);
      expect(
        detectedHashes.some(
          (h) => h.valor.includes("3072:Z3z1y2xWv") && h.tipo === "ssdeep"
        )
      ).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty input", async () => {
      const result = await agent.generate("", {
        output: hashDetectionOutputSchema,
      });

      expect(result.object).toEqual([]);
    });

    it("should handle input with no hashes", async () => {
      const noHashReport =
        "This is a regular report with no cryptographic hashes mentioned.";

      const result = await agent.generate(noHashReport, {
        output: hashDetectionOutputSchema,
      });

      expect(result.object).toEqual([]);
    });

    it("should handle mixed languages", async () => {
      const mixedLanguageReport = `
        Hash analysis report:
        El hash MD5 es: d41d8cd98f00b204e9800998ecf8427e
        SHA-1 hash: da39a3ee5e6b4b0d3255bfef95601890afd80709
        Hash SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      `;

      const result = await agent.generate(mixedLanguageReport, {
        output: hashDetectionOutputSchema,
      });

      const detectedHashes = result.object;

      expect(detectedHashes).toHaveLength(3);
      expect(detectedHashes.some((h) => h.tipo === "MD5")).toBe(true);
      expect(detectedHashes.some((h) => h.tipo === "SHA-1")).toBe(true);
      expect(detectedHashes.some((h) => h.tipo === "SHA-256")).toBe(true);
    });
  });

  describe("Structured Output Validation", () => {
    it("should always return valid structured output", async () => {
      const result = await agent.generate(
        "MD5: d41d8cd98f00b204e9800998ecf8427e",
        {
          output: hashDetectionOutputSchema,
        }
      );

      const detectedHashes = result.object;

      // Schema validation guarantees structure
      expect(Array.isArray(detectedHashes)).toBe(true);
      detectedHashes.forEach((hash) => {
        expect(hash).toHaveProperty("valor");
        expect(hash).toHaveProperty("tipo");
        expect(typeof hash.valor).toBe("string");
        expect([
          "MD5",
          "SHA-1",
          "SHA-256",
          "SHA-512",
          "ssdeep",
          "parcial_desconocido",
        ]).toContain(hash.tipo);
      });
    });

    it("should validate schema compliance", async () => {
      const complexReport = `
        Multiple hash types:
        MD5: d41d8cd98f00b204e9800998ecf8427e
        SHA-1: da39a3ee5e6b4b0d3255bfef95601890afd80709
        Truncated: abc123...
      `;

      const result = await agent.generate(complexReport, {
        output: hashDetectionOutputSchema,
      });

      // Schema validation happens automatically
      const detectedHashes = result.object;
      const validationResult =
        hashDetectionOutputSchema.safeParse(detectedHashes);
      expect(validationResult.success).toBe(true);
    });
  });

  describe("Performance Tests", () => {
    it("should process large reports efficiently", async () => {
      const largeReport = `
        Extensive malware analysis report:
        ${Array.from(
          { length: 50 },
          (_, i) => `
          Sample ${i}: 
          MD5: ${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}
          SHA-256: ${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}
        `
        ).join("\n")}
      `;

      const startTime = Date.now();
      const result = await agent.generate(largeReport, {
        output: hashDetectionOutputSchema,
      });
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(30000); // 30 seconds

      const detectedHashes = result.object;
      expect(detectedHashes.length).toBeGreaterThan(0);
    });
  });
});
```

## Usage Examples

### Basic Usage with Structured Output

```typescript
// Example usage in application
const malwareReport = `
  Malware analysis results:
  MD5 hash: d41d8cd98f00b204e9800998ecf8427e
  SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  Truncated hash: 900150983cd24fb0d696...
`;

// No need to specify output schema - it's set as default
const result = await mastra.agents.hashDetectionAgent.generate(malwareReport);

// Guaranteed structured output
const detectedHashes = result.object;
console.log("Detected hashes:", detectedHashes);
// Output: [
//   { "valor": "d41d8cd98f00b204e9800998ecf8427e", "tipo": "MD5" },
//   { "valor": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "tipo": "SHA-256" },
//   { "valor": "900150983cd24fb0d696...", "tipo": "parcial_desconocido" }
// ]

// Type-safe processing
detectedHashes.forEach((hash) => {
  console.log(`Found ${hash.tipo} hash: ${hash.valor}`);
});
```

### Batch Processing with Classification

```typescript
// Process multiple reports with hash classification
const reports = [report1, report2, report3];

const results = await Promise.all(
  reports.map(async (report, index) => {
    try {
      // No need to specify output schema - it's set as default
      const result = await mastra.agents.hashDetectionAgent.generate(report);
      return { success: true, hashes: result.object, index };
    } catch (error) {
      return { success: false, error: error.message, index };
    }
  })
);

// Categorize all detected hashes
const categorizedHashes = {
  MD5: [],
  "SHA-1": [],
  "SHA-256": [],
  "SHA-512": [],
  ssdeep: [],
  parcial_desconocido: [],
};

results
  .filter((result) => result.success)
  .forEach((result) => {
    result.hashes.forEach((hash) => {
      categorizedHashes[hash.tipo].push(hash.valor);
    });
  });

console.log("Hash classification summary:", categorizedHashes);
```

### Integration with Cybersecurity Pipeline

```typescript
// Integration with broader security analysis workflow
const analyzeHashesInReports = async (reports: string[]) => {
  const allHashResults = await Promise.all(
    reports.map((report) =>
      // No need to specify output schema - it's set as default
      mastra.agents.hashDetectionAgent.generate(report)
    )
  );

  const allHashes = allHashResults.flatMap((result) => result.object);

  // Deduplicate and categorize
  const uniqueHashes = new Map<string, string>();
  allHashes.forEach((hash) => {
    uniqueHashes.set(hash.valor, hash.tipo);
  });

  // Generate analysis report
  const analysisReport = {
    totalHashes: uniqueHashes.size,
    hashTypes: {
      MD5: [...uniqueHashes.entries()].filter(([_, type]) => type === "MD5")
        .length,
      "SHA-1": [...uniqueHashes.entries()].filter(
        ([_, type]) => type === "SHA-1"
      ).length,
      "SHA-256": [...uniqueHashes.entries()].filter(
        ([_, type]) => type === "SHA-256"
      ).length,
      "SHA-512": [...uniqueHashes.entries()].filter(
        ([_, type]) => type === "SHA-512"
      ).length,
      ssdeep: [...uniqueHashes.entries()].filter(
        ([_, type]) => type === "ssdeep"
      ).length,
      parcial_desconocido: [...uniqueHashes.entries()].filter(
        ([_, type]) => type === "parcial_desconocido"
      ).length,
    },
    hashes: Array.from(uniqueHashes.entries()).map(([valor, tipo]) => ({
      valor,
      tipo,
    })),
  };

  return analysisReport;
};
```

## Key Benefits of This Approach

1. **Intelligent Context Recognition**: AI understands when hex strings are actually hashes vs. random data
2. **Truncation Handling**: Automatically identifies and classifies partial hashes
3. **Format Flexibility**: Handles multiline hashes, various presentations, and edge cases
4. **Structured Output Guarantee**: Zod schema ensures consistent, type-safe results
5. **Automatic Schema Enforcement**: `defaultGenerateOptions` ensures structured output by default - no need to specify schema in each call
6. **Multilingual Support**: Works with Spanish, English, and mixed-language reports
7. **Semantic Understanding**: Recognizes hash-related terminology and context
8. **Edge Case Management**: Handles unusual presentations and formats gracefully
9. **Performance Optimization**: Efficient processing of large technical reports
10. **Developer Experience**: Simplified API calls with guaranteed structured responses

## Advanced Features

### 1. Context-Aware Classification

- Distinguishes between actual hashes and random hexadecimal strings
- Recognizes hash-related terminology in multiple languages
- Handles implied context (e.g., "File analysis shows: abc123...")

### 2. Intelligent Truncation Detection

- Identifies partial hashes with "..." indicators
- Recognizes incomplete hashes from log entries
- Classifies ambiguous strings as "parcial_desconocido"

### 3. Format Normalization

- Combines multiline hashes into single strings
- Handles various spacing and formatting styles
- Preserves original hash values exactly as found

### 4. Quality Assurance

- Structured output prevents malformed results
- Type safety ensures consistent data handling
- Schema validation catches edge cases

## Performance Considerations

1. **Efficient Processing**: Single-pass analysis with structured output
2. **Memory Management**: Optimized for large technical reports
3. **Batch Processing**: Concurrent analysis of multiple reports
4. **Response Speed**: Fast classification without regex complexity
5. **Scalability**: Handles varying report sizes and formats

## Security Considerations

1. **Data Integrity**: Preserves exact hash values for forensic accuracy
2. **Context Validation**: Prevents false positives from random hex strings
3. **Audit Trail**: Memory system tracks all classifications
4. **Schema Compliance**: Guaranteed output format prevents injection issues
5. **Forensic Accuracy**: Maintains hash integrity for security analysis

This approach leverages AI's superior context understanding while ensuring reliable, structured output through Zod schema validation. By using `defaultGenerateOptions` to enforce the output schema by default, the agent provides a streamlined developer experience with guaranteed structured responses, making it ideal for cybersecurity applications where accuracy and consistency are paramount.
