import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Spanish letter frequencies (approximate percentages)
const spanishFrequencies = {
  E: 13.68,
  A: 11.96,
  O: 8.69,
  I: 6.25,
  S: 7.2,
  N: 6.71,
  R: 6.87,
  T: 4.63,
  L: 4.97,
  C: 4.68,
  U: 3.93,
  M: 3.15,
  D: 5.86,
  P: 2.51,
  B: 2.27,
  G: 1.01,
  H: 0.7,
  F: 0.69,
  Y: 0.9,
  V: 1.05,
  Q: 0.88,
  J: 0.52,
  Z: 0.52,
  X: 0.22,
  K: 0.11,
  W: 0.04,
  Ñ: 0.17,
};

// Common Spanish words for validation
const commonSpanishWords = [
  "el",
  "la",
  "de",
  "en",
  "y",
  "a",
  "es",
  "se",
  "no",
  "te",
  "lo",
  "le",
  "da",
  "su",
  "por",
  "son",
  "con",
  "para",
  "al",
  "del",
  "los",
  "las",
  "una",
  "un",
  "ser",
  "era",
  "esta",
  "esto",
  "todo",
  "pero",
  "mas",
  "hay",
  "bien",
  "donde",
  "quien",
  "desde",
  "todos",
  "durante",
  "este",
  "ese",
  "aqui",
  "alla",
  "muy",
  "solo",
  "sin",
  "sobre",
  "hasta",
  "tanto",
  "antes",
  "despues",
  "entonces",
  "cuando",
  "como",
  "que",
  "qué",
  "quien",
  "donde",
  "porque",
  "como",
  "cual",
  "si",
  "sí",
  "mayor",
  "menor",
  "mejor",
  "peor",
  "hola",
  "adios",
  "gracias",
  "plaza",
  "sol",
  "brilla",
  "reunion",
  "sera",
  "horas",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "cita",
  "secreta",
  "jueves",
  "mayor",
  "lunes",
  "martes",
  "miercoles",
  "viernes",
  "sabado",
  "domingo",
  "mundo",
  "casa",
  "agua",
  "vida",
  "amor",
  "años",
  "dias",
  "mano",
  "ojos",
  "cara",
  "hora",
  "otro",
  "mesa",
  "tiempo",
  "parte",
  "lugar",
  "trabajo",
  "gobierno",
  "grupo",
  "caso",
  "punto",
  "guerra",
  "contra",
  "poder",
];

// Common Spanish digrams (two-letter combinations)
const commonDigrams = [
  "es",
  "en",
  "el",
  "la",
  "de",
  "ar",
  "er",
  "or",
  "re",
  "an",
  "te",
  "al",
  "co",
  "se",
  "as",
  "ad",
  "os",
  "on",
  "ac",
  "ic",
  "ec",
  "oc",
  "uc",
  "in",
  "un",
  "do",
];

function analyzeFrequency(text: string): {
  letterFreq: Map<string, number>;
  totalLetters: number;
  percentages: Map<string, number>;
} {
  const freq = new Map<string, number>();
  const letters = text.replace(/[^A-ZÑ]/gi, "").toUpperCase();

  for (const letter of letters) {
    freq.set(letter, (freq.get(letter) || 0) + 1);
  }

  const totalLetters = letters.length;
  const percentages = new Map<string, number>();

  for (const [letter, count] of freq) {
    percentages.set(letter, (count / totalLetters) * 100);
  }

  return { letterFreq: freq, totalLetters, percentages };
}

function scoreSpanishText(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  // Score based on common Spanish words
  for (const word of words) {
    if (commonSpanishWords.includes(word)) {
      score += 3; // High weight for exact matches
    }
  }

  // Score based on common digrams
  const cleanText = text.replace(/[^A-ZÑ]/gi, "").toLowerCase();
  let digramScore = 0;
  for (let i = 0; i < cleanText.length - 1; i++) {
    const digram = cleanText.substring(i, i + 2);
    if (commonDigrams.includes(digram)) {
      digramScore += 0.5;
    }
  }

  return score + digramScore;
}

function createFrequencyMapping(
  cipherFreq: Map<string, number>
): Map<string, string> {
  const sortedCipherLetters = Array.from(cipherFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([letter]) => letter);

  const sortedSpanishLetters = Object.entries(spanishFrequencies)
    .sort((a, b) => b[1] - a[1])
    .map(([letter]) => letter);

  const mapping = new Map<string, string>();

  for (
    let i = 0;
    i < Math.min(sortedCipherLetters.length, sortedSpanishLetters.length);
    i++
  ) {
    mapping.set(sortedCipherLetters[i], sortedSpanishLetters[i]);
  }

  return mapping;
}

function applyMapping(text: string, mapping: Map<string, string>): string {
  return text.replace(/[A-ZÑ]/gi, (char) => {
    const isUpperCase = char === char.toUpperCase();
    const upperChar = char.toUpperCase();
    const substitute = mapping.get(upperChar) || upperChar;
    return isUpperCase ? substitute : substitute.toLowerCase();
  });
}

function findCommonPatterns(
  text: string
): Array<{ pattern: string; positions: number[] }> {
  const patterns = [];
  const words = text.split(/\s+/);

  // Look for repeated short words (likely articles, prepositions)
  const wordCounts = new Map<string, number>();
  const wordPositions = new Map<string, number[]>();

  words.forEach((word, index) => {
    if (word.length >= 2 && word.length <= 4) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      if (!wordPositions.has(word)) {
        wordPositions.set(word, []);
      }
      wordPositions.get(word)!.push(index);
    }
  });

  // Return patterns that appear multiple times
  for (const [word, count] of wordCounts) {
    if (count >= 2) {
      patterns.push({
        pattern: word,
        positions: wordPositions.get(word) || [],
      });
    }
  }

  return patterns.sort((a, b) => b.positions.length - a.positions.length);
}

export const substitutionCipherTool = createTool({
  id: "substitution-cipher-decryption",
  description:
    "Analyzes substitution ciphers using frequency analysis, pattern recognition, and Spanish language characteristics. Provides mapping suggestions and scores potential solutions.",
  inputSchema: z.object({
    encryptedText: z.string().describe("The encrypted text to analyze"),
    customMapping: z
      .record(z.string())
      .optional()
      .describe(
        "Optional custom letter mappings to apply (e.g., {'S': 'L', 'Q': 'A'})"
      ),
    analysisType: z
      .enum(["frequency", "pattern", "hybrid", "multiple"])
      .default("hybrid")
      .describe("Type of analysis to perform"),
  }),
  outputSchema: z.object({
    decryptedText: z.string(),
    confidence: z.number(),
    method: z.string(),
    substitutionMap: z.record(z.string()),
    alternativeSolutions: z.array(
      z.object({
        decryptedText: z.string(),
        confidence: z.number(),
        method: z.string(),
        substitutionMap: z.record(z.string()),
      })
    ),
    analysis: z.object({
      cipherFrequencies: z.record(z.number()),
      expectedFrequencies: z.record(z.number()),
      commonPatterns: z.array(
        z.object({
          pattern: z.string(),
          frequency: z.number(),
          suggestions: z.array(z.string()),
        })
      ),
      suggestions: z.array(z.string()),
      conflictAnalysis: z.array(
        z.object({
          cipherLetter: z.string(),
          possibleMappings: z.array(z.string()),
          reason: z.string(),
        })
      ),
    }),
  }),
  execute: async ({ context }) => {
    const { encryptedText, customMapping, analysisType } = context;

    // Analyze cipher text
    const { letterFreq, totalLetters, percentages } =
      analyzeFrequency(encryptedText);
    const patterns = findCommonPatterns(encryptedText);

    let solutions: Array<{
      decryptedText: string;
      confidence: number;
      method: string;
      mapping: Map<string, string>;
    }> = [];

    if (customMapping) {
      // Apply custom mapping if provided
      const customMap = new Map<string, string>();
      Object.entries(customMapping).forEach(([cipher, plain]) => {
        customMap.set(cipher.toUpperCase(), plain.toUpperCase());
      });

      const decryptedText = applyMapping(encryptedText, customMap);
      const confidence = scoreSpanishText(decryptedText);

      solutions.push({
        decryptedText,
        confidence,
        method: "Custom Mapping",
        mapping: customMap,
      });
    } else {
      // Generate multiple candidate solutions

      // Solution 1: Frequency analysis
      const frequencyMapping = createFrequencyMapping(letterFreq);
      const freqDecrypted = applyMapping(encryptedText, frequencyMapping);
      const freqConfidence = scoreSpanishText(freqDecrypted);

      solutions.push({
        decryptedText: freqDecrypted,
        confidence: freqConfidence,
        method: "Frequency Analysis",
        mapping: frequencyMapping,
      });

      // Solution 2: Pattern-based mapping
      const patternMapping = new Map<string, string>();
      // Look for common patterns and create targeted mappings
      patterns.forEach((pattern) => {
        if (pattern.pattern.length === 2) {
          // Assume most common 2-letter patterns are articles
          if (pattern.pattern.length === 2) {
            patternMapping.set(pattern.pattern[0], "L");
            patternMapping.set(pattern.pattern[1], "A");
          }
        }
      });

      if (patternMapping.size > 0) {
        const patternDecrypted = applyMapping(encryptedText, patternMapping);
        const patternConfidence = scoreSpanishText(patternDecrypted);

        solutions.push({
          decryptedText: patternDecrypted,
          confidence: patternConfidence,
          method: "Pattern Recognition",
          mapping: patternMapping,
        });
      }

      // Solution 3: Hybrid approach - combine frequency and pattern
      const hybridMapping = new Map<string, string>(frequencyMapping);
      patterns.forEach((pattern) => {
        if (pattern.pattern.length === 2 && pattern.positions.length >= 2) {
          // Override frequency mapping for likely articles
          hybridMapping.set(pattern.pattern[0], "L");
          hybridMapping.set(pattern.pattern[1], "A");
        }
      });

      const hybridDecrypted = applyMapping(encryptedText, hybridMapping);
      const hybridConfidence = scoreSpanishText(hybridDecrypted);

      solutions.push({
        decryptedText: hybridDecrypted,
        confidence: hybridConfidence,
        method: "Hybrid (Frequency + Pattern)",
        mapping: hybridMapping,
      });
    }

    // Sort solutions by confidence
    solutions.sort((a, b) => b.confidence - a.confidence);

    // Get the best solution
    const bestSolution = solutions[0];
    const alternativeSolutions = solutions.slice(1, 4).map((sol) => ({
      decryptedText: sol.decryptedText,
      confidence: sol.confidence,
      method: sol.method,
      substitutionMap: Object.fromEntries(sol.mapping),
    }));

    // Analyze conflicts (for complex ciphers)
    const conflictAnalysis: Array<{
      cipherLetter: string;
      possibleMappings: string[];
      reason: string;
    }> = [];
    const words = encryptedText.split(/\s+/);
    const letterMappings = new Map<string, Set<string>>();

    // Check for conflicting mappings by analyzing word patterns
    if (bestSolution.mapping.size > 0) {
      words.forEach((word) => {
        const decryptedWord = applyMapping(word, bestSolution.mapping);
        for (let i = 0; i < word.length; i++) {
          const cipherChar = word[i].toUpperCase();
          const plainChar = decryptedWord[i].toUpperCase();

          if (cipherChar.match(/[A-ZÑ]/)) {
            if (!letterMappings.has(cipherChar)) {
              letterMappings.set(cipherChar, new Set());
            }
            letterMappings.get(cipherChar)!.add(plainChar);
          }
        }
      });

      // Find letters with multiple mappings
      letterMappings.forEach((mappings, cipherLetter) => {
        if (mappings.size > 1) {
          conflictAnalysis.push({
            cipherLetter,
            possibleMappings: Array.from(mappings),
            reason: `Letter '${cipherLetter}' maps to multiple plaintext letters: ${Array.from(mappings).join(", ")}`,
          });
        }
      });
    }

    // Generate analysis data
    const cipherFrequencies: Record<string, number> = {};
    const expectedFrequencies: Record<string, number> = {};

    percentages.forEach((percentage, letter) => {
      cipherFrequencies[letter] = Math.round(percentage * 100) / 100;
    });

    Object.entries(spanishFrequencies).forEach(([letter, freq]) => {
      expectedFrequencies[letter] = freq;
    });

    // Generate pattern suggestions
    const patternSuggestions = patterns.map((p) => ({
      pattern: p.pattern,
      frequency: p.positions.length,
      suggestions:
        p.pattern.length === 2
          ? ["EL", "LA", "EN", "ES", "DE"]
          : p.pattern.length === 3
            ? ["LAS", "LOS", "DEL", "CON", "POR"]
            : ["PARA", "ESTA", "ESTE", "SOLO", "COMO"],
    }));

    // Generate enhanced suggestions
    const suggestions = [
      `Most frequent cipher letter: ${Array.from(percentages.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"} (likely 'E' in Spanish)`,
      `Common patterns found: ${patterns.length > 0 ? patterns.map((p) => p.pattern).join(", ") : "None"}`,
      `Text length: ${totalLetters} letters`,
      `Estimated confidence: ${bestSolution.confidence > 10 ? "High" : bestSolution.confidence > 5 ? "Medium" : "Low"}`,
      `Conflicts detected: ${conflictAnalysis.length > 0 ? "Yes - may not be simple substitution" : "No"}`,
      `Number of alternative solutions: ${alternativeSolutions.length}`,
    ];

    return {
      decryptedText: bestSolution.decryptedText,
      confidence: bestSolution.confidence,
      method: bestSolution.method,
      substitutionMap: Object.fromEntries(bestSolution.mapping),
      alternativeSolutions,
      analysis: {
        cipherFrequencies,
        expectedFrequencies,
        commonPatterns: patternSuggestions,
        suggestions,
        conflictAnalysis,
      },
    };
  },
});
