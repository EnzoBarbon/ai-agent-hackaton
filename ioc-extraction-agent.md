# IOC Extraction Agent Implementation Plan

## Overview

This agent acts as a junior cybersecurity analyst that reads threat intelligence reports and automatically extracts Indicators of Compromise (IOCs) using its AI understanding of cybersecurity contexts. The agent analyzes the semantic meaning of the text to identify cybersecurity artifacts that represent "digital fingerprints" left by cybercriminals.

## Agent Architecture

### Core Agent Configuration

```typescript
// src/mastra/agents/ioc-extraction-agent.ts
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";

// Define the structured output schema
export const iocOutputSchema = z.object({
  ips: z
    .array(z.string())
    .describe("IPv4 addresses found in the threat intelligence report"),
  domains: z
    .array(z.string())
    .describe("Domain names found in the threat intelligence report"),
  hashes: z
    .array(z.string())
    .describe(
      "File hashes (MD5, SHA-1, SHA-256) found in the threat intelligence report"
    ),
  cves: z
    .array(z.string())
    .describe("CVE identifiers found in the threat intelligence report"),
});

export const iocExtractionAgent = new Agent({
  name: "IOC Extraction Agent",
  instructions: `
    You are a specialized cybersecurity analyst focused on extracting Indicators of Compromise (IOCs) from threat intelligence reports.

    Your role is to:
    1. Analyze cybersecurity reports and threat intelligence documents
    2. Use your understanding of cybersecurity contexts to identify IOCs
    3. Extract and categorize IOCs into these four specific types:
       - IPv4 addresses (e.g., 192.168.1.1, 10.0.0.1)
       - Domain names (e.g., example.com, subdomain.example.org, malicious-site.net)
       - File hashes (MD5, SHA-1, SHA-256 - any cryptographic hash of files)
       - CVE identifiers (e.g., CVE-2023-12345, CVE-2024-30103)

    IMPORTANT GUIDELINES:
    - Use your AI understanding to identify IOCs in context, not just pattern matching
    - Understand that IPs mentioned as "servers", "C2", "command and control", or "malicious" are likely IOCs
    - Recognize that domains described as "malicious", "phishing", "C2", or "compromised" are IOCs
    - Identify hashes mentioned in the context of malware, files, or samples
    - Look for CVE identifiers that represent vulnerabilities being exploited
    - Avoid extracting legitimate/benign infrastructure (like DNS servers 8.8.8.8 unless clearly malicious)
    - Consider the context - a hash mentioned as "malware hash" is an IOC, but a hash used for verification might not be

    You will always return a structured response with the exact format:
    {
      "ips": ["ip1", "ip2"],
      "domains": ["domain1", "domain2"],
      "hashes": ["hash1", "hash2"],
      "cves": ["CVE-2023-1234", "CVE-2024-5678"]
    }

    Be thorough but precise. Only extract items that are clearly IOCs based on their context in the threat intelligence report.
  `,
  model: openai("gpt-4o-mini"),
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db",
    }),
  }),
});
```

### Integration with Main Mastra Instance

```typescript
// src/mastra/index.ts (updated)
import { iocExtractionAgent } from "./agents/ioc-extraction-agent";

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: {
    weatherAgent,
    iocExtractionAgent,
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

## Why This Approach Works

### AI-Powered Context Understanding

- The agent uses its language understanding to identify IOCs based on **context**, not just patterns
- It can distinguish between malicious IPs and legitimate infrastructure
- It understands cybersecurity terminology and identifies threats accordingly
- It can handle variations in how IOCs are presented in reports

### Structured Output Guarantee

- **Zod Schema Validation**: Ensures the response always matches the expected JSON structure
- **Type Safety**: The structured output is validated and type-safe
- **Reliability**: No risk of malformed JSON or missing fields
- **Consistent Integration**: Easy to parse and use in downstream systems

### Advantages Over Regex-Based Tools

1. **Contextual Intelligence**: Understands that "185.22.15.6" is an IOC when described as "malicious IP" but might not be when mentioned as "DNS server"
2. **Semantic Understanding**: Recognizes threat intelligence language patterns
3. **Flexible Format Handling**: Can extract IOCs even when they're presented in unusual formats
4. **Domain Knowledge**: Leverages cybersecurity knowledge to make intelligent decisions

## Testing Environment

### Test Data Structure

```typescript
// src/mastra/tests/ioc-extraction-agent.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  iocExtractionAgent,
  iocOutputSchema,
} from "../agents/ioc-extraction-agent";

interface TestCase {
  name: string;
  input: string;
  expected: {
    ips: string[];
    domains: string[];
    hashes: string[];
    cves: string[];
  };
}

const testCases: TestCase[] = [
  {
    name: "Silent Serpent Campaign",
    input: `*** INFORME DE AMENAZA: Grupo 'Silent Serpent' - Q1 2025 ***

Análisis de la reciente campaña de espionaje atribuida al grupo APT "Silent Serpent". El vector de entrada principal fue la explotación de la vulnerabilidad CVE-2024-30103 en servidores de correo.

Una vez dentro, los actores desplegaron un malware dropper. El fichero, 'update_installer.dll', presenta el siguiente hash SHA256:
a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2

La comunicación con el servidor de Comando y Control (C2) se estableció con los siguientes dominios:
- system-update.ddns.net
- cdn.content-delivery.org

Se observó tráfico de red hacia la dirección IP 185.22.15.6. El análisis de un segundo artefacto, 'connector.exe' (MD5: f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4), reveló conexiones adicionales a auth.internal-service.net y a la IP 8.8.4.4.

---
*** ALERTA DE PHISHING MASIVO - Campaña 'GiftCardScam' ***

Detectada una campaña de phishing a gran escala. Los dominios utilizados para alojar las páginas de phishing son:
- your-special-reward.com
- login.micr0soft.security-access.com

Los enlaces maliciosos redirigen a servidores bajo el control de los atacantes, localizados en las IPs 199.59.243.222 y 45.137.21.53.

Se recomienda a los usuarios no descargar adjuntos. Uno de los adjuntos analizados, 'regalo.zip', contenía un payload con hash SHA256 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef.

La campaña explota la vulnerabilidad CVE-2023-99999 para la ejecución de código en clientes de correo desactualizados. También se ha detectado el uso del hash de fichero 9876543210fedcba9876543210fedcba (MD5).`,
    expected: {
      ips: ["185.22.15.6", "8.8.4.4", "199.59.243.222", "45.137.21.53"],
      domains: [
        "system-update.ddns.net",
        "cdn.content-delivery.org",
        "auth.internal-service.net",
        "your-special-reward.com",
        "login.micr0soft.security-access.com",
      ],
      hashes: [
        "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        "f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4",
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        "9876543210fedcba9876543210fedcba",
      ],
      cves: ["CVE-2024-30103", "CVE-2023-99999"],
    },
  },
];
```

### Test Suite Implementation

```typescript
describe("IOC Extraction Agent", () => {
  let agent: typeof iocExtractionAgent;

  beforeEach(() => {
    agent = iocExtractionAgent;
  });

  describe("IOC Extraction Functionality", () => {
    testCases.forEach((testCase) => {
      it(`should extract IOCs correctly from ${testCase.name}`, async () => {
        const result = await agent.generate(testCase.input, {
          output: iocOutputSchema,
        });

        // The structured output guarantees the format
        const extractedIOCs = result.object;

        // Verify structure is automatically guaranteed by Zod schema
        expect(extractedIOCs).toHaveProperty("ips");
        expect(extractedIOCs).toHaveProperty("domains");
        expect(extractedIOCs).toHaveProperty("hashes");
        expect(extractedIOCs).toHaveProperty("cves");

        // Verify all arrays are present (even if empty)
        expect(Array.isArray(extractedIOCs.ips)).toBe(true);
        expect(Array.isArray(extractedIOCs.domains)).toBe(true);
        expect(Array.isArray(extractedIOCs.hashes)).toBe(true);
        expect(Array.isArray(extractedIOCs.cves)).toBe(true);

        // Verify IPs
        expect(extractedIOCs.ips).toEqual(
          expect.arrayContaining(testCase.expected.ips)
        );
        expect(extractedIOCs.ips).toHaveLength(testCase.expected.ips.length);

        // Verify domains
        expect(extractedIOCs.domains).toEqual(
          expect.arrayContaining(testCase.expected.domains)
        );
        expect(extractedIOCs.domains).toHaveLength(
          testCase.expected.domains.length
        );

        // Verify hashes
        expect(extractedIOCs.hashes).toEqual(
          expect.arrayContaining(testCase.expected.hashes)
        );
        expect(extractedIOCs.hashes).toHaveLength(
          testCase.expected.hashes.length
        );

        // Verify CVEs
        expect(extractedIOCs.cves).toEqual(
          expect.arrayContaining(testCase.expected.cves)
        );
        expect(extractedIOCs.cves).toHaveLength(testCase.expected.cves.length);
      });
    });
  });

  describe("Context-Aware Extraction", () => {
    it("should distinguish between malicious and legitimate IPs", async () => {
      const contextualReport = `
        The malware connects to C2 server at 192.168.1.100.
        DNS resolution was performed using Google's public DNS at 8.8.8.8.
        Additional malicious traffic was observed to 10.0.0.50.
      `;

      const result = await agent.generate(contextualReport, {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      // Should extract malicious IPs but not necessarily the DNS server
      expect(extractedIOCs.ips).toContain("192.168.1.100");
      expect(extractedIOCs.ips).toContain("10.0.0.50");
      // Google DNS might or might not be included depending on context
    });

    it("should identify domains based on malicious context", async () => {
      const domainReport = `
        The phishing campaign uses malicious domains:
        - evil-phishing.com
        - fake-bank.net
        
        The legitimate bank's actual website is realbank.com.
        Users are redirected from trusted-site.org to the malicious domains.
      `;

      const result = await agent.generate(domainReport, {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      // Should identify malicious domains
      expect(extractedIOCs.domains).toContain("evil-phishing.com");
      expect(extractedIOCs.domains).toContain("fake-bank.net");
      // Legitimate sites might not be included unless clearly compromised
    });

    it("should extract hashes mentioned in malware context", async () => {
      const hashReport = `
        The malware sample has MD5 hash: abc123def456abc123def456abc123def456
        File verification hash for legitimate software: def456abc123def456abc123def456abc123
        The dropper's SHA-256 is: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
      `;

      const result = await agent.generate(hashReport, {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      // Should extract malware hashes
      expect(extractedIOCs.hashes).toContain(
        "abc123def456abc123def456abc123def456"
      );
      expect(extractedIOCs.hashes).toContain(
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      );
      // Verification hash might not be included unless clearly malicious
    });
  });

  describe("Structured Output Validation", () => {
    it("should always return valid structured output", async () => {
      const result = await agent.generate("", {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      // Schema validation guarantees these properties exist
      expect(extractedIOCs).toHaveProperty("ips");
      expect(extractedIOCs).toHaveProperty("domains");
      expect(extractedIOCs).toHaveProperty("hashes");
      expect(extractedIOCs).toHaveProperty("cves");

      // All should be arrays
      expect(Array.isArray(extractedIOCs.ips)).toBe(true);
      expect(Array.isArray(extractedIOCs.domains)).toBe(true);
      expect(Array.isArray(extractedIOCs.hashes)).toBe(true);
      expect(Array.isArray(extractedIOCs.cves)).toBe(true);
    });

    it("should handle reports with no IOCs", async () => {
      const benignReport =
        "This is a general IT report about system maintenance and updates.";
      const result = await agent.generate(benignReport, {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      expect(extractedIOCs.ips).toHaveLength(0);
      expect(extractedIOCs.domains).toHaveLength(0);
      expect(extractedIOCs.hashes).toHaveLength(0);
      expect(extractedIOCs.cves).toHaveLength(0);
    });

    it("should validate schema compliance", async () => {
      const complexReport = `
        Complex threat report with various IOCs:
        - Malicious IP: 1.2.3.4
        - Domain: test.com
        - Hash: abcdef123456abcdef123456abcdef123456
        - CVE: CVE-2023-1234
      `;

      const result = await agent.generate(complexReport, {
        output: iocOutputSchema,
      });

      // Schema validation happens automatically
      const extractedIOCs = result.object;

      // Validate the schema parse succeeded
      const validationResult = iocOutputSchema.safeParse(extractedIOCs);
      expect(validationResult.success).toBe(true);
    });
  });

  describe("Performance Tests", () => {
    it("should process large reports efficiently", async () => {
      const largeReport = `
        Large threat intelligence report with multiple IOCs:
        ${Array.from(
          { length: 100 },
          (_, i) => `
          Malicious IP ${i}: 192.168.${i % 256}.${(i + 1) % 256}
          Domain ${i}: evil${i}.com
          Hash ${i}: ${"a".repeat(32)}
          CVE ${i}: CVE-2023-${1000 + i}
        `
        ).join("\n")}
      `;

      const startTime = Date.now();
      const result = await agent.generate(largeReport, {
        output: iocOutputSchema,
      });
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(30000); // 30 seconds

      const extractedIOCs = result.object;
      expect(extractedIOCs.ips.length).toBeGreaterThan(0);
      expect(extractedIOCs.domains.length).toBeGreaterThan(0);
      expect(extractedIOCs.hashes.length).toBeGreaterThan(0);
      expect(extractedIOCs.cves.length).toBeGreaterThan(0);
    });
  });
});
```

### Integration Tests

```typescript
// src/mastra/tests/integration/ioc-extraction-integration.test.ts
import { describe, it, expect } from "vitest";
import { mastra } from "../../index";
import { iocOutputSchema } from "../../agents/ioc-extraction-agent";

describe("IOC Extraction Agent Integration", () => {
  it("should be properly registered in Mastra instance", () => {
    expect(mastra.agents.iocExtractionAgent).toBeDefined();
    expect(mastra.agents.iocExtractionAgent.name).toBe("IOC Extraction Agent");
  });

  it("should work with memory storage and structured output", async () => {
    const agent = mastra.agents.iocExtractionAgent;

    // First interaction with structured output
    const result1 = await agent.generate(
      "Malicious IP 1.2.3.4 connected to evil.com",
      {
        output: iocOutputSchema,
        memory: {
          thread: "test-thread-1",
          resource: "user-123",
        },
      }
    );

    expect(result1.object.ips).toContain("1.2.3.4");
    expect(result1.object.domains).toContain("evil.com");

    // Second interaction - should have memory context
    const result2 = await agent.generate(
      "What was the malicious IP from the previous report?",
      {
        memory: {
          thread: "test-thread-1",
          resource: "user-123",
        },
      }
    );

    expect(result2.text).toContain("1.2.3.4");
  });
});
```

## Usage Examples

### Basic Usage with Structured Output

```typescript
// Example usage in application
const threatReport = `
  APT group used malicious domain evil.com and IP 192.168.1.100.
  The malware hash is abc123def456abc123def456abc123def456.
  They exploited CVE-2023-1234.
`;

const result = await mastra.agents.iocExtractionAgent.generate(threatReport, {
  output: iocOutputSchema,
});

// Guaranteed structured output
const iocs = result.object;
console.log("Extracted IOCs:", iocs);
// Output: {
//   "ips": ["192.168.1.100"],
//   "domains": ["evil.com"],
//   "hashes": ["abc123def456abc123def456abc123def456"],
//   "cves": ["CVE-2023-1234"]
// }

// Type-safe access
iocs.ips.forEach((ip) => console.log(`Found malicious IP: ${ip}`));
iocs.domains.forEach((domain) =>
  console.log(`Found malicious domain: ${domain}`)
);
```

### Batch Processing with Error Handling

```typescript
// Process multiple reports with structured output guarantee
const reports = [report1, report2, report3];

const results = await Promise.all(
  reports.map(async (report, index) => {
    try {
      const result = await mastra.agents.iocExtractionAgent.generate(report, {
        output: iocOutputSchema,
      });
      return { success: true, iocs: result.object, index };
    } catch (error) {
      return { success: false, error: error.message, index };
    }
  })
);

// Combine all successful extractions
const allIocs = results
  .filter((result) => result.success)
  .map((result) => result.iocs);

const combinedIocs = {
  ips: [...new Set(allIocs.flatMap((ioc) => ioc.ips))],
  domains: [...new Set(allIocs.flatMap((ioc) => ioc.domains))],
  hashes: [...new Set(allIocs.flatMap((ioc) => ioc.hashes))],
  cves: [...new Set(allIocs.flatMap((ioc) => ioc.cves))],
};
```

### Integration with Workflow

```typescript
// Use in a cybersecurity analysis workflow with guaranteed structure
const analyzeThreats = async (reports: string[]) => {
  const iocResults = await Promise.all(
    reports.map((report) =>
      mastra.agents.iocExtractionAgent.generate(report, {
        output: iocOutputSchema,
      })
    )
  );

  // Type-safe access to structured results
  const allIocs = iocResults.map((result) => result.object);

  // Combine and deduplicate IOCs with confidence in structure
  const combinedIocs = {
    ips: [...new Set(allIocs.flatMap((ioc) => ioc.ips))],
    domains: [...new Set(allIocs.flatMap((ioc) => ioc.domains))],
    hashes: [...new Set(allIocs.flatMap((ioc) => ioc.hashes))],
    cves: [...new Set(allIocs.flatMap((ioc) => ioc.cves))],
  };

  return combinedIocs;
};
```

## Key Benefits of This Approach

1. **Intelligent Context Understanding**: The agent understands cybersecurity context, not just pattern matching
2. **Structured Output Guarantee**: Zod schema ensures the response is always in the correct format
3. **Type Safety**: Full TypeScript support with proper typing
4. **Semantic Analysis**: Can distinguish between malicious and legitimate infrastructure
5. **Flexible Input Handling**: Works with various report formats and languages
6. **Domain Expertise**: Leverages AI's understanding of cybersecurity terminology
7. **Reliable Integration**: Consistent JSON structure for downstream systems
8. **Error Prevention**: No risk of malformed JSON or missing fields

## Performance Considerations

1. **Token Efficiency**: Agent processes text efficiently without unnecessary tool calls
2. **Memory Management**: Uses memory to learn from previous interactions
3. **Batch Processing**: Can handle multiple reports concurrently
4. **Response Format**: Consistent structured output for easy integration
5. **Schema Validation**: Fast Zod validation ensures data integrity

## Security Considerations

1. **Context Validation**: AI validates IOCs based on threat context
2. **False Positive Reduction**: Intelligent analysis reduces false positives
3. **Data Integrity**: Structured output ensures data consistency
4. **Audit Trail**: Memory system tracks all extractions for audit purposes
5. **Schema Compliance**: Guaranteed response format prevents injection attacks

This approach leverages the AI agent's intelligence for the core cybersecurity analysis work while ensuring reliable, structured output through Zod schema validation, making it a true AI-powered solution with enterprise-grade reliability.
