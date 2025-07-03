import { beforeEach, describe, expect, it } from "vitest";
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
    name: "Training Data - Malware Analysis Notes",
    input: `*** Notas de Análisis de Malware - 20250630 ***

Muestra 1: 'payload.dll'
El hash MD5 del fichero es d41d8cd98f00b204e9800998ecf8427e.
También hemos calculado el SHA-1: da39a3ee5e6b4b0d3255bfef95601890afd80709.

Muestra 2: 'installer.msi'
Este instalador es más complejo. El análisis de VirusTotal muestra un hash principal (SHA-256) de e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.
Un analista apuntó este hash como SHA-1: 5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a.

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

const edgeCaseTestCases: HashTestCase[] = [
  {
    name: "Mixed Hash Types in English Report",
    input: `*** Malware Analysis Report - Sample XYZ ***

File: malicious.exe
MD5: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4
SHA1: 1234567890abcdef1234567890abcdef12345678
SHA-256: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
SHA-512: fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321

Fuzzy hash (ssdeep): 1536:abc123XYZ:def456
Partial hash from log: 5d41402abc4b...`,
    expected: [
      {
        valor: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        tipo: "MD5",
      },
      {
        valor: "1234567890abcdef1234567890abcdef12345678",
        tipo: "SHA-1",
      },
      {
        valor:
          "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        tipo: "SHA-256",
      },
      {
        valor:
          "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
        tipo: "SHA-512",
      },
      {
        valor: "1536:abc123XYZ:def456",
        tipo: "ssdeep",
      },
      {
        valor: "5d41402abc4b...",
        tipo: "parcial_desconocido",
      },
    ],
  },
  {
    name: "Case Insensitive and Various Formats",
    input: `Hash Analysis:
- MD5 (uppercase): ABCDEF1234567890ABCDEF1234567890
- sha1 (lowercase): abcdef1234567890abcdef1234567890abcdef12
- SHA-256 (mixed): AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890
- SHA512: 1111222233334444555566667777888899990000AAAABBBBCCCCDDDDEEEEFFFF1111222233334444555566667777888899990000AAAABBBBCCCCDDDDEEEEFFFF
- Fuzzy hash: 768:randomStringHere:anotherPart
- Incomplete: abc123def456...`,
    expected: [
      {
        valor: "ABCDEF1234567890ABCDEF1234567890",
        tipo: "MD5",
      },
      {
        valor: "abcdef1234567890abcdef1234567890abcdef12",
        tipo: "SHA-1",
      },
      {
        valor: "AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890",
        tipo: "SHA-256",
      },
      {
        valor:
          "1111222233334444555566667777888899990000AAAABBBBCCCCDDDDEEEEFFFF1111222233334444555566667777888899990000AAAABBBBCCCCDDDDEEEEFFFF",
        tipo: "SHA-512",
      },
      {
        valor: "768:randomStringHere:anotherPart",
        tipo: "ssdeep",
      },
      {
        valor: "abc123def456...",
        tipo: "parcial_desconocido",
      },
    ],
  },
  {
    name: "Multiple ssdeep Formats",
    input: `Different ssdeep hash formats:
1. Standard: 192:abc:def
2. Complex: 3072:Z3z1y2xWvUt1s2r3q4p:aBcDeF
3. Long segments: 6144:VeryLongStringWithManyCharacters:AnotherLongSegment
4. Short: 96:x:y
5. With numbers: 1024:123abc456def:789ghi012jkl`,
    expected: [
      {
        valor: "192:abc:def",
        tipo: "ssdeep",
      },
      {
        valor: "3072:Z3z1y2xWvUt1s2r3q4p:aBcDeF",
        tipo: "ssdeep",
      },
      {
        valor: "6144:VeryLongStringWithManyCharacters:AnotherLongSegment",
        tipo: "ssdeep",
      },
      {
        valor: "96:x:y",
        tipo: "ssdeep",
      },
      {
        valor: "1024:123abc456def:789ghi012jkl",
        tipo: "ssdeep",
      },
    ],
  },
  {
    name: "Truncated and Partial Hashes",
    input: `Partial hash analysis:
- Log entry shows hash: 5d41402abc4b2a76b9719d911017c592...
- Truncated MD5: a1b2c3d4e5f6a1b2c3d4e5f6...
- Incomplete SHA1: 1234567890abcdef1234567890abcdef...
- Partial SHA256: 0123456789abcdef0123456789abcdef0123456789abcdef...
- Fragment: 900150983cd24fb0d696...
- Very short: abc123...`,
    expected: [
      {
        valor: "5d41402abc4b2a76b9719d911017c592...",
        tipo: "parcial_desconocido",
      },
      {
        valor: "a1b2c3d4e5f6a1b2c3d4e5f6...",
        tipo: "parcial_desconocido",
      },
      {
        valor: "1234567890abcdef1234567890abcdef...",
        tipo: "parcial_desconocido",
      },
      {
        valor: "0123456789abcdef0123456789abcdef0123456789abcdef...",
        tipo: "parcial_desconocido",
      },
      {
        valor: "900150983cd24fb0d696...",
        tipo: "parcial_desconocido",
      },
      {
        valor: "abc123...",
        tipo: "parcial_desconocido",
      },
    ],
  },
  {
    name: "Hashes in Context",
    input: `Incident Response Report:
The malware sample (file: trojan.exe) was analyzed with the following results:
MD5 checksum: f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4
SHA-1 verification: a9b8c7d6e5f4a9b8c7d6e5f4a9b8c7d6e5f4a9b8
SHA-256 signature: 123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0
VirusTotal shows additional hash (SHA-512):
abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

Similarity hash: 2048:compareThisString:withThisOne
Corrupted log entry: "process terminated, hash: 5f6a7b8c9d0e..."`,
    expected: [
      {
        valor: "f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4",
        tipo: "MD5",
      },
      {
        valor: "a9b8c7d6e5f4a9b8c7d6e5f4a9b8c7d6e5f4a9b8",
        tipo: "SHA-1",
      },
      {
        valor:
          "123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
        tipo: "SHA-256",
      },
      {
        valor:
          "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        tipo: "SHA-512",
      },
      {
        valor: "2048:compareThisString:withThisOne",
        tipo: "ssdeep",
      },
      {
        valor: "5f6a7b8c9d0e...",
        tipo: "parcial_desconocido",
      },
    ],
  },
  {
    name: "No Hashes Present",
    input: `General IT Report:
This is a routine maintenance report. No security incidents were detected.
The system performed normally throughout the monitoring period.
All services are operational and responding correctly.`,
    expected: [],
  },
  {
    name: "Mixed Language with Complex Format",
    input: `*** INFORME TÉCNICO / TECHNICAL REPORT ***

Análisis de muestra (Sample analysis):
- Archivo/File: malware_sample.bin
- Hash MD5 (ES): 1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d
- SHA-1 hash (EN): 9f8e7d6c5b4a9f8e7d6c5b4a9f8e7d6c5b4a9f8e
- Huella SHA-256: 456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123
- SHA-512 completo:
  fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321

Hash difuso (Fuzzy hash): 4096:AnalysisString:ResultHash
Log fragmentado: "hash del proceso: abc1234def5678..."`,
    expected: [
      {
        valor: "1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d",
        tipo: "MD5",
      },
      {
        valor: "9f8e7d6c5b4a9f8e7d6c5b4a9f8e7d6c5b4a9f8e",
        tipo: "SHA-1",
      },
      {
        valor:
          "456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123",
        tipo: "SHA-256",
      },
      {
        valor:
          "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
        tipo: "SHA-512",
      },
      {
        valor: "4096:AnalysisString:ResultHash",
        tipo: "ssdeep",
      },
      {
        valor: "abc1234def5678...",
        tipo: "parcial_desconocido",
      },
    ],
  },
];

describe("Hash Detection Agent", () => {
  let agent: typeof hashDetectionAgent;

  beforeEach(() => {
    agent = hashDetectionAgent;
  });

  describe("Hash Detection Functionality", () => {
    testCases.forEach((testCase) => {
      it(`should detect and classify hashes correctly from ${testCase.name}`, async () => {
        const result = await agent.generate(testCase.input, {
          output: hashDetectionOutputSchema,
        });

        const detectedHashes = result.object;

        // Verify structure is automatically guaranteed by Zod schema
        expect(detectedHashes).toHaveProperty("hashes");
        expect(Array.isArray(detectedHashes.hashes)).toBe(true);

        // Verify the number of hashes detected
        expect(detectedHashes.hashes).toHaveLength(testCase.expected.length);

        // Verify each expected hash is detected with correct classification
        testCase.expected.forEach((expectedHash) => {
          const foundHash = detectedHashes.hashes.find(
            (hash) => hash.valor === expectedHash.valor
          );
          expect(foundHash).toBeDefined();
          expect(foundHash?.tipo).toBe(expectedHash.tipo);
        });

        // Verify no extra hashes were detected
        detectedHashes.hashes.forEach((detectedHash) => {
          const expectedHash = testCase.expected.find(
            (expected) => expected.valor === detectedHash.valor
          );
          expect(expectedHash).toBeDefined();
        });
      });
    });
  });

  describe("Edge Case Hash Detection", () => {
    edgeCaseTestCases.forEach((testCase) => {
      it(`should handle edge case: ${testCase.name}`, async () => {
        const result = await agent.generate(testCase.input, {
          output: hashDetectionOutputSchema,
        });

        const detectedHashes = result.object;

        // Verify structure
        expect(detectedHashes).toHaveProperty("hashes");
        expect(Array.isArray(detectedHashes.hashes)).toBe(true);

        // For edge cases, verify expected hashes are present
        testCase.expected.forEach((expectedHash) => {
          const foundHash = detectedHashes.hashes.find(
            (hash) => hash.valor === expectedHash.valor
          );
          expect(foundHash).toBeDefined();
          expect(foundHash?.tipo).toBe(expectedHash.tipo);
        });

        // Log any extra hashes for debugging
        if (detectedHashes.hashes.length > testCase.expected.length) {
          const extraHashes = detectedHashes.hashes.filter(
            (hash) =>
              !testCase.expected.some(
                (expected) => expected.valor === hash.valor
              )
          );
          console.log(`${testCase.name}: Extra hashes found:`, extraHashes);
        }
      });
    });
  });

  describe("Hash Type Classification", () => {
    it("should correctly classify MD5 hashes", async () => {
      const md5Report = `
        MD5 hashes in the report:
        - File1: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4
        - File2: 9f86d081884c7d659a2feaa0c55ad015
      `;

      const result = await agent.generate(md5Report, {
        output: hashDetectionOutputSchema,
      });

      const hashes = result.object.hashes;

      hashes.forEach((hash) => {
        expect(hash.valor).toHaveLength(32);
        expect(hash.tipo).toBe("MD5");
      });
    });

    it("should correctly classify SHA-1 hashes", async () => {
      const sha1Report = `
        SHA-1 hashes detected:
        - 1234567890abcdef1234567890abcdef12345678
        - da39a3ee5e6b4b0d3255bfef95601890afd80709
      `;

      const result = await agent.generate(sha1Report, {
        output: hashDetectionOutputSchema,
      });

      const hashes = result.object.hashes;

      hashes.forEach((hash) => {
        expect(hash.valor).toHaveLength(40);
        expect(hash.tipo).toBe("SHA-1");
      });
    });

    it("should correctly classify SHA-256 hashes", async () => {
      const sha256Report = `
        SHA-256 verification:
        - 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
        - e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      `;

      const result = await agent.generate(sha256Report, {
        output: hashDetectionOutputSchema,
      });

      const hashes = result.object.hashes;

      hashes.forEach((hash) => {
        expect(hash.valor).toHaveLength(64);
        expect(hash.tipo).toBe("SHA-256");
      });
    });

    it("should correctly classify SHA-512 hashes", async () => {
      const sha512Report = `
        SHA-512 hash:
        cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e
      `;

      const result = await agent.generate(sha512Report, {
        output: hashDetectionOutputSchema,
      });

      const hashes = result.object.hashes;

      expect(hashes).toHaveLength(1);
      expect(hashes[0].valor).toHaveLength(128);
      expect(hashes[0].tipo).toBe("SHA-512");
    });

    it("should correctly classify ssdeep hashes", async () => {
      const ssdeepReport = `
        Fuzzy hashing results:
        - ssdeep: 192:abc:def
        - ssdeep: 3072:Z3z1y2xWvUt:aBc
        - similarity hash: 1536:longSegmentHere:anotherSegment
      `;

      const result = await agent.generate(ssdeepReport, {
        output: hashDetectionOutputSchema,
      });

      const hashes = result.object.hashes;

      hashes.forEach((hash) => {
        expect(hash.valor).toContain(":");
        expect(hash.tipo).toBe("ssdeep");
      });
    });

    it("should correctly classify partial/unknown hashes", async () => {
      const partialReport = `
        Partial hashes from logs:
        - Process hash: 5d41402abc4b2a76b9719d911017c592...
        - Truncated: abc123def456...
        - Fragment: 900150983cd24fb0d696...
      `;

      const result = await agent.generate(partialReport, {
        output: hashDetectionOutputSchema,
      });

      const hashes = result.object.hashes;

      hashes.forEach((hash) => {
        expect(hash.valor).toMatch(/\.\.\.$/); // Should end with ...
        expect(hash.tipo).toBe("parcial_desconocido");
      });
    });
  });

  describe("Structured Output Validation", () => {
    it("should always return valid structured output", async () => {
      const result = await agent.generate("", {
        output: hashDetectionOutputSchema,
      });

      const detectedHashes = result.object;

      // Schema validation guarantees these properties exist
      expect(detectedHashes).toHaveProperty("hashes");
      expect(Array.isArray(detectedHashes.hashes)).toBe(true);
    });

    it("should handle reports with no hashes", async () => {
      const benignReport = "This is a general IT report with no hash values.";
      const result = await agent.generate(benignReport, {
        output: hashDetectionOutputSchema,
      });

      const detectedHashes = result.object;

      expect(detectedHashes.hashes).toHaveLength(0);
    });

    it("should validate schema compliance", async () => {
      const hashReport = `
        Sample with hash: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4
      `;

      const result = await agent.generate(hashReport, {
        output: hashDetectionOutputSchema,
      });

      // Schema validation happens automatically
      const detectedHashes = result.object;

      // Validate the schema parse succeeded
      const validationResult =
        hashDetectionOutputSchema.safeParse(detectedHashes);
      expect(validationResult.success).toBe(true);

      // Additional validation
      if (detectedHashes.hashes.length > 0) {
        detectedHashes.hashes.forEach((hash) => {
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
      }
    });
  });
});
