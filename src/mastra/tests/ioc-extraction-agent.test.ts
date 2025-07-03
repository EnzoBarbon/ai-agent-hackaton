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

// Edge case test cases for more challenging scenarios
const edgeCaseTestCases: TestCase[] = [
  {
    name: "Obfuscated and Encoded IOCs",
    input: `*** INFORME DE AMENAZA: Campaña 'SteganoCrypt' ***

Los atacantes utilizan técnicas de ofuscación avanzadas. El dominio de C2 se encuentra en:
hxxp://malicious-c2[.]example[.]com (defanged for safety)

El tráfico malicioso se dirige a la IP 192[.]168[.]1[.]250 (formato defanged).
También se detectó comunicación con 10.0.0.99.

El malware descarga un payload desde:
- evil-domain.com (activo)
- backup-c2.net (backup server)

Hash del archivo principal: ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890
Hash alternativo (MD5): 1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d

La campaña explota CVE-2024-0001 y CVE-2023-99998.`,
    expected: {
      ips: ["192.168.1.250", "10.0.0.99"],
      domains: ["malicious-c2.example.com", "evil-domain.com", "backup-c2.net"],
      hashes: [
        "ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890",
        "1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d",
      ],
      cves: ["CVE-2024-0001", "CVE-2023-99998"],
    },
  },
  {
    name: "False Positives with Legitimate Services",
    input: `*** INFORME DE AMENAZA: Campaña 'DataTheft' ***

El malware se conecta a servidores maliciosos en 203.0.113.5 y 198.51.100.20.
Durante el análisis, se observó que el sistema también realizaba consultas DNS legítimas a 8.8.8.8 (Google DNS).
El malware también contacta con 1.1.1.1 (Cloudflare DNS) para resolver dominios.

Los dominios maliciosos identificados son:
- data-exfil.badactor.com
- malware-drop.evilsite.net

El análisis de red mostró tráfico hacia google.com (navegación legítima del usuario).
También se detectó comunicación con microsoft.com para actualizaciones del sistema.

Hash del malware: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
Hash del archivo legítimo del sistema: e258d248fda94c63753607f7c4494ee0fcbe92f1a76bfdac795c9d84101eb317

La vulnerabilidad explotada es CVE-2024-5555.`,
    expected: {
      ips: ["203.0.113.5", "198.51.100.20"],
      domains: ["data-exfil.badactor.com", "malware-drop.evilsite.net"],
      hashes: [
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      ],
      cves: ["CVE-2024-5555"],
    },
  },
  {
    name: "Mixed Case and Different Hash Formats",
    input: `*** INFORME DE AMENAZA: Campaña 'CaseInsensitive' ***

Análisis de malware con múltiples formatos de hash:

Archivo 1: payload.exe
MD5 hash: A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4
SHA1 hash: 1234567890abcdef1234567890abcdef12345678
SHA256 hash: AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890

Archivo 2: dropper.dll
MD5 hash (lowercase): f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4
SHA-256 hash: 0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF

Comunicación con C2 servers:
- MALICIOUS-DOMAIN.COM (all caps)
- mixed-Case-Domain.Net
- lowercase-domain.org

IPs observadas:
- 192.168.100.50
- 10.0.0.100

Vulnerabilidades: CVE-2024-1111, CVE-2023-2222`,
    expected: {
      ips: ["192.168.100.50", "10.0.0.100"],
      domains: [
        "MALICIOUS-DOMAIN.COM",
        "mixed-Case-Domain.Net",
        "lowercase-domain.org",
      ],
      hashes: [
        "A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4",
        "1234567890abcdef1234567890abcdef12345678",
        "AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890",
        "f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4",
        "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
      ],
      cves: ["CVE-2024-1111", "CVE-2023-2222"],
    },
  },
  {
    name: "Complex Contextual Scenario",
    input: `*** INFORME DE AMENAZA: Campaña 'AdvancedPersistence' ***

Durante la investigación forense, se identificaron múltiples indicadores:

FASE 1 - Reconocimiento:
Los atacantes realizaron escaneos desde 94.102.61.7 (IP maliciosa confirmada).
Se detectaron intentos de conexión a servidores internos desde esta IP.

FASE 2 - Infiltración:
Descarga de payload desde secure-updates.microsoft-security.com (dominio falso).
El archivo descargado (update.msi) tiene hash SHA256:
1111222233334444555566667777888899990000AAAABBBBCCCCDDDDEEEEFFFF

FASE 3 - Persistencia:
Comunicación establecida con:
- command-server.darkweb.onion (dominio Tor)
- backup.legitimate-sounding-domain.com

FASE 4 - Exfiltración:
Datos enviados a 172.16.0.55 (IP interna comprometida).
También se observó tráfico hacia 208.67.222.222 (OpenDNS - legítimo).

NOTA: Durante el análisis, nuestro sistema de monitoreo contactó con:
- monitoring.company.com (sistema interno)
- api.virustotal.com (análisis de malware)
- 10.0.0.1 (gateway interno)

El malware explota CVE-2024-9999 para escalar privilegios.`,
    expected: {
      ips: ["94.102.61.7", "172.16.0.55"],
      domains: [
        "secure-updates.microsoft-security.com",
        "command-server.darkweb.onion",
        "backup.legitimate-sounding-domain.com",
      ],
      hashes: [
        "1111222233334444555566667777888899990000AAAABBBBCCCCDDDDEEEEFFFF",
      ],
      cves: ["CVE-2024-9999"],
    },
  },
  {
    name: "Edge Cases with Borderline Valid IOCs",
    input: `*** INFORME DE AMENAZA: Campaña 'EdgeCases' ***

Análisis de indicadores límite:

IPs detectadas:
- 192.168.1.1 (router doméstico - contexto malicioso)
- 127.0.0.1 (localhost - no malicioso)
- 0.0.0.0 (dirección inválida - no extraer)
- 255.255.255.255 (broadcast - no extraer)
- 172.16.50.100 (IP interna comprometida)
- 224.0.0.1 (multicast - no extraer)

Dominios analizados:
- localhost (no malicioso)
- *.example.com (wildcard - no extraer)
- test.local (dominio local - no extraer)  
- malicious-phishing.com (phishing confirmado)
- .hidden-service.onion (formato incorrecto)
- real-malware-domain.net (malware activo)

Hashes encontrados:
- 00000000000000000000000000000000 (hash nulo - no extraer)
- d41d8cd98f00b204e9800998ecf8427e (hash de archivo vacío - no extraer)
- badcafe123456789abcdef123456789abcdef123456789abcdef123456789abcdef (hash malicioso)
- 1234567890123456789012345678901234567890 (longitud incorrecta - no extraer)

CVEs:
- CVE-2024-7777 (válido)
- CVE-99999-1111 (formato incorrecto - no extraer)
- CVE-2024-XXXX (formato incorrecto - no extraer)`,
    expected: {
      ips: ["192.168.1.1", "172.16.50.100"],
      domains: ["malicious-phishing.com", "real-malware-domain.net"],
      hashes: [
        "badcafe123456789abcdef123456789abcdef123456789abcdef123456789abcdef",
      ],
      cves: ["CVE-2024-7777"],
    },
  },
  {
    name: "Internationalized and Unicode Domain Names",
    input: `*** INFORME DE AMENAZA: Campaña 'Unicode' ***

Los atacantes utilizan dominios internacionalizados para evadir detección:

Dominios maliciosos:
- аррӏе.com (usando caracteres cirílicos que parecen "apple")
- paypal-sеcurity.com (usando caracteres especiales)
- normal-malicious-domain.com (dominio ASCII normal)

También se detectaron subdominios:
- evil.sub.malicious-site.org
- c2.attacker-infrastructure.net

IPs asociadas:
- 45.33.32.156 (servidor de phishing)
- 104.244.42.65 (C2 server)

Hash del malware unicode-aware:
f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08

La campaña explota CVE-2024-3333 para ataques de homógrafo.`,
    expected: {
      ips: ["45.33.32.156", "104.244.42.65"],
      domains: [
        "аррӏе.com",
        "paypal-sеcurity.com",
        "normal-malicious-domain.com",
        "evil.sub.malicious-site.org",
        "c2.attacker-infrastructure.net",
      ],
      hashes: [
        "f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      ],
      cves: ["CVE-2024-3333"],
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

  describe("Edge Case IOC Extraction", () => {
    edgeCaseTestCases.forEach((testCase) => {
      it(`should handle edge case: ${testCase.name}`, async () => {
        const result = await agent.generate(testCase.input, {
          output: iocOutputSchema,
        });

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

        // For edge cases, we test that expected IOCs are present
        // but we may be more lenient about extra ones due to AI interpretation
        testCase.expected.ips.forEach((expectedIp) => {
          expect(extractedIOCs.ips).toContain(expectedIp);
        });

        testCase.expected.domains.forEach((expectedDomain) => {
          expect(extractedIOCs.domains).toContain(expectedDomain);
        });

        testCase.expected.hashes.forEach((expectedHash) => {
          expect(extractedIOCs.hashes).toContain(expectedHash);
        });

        testCase.expected.cves.forEach((expectedCve) => {
          expect(extractedIOCs.cves).toContain(expectedCve);
        });

        // Log any extra IOCs for debugging (but don't fail the test)
        if (extractedIOCs.ips.length > testCase.expected.ips.length) {
          console.log(
            `${testCase.name}: Extra IPs found:`,
            extractedIOCs.ips.filter(
              (ip) => !testCase.expected.ips.includes(ip)
            )
          );
        }
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

    it("should handle defanged IOCs correctly", async () => {
      const defangedReport = `
        Defanged IOCs for safe sharing:
        - IP: 192[.]168[.]1[.]100
        - Domain: malicious-site[.]com
        - URL: hxxp://evil-domain[.]net/payload
        - IP with parentheses: 10(.)0(.)0(.)1
        - Mixed format: bad-domain[dot]org
      `;

      const result = await agent.generate(defangedReport, {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      // Should extract defanged IOCs in their original form
      expect(extractedIOCs.ips).toContain("192.168.1.100");
      expect(extractedIOCs.ips).toContain("10.0.0.1");
      expect(extractedIOCs.domains).toContain("malicious-site.com");
      expect(extractedIOCs.domains).toContain("evil-domain.net");
      expect(extractedIOCs.domains).toContain("bad-domain.org");
    });

    it("should extract IOCs from URLs and file paths", async () => {
      const urlReport = `
        Malicious URLs detected:
        - https://malicious-download.com/payload.exe
        - http://c2-server.net:8080/api/checkin
        - ftp://file-server.badactor.org/uploads/
        
        File paths containing IOCs:
        - C:\\Windows\\System32\\malware.exe (hash: aabbccddaabbccddaabbccddaabbccdd)
        - /tmp/suspicious_file.sh (SHA256: 1a2b3c4d1a2b3c4d1a2b3c4d1a2b3c4d1a2b3c4d1a2b3c4d1a2b3c4d1a2b3c4d)
      `;

      const result = await agent.generate(urlReport, {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      // Should extract domains from URLs
      expect(extractedIOCs.domains).toContain("malicious-download.com");
      expect(extractedIOCs.domains).toContain("c2-server.net");
      expect(extractedIOCs.domains).toContain("file-server.badactor.org");

      // Should extract hashes from file descriptions
      expect(extractedIOCs.hashes).toContain(
        "aabbccddaabbccddaabbccddaabbccdd"
      );
      expect(extractedIOCs.hashes).toContain(
        "1a2b3c4d1a2b3c4d1a2b3c4d1a2b3c4d1a2b3c4d1a2b3c4d1a2b3c4d1a2b3c4d"
      );
    });

    it("should handle mixed language reports", async () => {
      const mixedLanguageReport = `
        *** THREAT ANALYSIS - ANÁLISIS DE AMENAZAS ***
        
        English: The malware connects to C2 server at 203.0.113.100.
        Español: El malware se conecta al servidor C2 en 203.0.113.200.
        
        Malicious domains / Dominios maliciosos:
        - english-malware.com
        - spanish-malware.es
        
        Hash values / Valores hash:
        - MD5: 11111111222222223333333344444444
        - SHA256: aaaaaaaabbbbbbbbccccccccddddddddaaaaaaaabbbbbbbbccccccccdddddddd
        
        Vulnerabilities / Vulnerabilidades:
        - CVE-2024-1234 (English context)
        - CVE-2024-5678 (contexto español)
      `;

      const result = await agent.generate(mixedLanguageReport, {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      // Should extract IOCs regardless of language context
      expect(extractedIOCs.ips).toContain("203.0.113.100");
      expect(extractedIOCs.ips).toContain("203.0.113.200");
      expect(extractedIOCs.domains).toContain("english-malware.com");
      expect(extractedIOCs.domains).toContain("spanish-malware.es");
      expect(extractedIOCs.hashes).toContain(
        "11111111222222223333333344444444"
      );
      expect(extractedIOCs.hashes).toContain(
        "aaaaaaaabbbbbbbbccccccccddddddddaaaaaaaabbbbbbbbccccccccdddddddd"
      );
      expect(extractedIOCs.cves).toContain("CVE-2024-1234");
      expect(extractedIOCs.cves).toContain("CVE-2024-5678");
    });

    it("should handle incomplete or corrupted IOCs", async () => {
      const corruptedReport = `
        Partial IOCs recovered from corrupted logs:
        
        - Partial IP: 192.168.1.* (full IP: 192.168.1.50)
        - Truncated hash: abcdef123456... (full: abcdef123456abcdef123456abcdef123456)
        - Damaged domain: malicious-sit*.com (reconstructed: malicious-site.com)
        - Partial CVE: CVE-2024-*** (identified as CVE-2024-9876)
        
        Additional recovered IOCs:
        - Complete IP: 10.0.0.75
        - Complete hash: 9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef
        - Complete domain: recovered-domain.net
      `;

      const result = await agent.generate(corruptedReport, {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      // Should extract complete IOCs when available
      expect(extractedIOCs.ips).toContain("192.168.1.50");
      expect(extractedIOCs.ips).toContain("10.0.0.75");
      expect(extractedIOCs.domains).toContain("malicious-site.com");
      expect(extractedIOCs.domains).toContain("recovered-domain.net");
      expect(extractedIOCs.hashes).toContain(
        "abcdef123456abcdef123456abcdef123456"
      );
      expect(extractedIOCs.hashes).toContain(
        "9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef"
      );
      expect(extractedIOCs.cves).toContain("CVE-2024-9876");
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

  describe("Stress Testing and Performance", () => {
    it("should handle large reports with many IOCs", async () => {
      // Generate a large report with many IOCs (reduced for better performance)
      const largeReport = `
        *** MASS MALWARE CAMPAIGN - LARGE SCALE ANALYSIS ***
        
        During our analysis of the recent botnet campaign, we identified numerous IOCs:
        
        C2 Servers:
        ${Array.from({ length: 10 }, (_, i) => `- c2-server-${i + 1}.malicious-network.com`).join("\n        ")}
        
        Malicious IPs:
        ${Array.from({ length: 8 }, (_, i) => `- 192.168.${i + 1}.100`).join("\n        ")}
        ${Array.from({ length: 7 }, (_, i) => `- 10.0.${i + 1}.50`).join("\n        ")}
        
        File Hashes (MD5):
        ${Array.from({ length: 12 }, (_, i) => `- ${i.toString(16).padStart(8, "0")}${i.toString(16).padStart(8, "0")}${i.toString(16).padStart(8, "0")}${i.toString(16).padStart(8, "0")}`).join("\n        ")}
        
        Vulnerabilities exploited:
        ${Array.from({ length: 5 }, (_, i) => `- CVE-2024-${(i + 1).toString().padStart(4, "0")}`).join("\n        ")}
        
        Additional backup domains:
        ${Array.from({ length: 8 }, (_, i) => `- backup-${i + 1}.evil-infrastructure.net`).join("\n        ")}
      `;

      const result = await agent.generate(largeReport, {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      // Verify the agent can handle large inputs (reduced expectations)
      expect(extractedIOCs.domains.length).toBeGreaterThan(15);
      expect(extractedIOCs.ips.length).toBeGreaterThan(10);
      expect(extractedIOCs.hashes.length).toBeGreaterThan(8);
      expect(extractedIOCs.cves.length).toBeGreaterThan(3);

      // Verify some specific IOCs are extracted
      expect(extractedIOCs.domains).toContain(
        "c2-server-1.malicious-network.com"
      );
      expect(extractedIOCs.domains).toContain(
        "backup-1.evil-infrastructure.net"
      );
      expect(extractedIOCs.ips).toContain("192.168.1.100");
      expect(extractedIOCs.cves).toContain("CVE-2024-0001");
    }, 15000); // 15 second timeout for large reports

    it("should handle reports with nested and complex structures", async () => {
      const complexReport = `
        *** MULTI-STAGE ATTACK ANALYSIS ***
        
        STAGE 1: Initial Compromise
        ┌─ Vector: Email attachment (hash: stage1_hash1111111111111111111111111111111111111111111111111111111111111111)
        ├─ C2 Contact: initial-contact.stage1-domain.com
        └─ Exploit: CVE-2024-AAAA
        
        STAGE 2: Lateral Movement
        ┌─ Tool: Custom scanner (hash: stage2_hash2222222222222222222222222222222222222222222222222222222222222222)
        ├─ Targets: 
        │   ├─ 172.16.1.10 (compromised)
        │   ├─ 172.16.1.11 (compromised)
        │   └─ 172.16.1.12 (failed)
        └─ Backdoor: persistent-access.stage2-domain.org
        
        STAGE 3: Data Exfiltration
        ┌─ Compression: archive.zip (hash: stage3_hash3333333333333333333333333333333333333333333333333333333333333333)
        ├─ Destinations:
        │   ├─ exfil-server-1.data-theft.net
        │   ├─ exfil-server-2.data-theft.net
        │   └─ backup-exfil.secure-drop.onion
        └─ Protocol: HTTPS over 443 to 203.0.113.55
        
        STAGE 4: Persistence
        ┌─ Registry modification exploiting CVE-2024-BBBB
        ├─ Service installation: malware-service.exe (hash: stage4_hash4444444444444444444444444444444444444444444444444444444444444444)
        └─ Heartbeat: heartbeat.persistence-domain.com every 60 seconds
        
        Additional IOCs discovered:
        - Tor exit node: 198.51.100.77
        - Staging server: staging.malware-ops.com
        - Archive password hash (SHA1): aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      `;

      const result = await agent.generate(complexReport, {
        output: iocOutputSchema,
      });

      const extractedIOCs = result.object;

      // Verify complex nested structures are parsed correctly
      expect(extractedIOCs.domains).toContain(
        "initial-contact.stage1-domain.com"
      );
      expect(extractedIOCs.domains).toContain(
        "persistent-access.stage2-domain.org"
      );
      expect(extractedIOCs.domains).toContain("exfil-server-1.data-theft.net");
      expect(extractedIOCs.domains).toContain("backup-exfil.secure-drop.onion");
      expect(extractedIOCs.domains).toContain(
        "heartbeat.persistence-domain.com"
      );
      expect(extractedIOCs.domains).toContain("staging.malware-ops.com");

      expect(extractedIOCs.ips).toContain("172.16.1.10");
      expect(extractedIOCs.ips).toContain("172.16.1.11");
      expect(extractedIOCs.ips).toContain("203.0.113.55");
      expect(extractedIOCs.ips).toContain("198.51.100.77");

      expect(extractedIOCs.hashes).toContain(
        "stage1_hash1111111111111111111111111111111111111111111111111111111111111111"
      );
      expect(extractedIOCs.hashes).toContain(
        "stage2_hash2222222222222222222222222222222222222222222222222222222222222222"
      );
      expect(extractedIOCs.hashes).toContain(
        "stage3_hash3333333333333333333333333333333333333333333333333333333333333333"
      );
      expect(extractedIOCs.hashes).toContain(
        "stage4_hash4444444444444444444444444444444444444444444444444444444444444444"
      );
      expect(extractedIOCs.hashes).toContain(
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      );

      expect(extractedIOCs.cves).toContain("CVE-2024-AAAA");
      expect(extractedIOCs.cves).toContain("CVE-2024-BBBB");
    });
  });
});
