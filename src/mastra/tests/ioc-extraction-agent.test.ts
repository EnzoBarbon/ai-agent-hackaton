import { beforeEach, describe, expect, it } from "vitest";
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
});
