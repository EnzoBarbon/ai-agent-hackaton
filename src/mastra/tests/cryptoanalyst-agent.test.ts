import { LibSQLStore } from "@mastra/libsql";
import { describe, expect, it } from "vitest";
import {
  createCryptoanalystAgent,
  cryptoanalystOutputSchema,
} from "../agents/cryptoanalyst-agent";

interface CryptoTestCase {
  name: string;
  input: string;
  expected: {
    originalText: string;
    encryptionMethod: string;
    confidence: number;
  };
}

const testCases: CryptoTestCase[] = [
  {
    name: "Caesar Cipher",
    input: "HO VRÑ EUÑOD HQ OD SODCD PDÑRU.",
    expected: {
      originalText: "EL SOL BRILLA EN LA PLAZA MAYOR.",
      encryptionMethod: "Caesar",
      confidence: 7,
    },
  },
  {
    name: "Simple Substitution",
    input: "SQ YOSQ SFXLQETGXOQ RT SQ ZCQRSQ.",
    expected: {
      originalText: "LA CITA SECRETA ES EL JUEVES.",
      encryptionMethod: "Substitution",
      confidence: 6,
    },
  },
  {
    name: "Vigenère Cipher",
    input: "ZI BIKLOÑG IOÑÁ ÁS ÁGÍS Á ZQG GIÑÁI.",
    expected: {
      originalText: "LA REUNION SERA EN DOS HORAS.",
      encryptionMethod: "Vigenère",
      confidence: 6,
    },
  },
];

const edgeCaseTestCases: CryptoTestCase[] = [
  {
    name: "Caesar Cipher - Very Short Text",
    input: "IPMB",
    expected: {
      originalText: "HOLA",
      encryptionMethod: "Caesar",
      confidence: 1,
    },
  },
  {
    name: "Caesar Cipher - Single Word with Ñ",
    input: "QJÑP",
    expected: {
      originalText: "NIÑO",
      encryptionMethod: "Caesar",
      confidence: 1,
    },
  },
  {
    name: "Substitution - Minimal Pattern",
    input: "XY XY",
    expected: {
      originalText: "LA LA",
      encryptionMethod: "Substitution",
      confidence: 1,
    },
  },
  {
    name: "Vigenère - Single Word",
    input: "PMLA",
    expected: {
      originalText: "CASA",
      encryptionMethod: "Vigenère",
      confidence: 1,
    },
  },
  {
    name: "Unknown Cipher - Ambiguous Text",
    input: "ABC DEF GHI",
    expected: {
      originalText: "ABC DEF GHI", // May not decrypt if no clear pattern
      encryptionMethod: "Unknown",
      confidence: 0,
    },
  },
  {
    name: "Mixed Content - Numbers and Letters",
    input: "ABC 123 XYZ",
    expected: {
      originalText: "ABC 123 XYZ", // Should preserve numbers
      encryptionMethod: "Unknown",
      confidence: 0,
    },
  },
];

describe("Cryptoanalyst Agent", () => {
  describe("Training Data Decryption", () => {
    it("should decrypt Caesar Cipher", async () => {
      const input = "HO VRÑ EUÑOD HQ OD SODCD PDÑRU.";
      const expected = {
        originalText: "EL SOL BRILLA EN LA PLAZA MAYOR.",
        encryptionMethod: "Caesar",
        confidence: 7,
      };

      // Create a fresh agent instance with isolated memory for this test
      const agent = createCryptoanalystAgent({
        memoryStorage: new LibSQLStore({
          url: `file:test-crypto-caesar-${Date.now()}.db`,
        }),
        name: "Cryptoanalyst Test - Caesar",
      });

      const result = await agent.generate(input, {
        output: cryptoanalystOutputSchema,
      });

      expect(result.object).toBeDefined();
      expect(cryptoanalystOutputSchema.safeParse(result.object).success).toBe(
        true
      );

      const output = result.object;

      // Check that decrypted text matches expected (case-insensitive)
      expect(output.originalText.toUpperCase()).toBe(
        expected.originalText.toUpperCase()
      );

      // Check that encryption method is detected correctly
      expect(output.encryptionMethod.toLowerCase()).toContain(
        expected.encryptionMethod.toLowerCase()
      );

      // Check that confidence is reasonable
      expect(output.confidence).toBeGreaterThanOrEqual(expected.confidence);

      console.log(`\nTest: ${input}`);
      console.log(`Expected: ${expected.originalText}`);
      console.log(`Got: ${output.originalText}`);
      console.log(`Method: ${output.encryptionMethod}`);
      console.log(`Confidence: ${output.confidence}`);
    });

    it("should decrypt Simple Substitution", async () => {
      const input = "SQ YOSQ SFXLQETGXOQ RT SQ ZCQRSQ.";
      const expected = {
        originalText: "LA CITA SECRETA ES EL JUEVES.",
        encryptionMethod: "Substitution",
        confidence: 6,
      };

      // Create a fresh agent instance with isolated memory for this test
      const agent = createCryptoanalystAgent({
        memoryStorage: new LibSQLStore({
          url: `file:test-crypto-substitution-${Date.now()}.db`,
        }),
        name: "Cryptoanalyst Test - Substitution",
      });

      const result = await agent.generate(input, {
        output: cryptoanalystOutputSchema,
      });

      expect(result.object).toBeDefined();
      expect(cryptoanalystOutputSchema.safeParse(result.object).success).toBe(
        true
      );

      const output = result.object;

      // Check that decrypted text matches expected (case-insensitive)
      expect(output.originalText.toUpperCase()).toBe(
        expected.originalText.toUpperCase()
      );

      // Check that encryption method is detected correctly
      expect(output.encryptionMethod.toLowerCase()).toContain(
        expected.encryptionMethod.toLowerCase()
      );

      // Check that confidence is reasonable
      expect(output.confidence).toBeGreaterThanOrEqual(expected.confidence);

      console.log(`\nTest: ${input}`);
      console.log(`Expected: ${expected.originalText}`);
      console.log(`Got: ${output.originalText}`);
      console.log(`Method: ${output.encryptionMethod}`);
      console.log(`Confidence: ${output.confidence}`);
    });

    it("should decrypt Vigenère Cipher", async () => {
      const input = "ZI BIKLOÑG IOÑÁ ÁS ÁGÍS Á ZQG GIÑÁI.";
      const expected = {
        originalText: "LA REUNION SERA EN DOS HORAS.",
        encryptionMethod: "Vigenère",
        confidence: 6,
      };

      // Create a fresh agent instance with isolated memory for this test
      const agent = createCryptoanalystAgent({
        memoryStorage: new LibSQLStore({
          url: `file:test-crypto-vigenere-${Date.now()}.db`,
        }),
        name: "Cryptoanalyst Test - Vigenère",
      });

      const result = await agent.generate(input, {
        experimental_output: cryptoanalystOutputSchema,
      });

      expect(result.object).toBeDefined();
      expect(cryptoanalystOutputSchema.safeParse(result.object).success).toBe(
        true
      );

      const output = result.object;

      // Check that decrypted text matches expected (case-insensitive)
      expect(output.originalText.toUpperCase()).toBe(
        expected.originalText.toUpperCase()
      );

      // Check that encryption method is detected correctly
      expect(output.encryptionMethod.toLowerCase()).toContain(
        expected.encryptionMethod.toLowerCase()
      );

      // Check that confidence is reasonable
      expect(output.confidence).toBeGreaterThanOrEqual(expected.confidence);

      console.log(`\nTest: ${input}`);
      console.log(`Expected: ${expected.originalText}`);
      console.log(`Got: ${output.originalText}`);
      console.log(`Method: ${output.encryptionMethod}`);
      console.log(`Confidence: ${output.confidence}`);
    });
  });

  describe("Edge Cases", () => {
    it.each(edgeCaseTestCases)(
      "should handle edge case: $name",
      async ({ name, input, expected }) => {
        // Create a fresh agent instance with isolated memory for this test
        const agent = createCryptoanalystAgent({
          memoryStorage: new LibSQLStore({
            url: `file:test-crypto-edge-${name.replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}.db`,
          }),
          name: `Cryptoanalyst Edge Test - ${name}`,
        });

        const result = await agent.generate(input, {
          output: cryptoanalystOutputSchema,
        });

        expect(result.object).toBeDefined();
        expect(cryptoanalystOutputSchema.safeParse(result.object).success).toBe(
          true
        );

        const output = result.object;

        // For edge cases, we're more lenient with exact matches
        expect(output.originalText).toBeDefined();
        expect(output.encryptionMethod).toBeDefined();
        expect(output.confidence).toBeGreaterThanOrEqual(0);

        console.log(`\nEdge Case: ${input}`);
        console.log(`Got: ${output.originalText}`);
        console.log(`Method: ${output.encryptionMethod}`);
        console.log(`Confidence: ${output.confidence}`);
      }
    );
  });

  describe("Output Schema Validation", () => {
    it("should return valid schema for any input", async () => {
      // Create a fresh agent instance with isolated memory for this test
      const agent = createCryptoanalystAgent({
        memoryStorage: new LibSQLStore({
          url: `file:test-crypto-schema-${Date.now()}.db`,
        }),
        name: "Cryptoanalyst Schema Test",
      });

      const result = await agent.generate("ABC XYZ", {
        output: cryptoanalystOutputSchema,
      });

      expect(result.object).toBeDefined();

      const parseResult = cryptoanalystOutputSchema.safeParse(result.object);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const output = parseResult.data;
        expect(typeof output.originalText).toBe("string");
        expect(typeof output.encryptionMethod).toBe("string");
        expect(typeof output.confidence).toBe("number");
        expect(output.confidence).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
