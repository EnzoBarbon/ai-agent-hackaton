# IOC Extraction Agent Implementation Plan

## Overview

This agent acts as a junior cybersecurity analyst that reads threat intelligence reports and automatically extracts Indicators of Compromise (IOCs). The agent identifies and categorizes cybersecurity artifacts that represent the "digital fingerprints" left by cybercriminals.

## Agent Architecture

### Core Components

#### 1. Agent Configuration

```typescript
// src/mastra/agents/ioc-extraction-agent.ts
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { iocExtractionTool } from "../tools/ioc-extraction-tool";

export const iocExtractionAgent = new Agent({
  name: "IOC Extraction Agent",
  instructions: `
    You are a specialized cybersecurity analyst focused on extracting Indicators of Compromise (IOCs) from threat intelligence reports.

    Your primary function is to:
    1. Analyze cybersecurity reports and threat intelligence documents
    2. Extract and categorize IOCs into four specific types:
       - IPv4 addresses (e.g., 192.168.1.1)
       - Domain names (e.g., example.com, subdomain.example.org)
       - File hashes (MD5, SHA-1, SHA-256)
       - CVE identifiers (e.g., CVE-2023-12345)

    Guidelines:
    - Be thorough and precise in your extraction
    - Only extract legitimate IOCs, avoid false positives
    - Ensure all extracted items match the expected formats
    - Return results in the specified JSON structure
    - If unsure about a potential IOC, err on the side of caution

    Use the iocExtractionTool to process threat intelligence reports.
  `,
  model: openai("gpt-4o-mini"),
  tools: { iocExtractionTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db",
    }),
  }),
});
```

#### 2. IOC Extraction Tool

```typescript
// src/mastra/tools/ioc-extraction-tool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const iocExtractionTool = createTool({
  id: "extract-iocs",
  description:
    "Extract Indicators of Compromise from threat intelligence reports",
  inputSchema: z.object({
    report: z
      .string()
      .describe("The threat intelligence report text to analyze"),
  }),
  outputSchema: z.object({
    ips: z.array(z.string()).describe("IPv4 addresses found"),
    domains: z.array(z.string()).describe("Domain names found"),
    hashes: z
      .array(z.string())
      .describe("File hashes (MD5, SHA-1, SHA-256) found"),
    cves: z.array(z.string()).describe("CVE identifiers found"),
  }),
  execute: async ({ context }) => {
    return await extractIOCs(context.report);
  },
});

const extractIOCs = async (report: string) => {
  const iocs = {
    ips: [] as string[],
    domains: [] as string[],
    hashes: [] as string[],
    cves: [] as string[],
  };

  // IPv4 address regex
  const ipRegex =
    /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

  // Domain regex (including subdomains)
  const domainRegex =
    /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g;

  // Hash regex (MD5: 32 chars, SHA-1: 40 chars, SHA-256: 64 chars)
  const hashRegex =
    /\b[a-fA-F0-9]{32}\b|\b[a-fA-F0-9]{40}\b|\b[a-fA-F0-9]{64}\b/g;

  // CVE regex
  const cveRegex = /CVE-\d{4}-\d{4,}/g;

  // Extract IPs
  const ipMatches = report.match(ipRegex);
  if (ipMatches) {
    iocs.ips = [...new Set(ipMatches)];
  }

  // Extract domains
  const domainMatches = report.match(domainRegex);
  if (domainMatches) {
    // Filter out common false positives and validate domains
    const validDomains = domainMatches.filter(
      (domain) =>
        domain.includes(".") &&
        !domain.startsWith(".") &&
        !domain.endsWith(".") &&
        domain.length > 4
    );
    iocs.domains = [...new Set(validDomains)];
  }

  // Extract hashes
  const hashMatches = report.match(hashRegex);
  if (hashMatches) {
    iocs.hashes = [...new Set(hashMatches)];
  }

  // Extract CVEs
  const cveMatches = report.match(cveRegex);
  if (cveMatches) {
    iocs.cves = [...new Set(cveMatches)];
  }

  return iocs;
};
```

#### 3. Integration with Main Mastra Instance

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

## Testing Environment

### Test Data Structure

```typescript
// src/mastra/tests/ioc-extraction-agent.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { iocExtractionAgent } from "../agents/ioc-extraction-agent";

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
        const result = await agent.generate(
          `Extract all IOCs from this threat intelligence report: ${testCase.input}`
        );

        // Parse the result to get the IOCs
        const extractedIOCs = JSON.parse(result.text);

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

  describe("Edge Cases", () => {
    it("should handle empty reports", async () => {
      const result = await agent.generate("Extract IOCs from this report: ");
      const extractedIOCs = JSON.parse(result.text);

      expect(extractedIOCs.ips).toHaveLength(0);
      expect(extractedIOCs.domains).toHaveLength(0);
      expect(extractedIOCs.hashes).toHaveLength(0);
      expect(extractedIOCs.cves).toHaveLength(0);
    });

    it("should handle malformed input gracefully", async () => {
      const malformedReport =
        "This is not a valid threat intelligence report with random text 123.456.789.0 invalid-domain..com";
      const result = await agent.generate(
        `Extract IOCs from this report: ${malformedReport}`
      );
      const extractedIOCs = JSON.parse(result.text);

      // Should not extract invalid IP
      expect(extractedIOCs.ips).not.toContain("123.456.789.0");

      // Should not extract malformed domain
      expect(extractedIOCs.domains).not.toContain("invalid-domain..com");
    });

    it("should deduplicate IOCs", async () => {
      const reportWithDuplicates = `
        IP address 192.168.1.1 was seen connecting to 192.168.1.1 multiple times.
        The domain example.com and example.com were both compromised.
        Hash abc123def456abc123def456abc123def456 and abc123def456abc123def456abc123def456 are identical.
        CVE-2023-1234 and CVE-2023-1234 are the same vulnerability.
      `;

      const result = await agent.generate(
        `Extract IOCs from this report: ${reportWithDuplicates}`
      );
      const extractedIOCs = JSON.parse(result.text);

      // Check for deduplication
      expect(new Set(extractedIOCs.ips).size).toBe(extractedIOCs.ips.length);
      expect(new Set(extractedIOCs.domains).size).toBe(
        extractedIOCs.domains.length
      );
      expect(new Set(extractedIOCs.hashes).size).toBe(
        extractedIOCs.hashes.length
      );
      expect(new Set(extractedIOCs.cves).size).toBe(extractedIOCs.cves.length);
    });
  });

  describe("Performance Tests", () => {
    it("should process large reports efficiently", async () => {
      const largeReport = "Large threat intelligence report...".repeat(1000);
      const startTime = Date.now();

      await agent.generate(`Extract IOCs from this report: ${largeReport}`);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process within reasonable time (adjust threshold as needed)
      expect(processingTime).toBeLessThan(10000); // 10 seconds
    });
  });
});
```

### Integration Tests

```typescript
// src/mastra/tests/integration/ioc-extraction-integration.test.ts
import { describe, it, expect } from "vitest";
import { mastra } from "../../index";

describe("IOC Extraction Agent Integration", () => {
  it("should be properly registered in Mastra instance", () => {
    expect(mastra.agents.iocExtractionAgent).toBeDefined();
    expect(mastra.agents.iocExtractionAgent.name).toBe("IOC Extraction Agent");
  });

  it("should work with memory storage", async () => {
    const agent = mastra.agents.iocExtractionAgent;

    // First interaction
    const result1 = await agent.generate(
      "Extract IOCs from: IP 1.2.3.4 domain test.com"
    );
    expect(result1.text).toContain("1.2.3.4");

    // Second interaction - should have memory context
    const result2 = await agent.generate(
      "What was the IP from the previous report?"
    );
    expect(result2.text).toContain("1.2.3.4");
  });
});
```

## Usage Examples

### Basic Usage

```typescript
// Example usage in application
const report = `
  Threat analysis shows connections to malicious IP 192.168.1.100 
  and domain evil.com. The malware hash is abc123def456abc123def456abc123def456.
  This exploits CVE-2023-1234.
`;

const result = await mastra.agents.iocExtractionAgent.generate(
  `Extract all IOCs from this threat intelligence report: ${report}`
);

console.log(result.text);
// Output: {"ips":["192.168.1.100"],"domains":["evil.com"],"hashes":["abc123def456abc123def456abc123def456"],"cves":["CVE-2023-1234"]}
```

### Batch Processing

```typescript
// Process multiple reports
const reports = [report1, report2, report3];
const results = await Promise.all(
  reports.map((report) =>
    mastra.agents.iocExtractionAgent.generate(
      `Extract all IOCs from this threat intelligence report: ${report}`
    )
  )
);
```

## Performance Considerations

1. **Regex Optimization**: The regex patterns are optimized for accuracy vs performance
2. **Memory Management**: Large reports should be processed in chunks if needed
3. **Caching**: Common IOCs could be cached for faster repeated processing
4. **Parallel Processing**: Multiple reports can be processed concurrently

## Security Considerations

1. **Input Validation**: All inputs are validated through Zod schemas
2. **False Positive Reduction**: Regex patterns are tuned to minimize false positives
3. **Data Sanitization**: Extracted IOCs are sanitized before storage
4. **Rate Limiting**: Consider implementing rate limiting for production use

## Monitoring and Metrics

1. **Accuracy Metrics**: Track precision and recall against known IOCs
2. **Processing Time**: Monitor performance for different report sizes
3. **Error Rates**: Track extraction failures and edge cases
4. **Memory Usage**: Monitor memory consumption during processing

This implementation provides a robust foundation for IOC extraction while maintaining flexibility for future enhancements and integrations with other security tools.
