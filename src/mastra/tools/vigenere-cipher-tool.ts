import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Common Spanish keywords to try for Vigenère decryption
const commonSpanishKeys = [
  "AMOR",
  "CASA",
  "VIDA",
  "TIEMPO",
  "AGUA",
  "TIERRA",
  "FUEGO",
  "AIRE",
  "PALABRA",
  "SECRETO",
  "CLAVE",
  "CIFRA",
  "OCULTO",
  "MISTERIO",
  "CODIGO",
  "MENSAJE",
  "CARTA",
  "TEXTO",
  "ESPAÑA",
  "MADRID",
  "BARCELONA",
  "HOLA",
  "ADIOS",
  "GRACIAS",
  "FAVOR",
  "BUENO",
  "MALO",
  "GRANDE",
  "PEQUEÑO",
  "BLANCO",
  "NEGRO",
  "ROJO",
  "AZUL",
  "VERDE",
  "AMARILLO",
  "SOL",
  "LUNA",
  "ESTRELLA",
  "CIELO",
  "MAR",
  "MONTAÑA",
  "FLOR",
  "ARBOL",
  "GATO",
  "PERRO",
  "PAJARO",
  "PECES",
  "CABALLO",
  "VACA",
  "LEON",
  "TIGRE",
  "ELEFANTE",
  "RATON",
  "LIBRO",
  "PAPEL",
  "LAPIZ",
  "MESA",
  "SILLA",
  "VENTANA",
  "PUERTA",
  "CAMINO",
  "VIAJE",
  "AVENTURA",
  "SUEÑO",
  "NOCHE",
  "DIA",
  "MAÑANA",
  "TARDE",
  "SEMANA",
  "MES",
  "AÑO",
  "SIGLO",
  "HISTORIA",
  "MUSICA",
  "CANCION",
  "BAILE",
  "ARTE",
  "PINTURA",
  "ESCULTURA",
  "TEATRO",
  "CINE",
  "TELEVISION",
  "RADIO",
  "PERIODICO",
  "REVISTA",
  "INTERNET",
  "COMPUTADORA",
  "TELEFONO",
  "COCHE",
  "AUTOBUS",
  "TREN",
  "AVION",
  "BARCO",
  "BICICLETA",
  "MOTOCICLETA",
  "CAMION",
  "COMIDA",
  "BEBIDA",
  "DESAYUNO",
  "ALMUERZO",
  "CENA",
  "FRUTA",
  "VERDURA",
  "CARNE",
  "PESCADO",
  "POLLO",
  "HUEVO",
  "LECHE",
  "QUESO",
  "PAN",
  "ARROZ",
  "PASTA",
  "SOPA",
  "ENSALADA",
  "POSTRE",
  "HELADO",
  "CHOCOLATE",
  "CAFE",
  "TE",
  "VINO",
  "CERVEZA",
  "AGUA",
];

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
];

function vigenereDecrypt(text: string, key: string): string {
  const result = [];
  let keyIndex = 0;
  const upperKey = key.toUpperCase();

  // Normalize accented characters to their base form
  function normalizeChar(char: string): string {
    const accentMap: { [key: string]: string } = {
      Á: "A",
      É: "E",
      Í: "I",
      Ó: "O",
      Ú: "U",
      Ñ: "N",
    };
    return accentMap[char.toUpperCase()] || char;
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isUpperCase = char === char.toUpperCase();
    const normalizedChar = normalizeChar(char).toUpperCase();

    // Check if character is A-Z
    if (normalizedChar.match(/[A-Z]/)) {
      const keyChar = upperKey[keyIndex % upperKey.length];

      // Standard Vigenère decryption: (ciphertext - key) mod 26
      const charPos = normalizedChar.charCodeAt(0) - 65;
      const keyPos = keyChar.charCodeAt(0) - 65;
      const decryptedPos = (charPos - keyPos + 26) % 26;
      const decryptedChar = String.fromCharCode(decryptedPos + 65);

      result.push(isUpperCase ? decryptedChar : decryptedChar.toLowerCase());
      keyIndex++;
    } else {
      // Pass non-alphabetic characters through unchanged
      result.push(char);
    }
  }

  return result.join("");
}

function scoreText(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  for (const word of words) {
    if (commonSpanishWords.includes(word)) {
      score += 1;
    }
  }

  return score;
}

export const vigenereCipherTool = createTool({
  id: "vigenere-cipher-decryption",
  description:
    "Attempts to decrypt a Vigenère cipher by trying common Spanish keywords and returning the most likely decryption",
  inputSchema: z.object({
    encryptedText: z.string().describe("The encrypted text to decrypt"),
  }),
  outputSchema: z.object({
    decryptedText: z.string(),
    key: z.string(),
    confidence: z.number(),
    method: z.string(),
  }),
  execute: async ({ context }) => {
    const { encryptedText } = context;
    let bestDecryption = "";
    let bestScore = -1;
    let bestKey = "";

    // Try all common Spanish keywords
    for (const key of commonSpanishKeys) {
      const decrypted = vigenereDecrypt(encryptedText, key);
      const score = scoreText(decrypted);

      if (score > bestScore) {
        bestScore = score;
        bestDecryption = decrypted;
        bestKey = key;
      }
    }

    return {
      decryptedText: bestDecryption,
      key: bestKey,
      confidence: bestScore,
      method: "Vigenère Cipher",
    };
  },
});
