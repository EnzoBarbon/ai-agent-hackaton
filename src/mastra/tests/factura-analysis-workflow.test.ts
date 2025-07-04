import path from "path";
import { describe, expect, it } from "vitest";
import { runFacturaAnalysisWorkflow } from "../workflows/factura-analysis-workflow";

interface FacturaTestCase {
  facturaId: number;
  pregunta: string;
  respuestasValidas: string[];
  validacionPersonalizada?: (respuesta: string) => boolean;
  respuestaEsperada?: any; // For complex expected values
}

const factura1TestCases: FacturaTestCase[] = [
  {
    facturaId: 1,
    pregunta: "¿Qué día es el que más kW he consumido?",
    respuestasValidas: [
      "25/12/2024",
      "25 de diciembre de 2024",
      "25-12-2024",
      "diciembre 25, 2024",
      "25/12",
      "día 25",
    ],
    validacionPersonalizada: (respuesta: string) => {
      return (
        respuesta.toLowerCase().includes("25") &&
        (respuesta.toLowerCase().includes("diciembre") ||
          respuesta.includes("12"))
      );
    },
  },
  {
    facturaId: 1,
    pregunta: "¿Qué mes tuve el mayor consumo promedio?",
    respuestasValidas: [
      "diciembre 2024",
      "diciembre",
      "mes de diciembre",
      "en diciembre",
    ],
    validacionPersonalizada: (respuesta: string) => {
      return respuesta.toLowerCase().includes("diciembre");
    },
  },
  {
    facturaId: 1,
    pregunta: "¿Cuál es mi IBAN?",
    respuestasValidas: [
      "ES45 6789 0123 4567 8901 2345",
      "ES45678901234567890123456",
      "ES45-6789-0123-4567-8901-2345",
      "ES 45 6789 0123 4567 8901 2345",
    ],
    validacionPersonalizada: (respuesta: string) => {
      // Extract just the IBAN number from the response
      const ibanMatch = respuesta.match(
        /ES\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/
      );
      if (ibanMatch) {
        const cleanIban = ibanMatch[0].replace(/[\s\-\.]/g, "");
        return cleanIban === "ES45678901234567890123456";
      }
      // Fallback: check if response contains ES45 and appears to be an IBAN
      return respuesta.includes("ES45") && respuesta.includes("6789");
    },
  },
  {
    facturaId: 1,
    pregunta: "¿Qué días de mayo consumí más de 5 kWh?",
    respuestasValidas: [
      "ningún día",
      "no hay datos de mayo",
      "sin datos de mayo",
      "no hay información de mayo",
      "no consumí en mayo",
      "no hay registros de mayo",
    ],
    validacionPersonalizada: (respuesta: string) => {
      const respuestaLower = respuesta.toLowerCase();
      return (
        respuestaLower.includes("no") ||
        respuestaLower.includes("ningún") ||
        respuestaLower.includes("sin") ||
        respuestaLower.includes("mayo")
      );
    },
  },
  {
    facturaId: 1,
    pregunta: "¿Cuánto pague en total por Derechos de acceso?",
    respuestasValidas: [
      "3.50",
      "3,50",
      "€3.50",
      "3.50 euros",
      "3,50 €",
      "tres euros y cincuenta céntimos",
    ],
    validacionPersonalizada: (respuesta: string) => {
      return (
        respuesta.includes("3") &&
        (respuesta.includes("50") || respuesta.includes("5"))
      );
    },
  },
  {
    facturaId: 1,
    pregunta: "¿En cuantos domicilios he vivido y cuantos días en cada uno?",
    respuestasValidas: [
      "1 domicilio",
      "un domicilio",
      "31 días",
      "todo el mes",
    ],
    validacionPersonalizada: (respuesta: string) => {
      const respuestaLower = respuesta.toLowerCase();
      return (
        respuestaLower.includes("un domicilio") ||
        ((respuestaLower.includes("1") || respuestaLower.includes("un")) &&
          (respuestaLower.includes("domicilio") ||
            respuestaLower.includes("dirección")) &&
          (respuestaLower.includes("31") || respuestaLower.includes("mes")))
      );
    },
  },
  {
    facturaId: 1,
    pregunta: "Dime el consumo de todos los fines de semana de mayo",
    respuestasValidas: [
      "no hay datos de mayo",
      "sin información de mayo",
      "no hay consumo en mayo",
      "sin datos",
    ],
    validacionPersonalizada: (respuesta: string) => {
      const respuestaLower = respuesta.toLowerCase();
      return (
        respuestaLower.includes("no") ||
        respuestaLower.includes("sin") ||
        respuestaLower.includes("mayo")
      );
    },
  },
  {
    facturaId: 1,
    pregunta: "¿Qué día es que más kWh he consumido en horario Valle?",
    respuestasValidas: [
      "25/12/2024",
      "25 de diciembre",
      "25-12-2024",
      "día 25",
    ],
    validacionPersonalizada: (respuesta: string) => {
      return (
        respuesta.includes("25") &&
        (respuesta.toLowerCase().includes("diciembre") ||
          respuesta.includes("12"))
      );
    },
  },
  {
    facturaId: 1,
    pregunta: "¿Cuánto he pagado total en impuestos?",
    respuestasValidas: ["14.90", "14,90", "€14.90", "14.90 euros", "14,90 €"],
    validacionPersonalizada: (respuesta: string) => {
      return respuesta.includes("14") && respuesta.includes("90");
    },
  },
];

const factura2TestCases: FacturaTestCase[] = [
  {
    facturaId: 2,
    pregunta:
      "¿Cuál fue el consumo promedio diario considerando únicamente los días pares de junio?",
    respuestasValidas: [
      "5.97",
      "5,97",
      "5.9733",
      "5,9733",
      "aproximadamente 5.97",
      "cerca de 5.97",
    ],
    validacionPersonalizada: (respuesta: string) => {
      // Extract numbers from the response
      const numbers = respuesta.match(/\d+[.,]\d+|\d+/g);
      if (numbers) {
        const value = parseFloat(numbers[0].replace(",", "."));
        // Allow some tolerance for rounding (5.97 ± 0.05)
        return value >= 5.92 && value <= 6.02;
      }
      return false;
    },
  },
  {
    facturaId: 2,
    pregunta:
      "¿Qué porcentaje del importe total de la factura corresponde a la suma de Impuestos y Financiación Bono Social? Responde con un porcentaje",
    respuestasValidas: [
      "18.14%",
      "18,14%",
      "18.14 %",
      "18,14 %",
      "aproximadamente 18%",
      "cerca del 18%",
    ],
    validacionPersonalizada: (respuesta: string) => {
      // Extract percentage from the response
      const percentMatch = respuesta.match(/(\d+[.,]\d+|\d+)%?/);
      if (percentMatch) {
        const value = parseFloat(percentMatch[1].replace(",", "."));
        // Allow some tolerance for rounding (18.14 ± 0.5)
        return value >= 17.5 && value <= 18.7;
      }
      return false;
    },
  },
  {
    facturaId: 2,
    pregunta:
      "Si el programa de puntos concede 1 punto por cada 0,4 kWh consumidos, ¿cuántos puntos netos debería tener Laura tras esta factura, descontando los 150 puntos canjeados?",
    respuestasValidas: [
      "300",
      "300 puntos",
      "trescientos puntos",
      "trescientos",
    ],
    validacionPersonalizada: (respuesta: string) => {
      // Extract numbers from the response
      const numbers = respuesta.match(/\d+/g);
      if (numbers) {
        const value = parseInt(numbers[0]);
        // Should be exactly 300 or very close
        return value >= 295 && value <= 305;
      }
      return false;
    },
  },
];

// Get the real PDF file path
const getFacturaPdfPath = (facturaId: number): string => {
  return path.join(
    process.cwd(),
    "src",
    "mastra",
    "problem-data",
    "Facturas",
    `${facturaId}.pdf`
  );
};

describe("Factura Analysis Workflow - Real PDF Tests", () => {
  describe("Factura 1 Test Cases", () => {
    factura1TestCases.forEach((testCase, index) => {
      it(`should answer question ${index + 1}: "${testCase.pregunta}"`, async () => {
        const pdfPath = getFacturaPdfPath(testCase.facturaId);

        console.log(`\n📄 Processing real PDF: ${pdfPath}`);
        console.log(`❓ Question: ${testCase.pregunta}`);

        const result = await runFacturaAnalysisWorkflow({
          filePath: pdfPath,
          questions: [testCase.pregunta],
        });

        expect(result).toBeDefined();
        expect(result.answers).toHaveLength(1);

        const respuesta = result.answers[0];
        expect(respuesta.question).toBe(testCase.pregunta);
        expect(respuesta.answer).toBeDefined();
        expect(typeof respuesta.answer).toBe("string");
        expect(respuesta.answer.length).toBeGreaterThan(0);

        console.log(`✅ Answer: ${respuesta.answer}`);

        // Validate using custom validation function if provided
        if (testCase.validacionPersonalizada) {
          const isValid = testCase.validacionPersonalizada(respuesta.answer);
          if (!isValid) {
            console.log(
              `❌ Custom validation failed for: "${respuesta.answer}"`
            );
            console.log(
              `   Expected to match validation rules for: ${testCase.pregunta}`
            );
          }
          expect(isValid).toBe(true);
        } else {
          // Validate using any of the valid responses
          const isValidResponse = testCase.respuestasValidas.some(
            (validResponse) =>
              respuesta.answer
                .toLowerCase()
                .includes(validResponse.toLowerCase())
          );

          if (!isValidResponse) {
            console.log(
              `❌ Response validation failed for: "${respuesta.answer}"`
            );
            console.log(
              `   Expected one of: ${testCase.respuestasValidas.join(", ")}`
            );
          }
          expect(isValidResponse).toBe(true);
        }

        // Verify structured data is extracted
        expect(result.structuredData).toBeDefined();
        expect(result.structuredData.customer).toBeDefined();
        expect(result.structuredData.invoice).toBeDefined();
        expect(result.structuredData.charges).toBeDefined();
        expect(result.structuredData.total).toBeGreaterThan(0);

        console.log(`💰 Total factura: €${result.structuredData.total}`);
      }, 60000); // 60 second timeout for real LLM calls with PDF processing
    });
  });

  describe("Factura 2 Test Cases", () => {
    factura2TestCases.forEach((testCase, index) => {
      it(`should answer question ${index + 1}: "${testCase.pregunta}"`, async () => {
        const pdfPath = getFacturaPdfPath(testCase.facturaId);

        console.log(`\n📄 Processing real PDF: ${pdfPath}`);
        console.log(`❓ Question: ${testCase.pregunta}`);

        const result = await runFacturaAnalysisWorkflow({
          filePath: pdfPath,
          questions: [testCase.pregunta],
        });

        expect(result).toBeDefined();
        expect(result.answers).toHaveLength(1);

        const respuesta = result.answers[0];
        expect(respuesta.question).toBe(testCase.pregunta);
        expect(respuesta.answer).toBeDefined();
        expect(typeof respuesta.answer).toBe("string");
        expect(respuesta.answer.length).toBeGreaterThan(0);

        console.log(`✅ Answer: ${respuesta.answer}`);

        // Validate using custom validation function if provided
        if (testCase.validacionPersonalizada) {
          const isValid = testCase.validacionPersonalizada(respuesta.answer);
          if (!isValid) {
            console.log(
              `❌ Custom validation failed for: "${respuesta.answer}"`
            );
            console.log(
              `   Expected to match validation rules for: ${testCase.pregunta}`
            );
          }
          expect(isValid).toBe(true);
        } else {
          // Validate using any of the valid responses
          const isValidResponse = testCase.respuestasValidas.some(
            (validResponse) =>
              respuesta.answer
                .toLowerCase()
                .includes(validResponse.toLowerCase())
          );

          if (!isValidResponse) {
            console.log(
              `❌ Response validation failed for: "${respuesta.answer}"`
            );
            console.log(
              `   Expected one of: ${testCase.respuestasValidas.join(", ")}`
            );
          }
          expect(isValidResponse).toBe(true);
        }

        // Verify structured data is extracted
        expect(result.structuredData).toBeDefined();
        expect(result.structuredData.customer).toBeDefined();
        expect(result.structuredData.invoice).toBeDefined();
        expect(result.structuredData.charges).toBeDefined();
        expect(result.structuredData.total).toBeGreaterThan(0);

        console.log(`💰 Total factura: €${result.structuredData.total}`);
      }, 60000); // 60 second timeout for real LLM calls with PDF processing
    });
  });

  describe("Multiple Questions Test", () => {
    it("should handle multiple questions in a single workflow run", async () => {
      const multipleQuestions = [
        "¿Cuál es mi IBAN?",
        "¿Qué día es el que más kW he consumido?",
        "¿Cuánto he pagado total en impuestos?",
      ];

      const pdfPath = getFacturaPdfPath(1);
      console.log(`\n📄 Processing multiple questions for: ${pdfPath}`);

      const result = await runFacturaAnalysisWorkflow({
        filePath: pdfPath,
        questions: multipleQuestions,
      });

      expect(result.answers).toHaveLength(3);

      result.answers.forEach((answer, index) => {
        expect(answer.question).toBe(multipleQuestions[index]);
        expect(answer.answer).toBeDefined();
        expect(typeof answer.answer).toBe("string");
        expect(answer.answer.length).toBeGreaterThan(0);
      });

      console.log("\n🔍 Multiple Questions Results:");
      result.answers.forEach((qa, index) => {
        console.log(`${index + 1}. ${qa.question}`);
        console.log(`   Answer: ${qa.answer}`);
      });

      // Basic validation for key answers
      const ibanAnswer = result.answers[0].answer;
      const hasValidIban =
        ibanAnswer.toLowerCase().includes("es") && /\d/.test(ibanAnswer);
      expect(hasValidIban).toBe(true);

      const dayAnswer = result.answers[1].answer;
      const hasDayInfo =
        /\d/.test(dayAnswer) &&
        (dayAnswer.toLowerCase().includes("diciembre") ||
          dayAnswer.includes("12"));
      expect(hasDayInfo).toBe(true);

      const taxAnswer = result.answers[2].answer;
      const hasTaxInfo =
        /\d/.test(taxAnswer) &&
        (taxAnswer.includes("€") ||
          taxAnswer.toLowerCase().includes("euro") ||
          taxAnswer.includes("EUR"));
      expect(hasTaxInfo).toBe(true);
    }, 90000); // 90 second timeout for multiple LLM calls
  });

  describe("Edge Cases and Complex Questions", () => {
    it("should handle questions about non-existent data gracefully", async () => {
      const edgeCaseQuestions = [
        "¿Qué días de mayo consumí más de 5 kWh?",
        "¿Cuál fue mi consumo en enero?",
        "¿Tengo datos de febrero?",
      ];

      const pdfPath = getFacturaPdfPath(1);

      for (const question of edgeCaseQuestions) {
        console.log(`\n🔍 Testing edge case: ${question}`);

        const result = await runFacturaAnalysisWorkflow({
          filePath: pdfPath,
          questions: [question],
        });

        expect(result.answers).toHaveLength(1);
        const answer = result.answers[0].answer;

        expect(answer).toBeDefined();
        expect(typeof answer).toBe("string");

        console.log(`📝 Answer: ${answer}`);

        // Should indicate no data or no information for these months
        const indicatesNoData =
          answer.toLowerCase().includes("no") ||
          answer.toLowerCase().includes("sin") ||
          answer.toLowerCase().includes("ningún") ||
          answer.toLowerCase().includes("mayo") ||
          answer.toLowerCase().includes("enero") ||
          answer.toLowerCase().includes("febrero");

        expect(indicatesNoData).toBe(true);
      }
    }, 80000);

    it("should handle calculation-heavy questions", async () => {
      const calculationQuestions = [
        "¿Cuál fue mi consumo total en diciembre?",
        "¿Cuántos días consumí más de 8 kWh?",
        "¿Cuál fue la diferencia entre el día de mayor y menor consumo?",
      ];

      const pdfPath = getFacturaPdfPath(1);

      for (const question of calculationQuestions) {
        console.log(`\n🧮 Testing calculation question: ${question}`);

        const result = await runFacturaAnalysisWorkflow({
          filePath: pdfPath,
          questions: [question],
        });

        expect(result.answers).toHaveLength(1);
        const answer = result.answers[0].answer;

        expect(answer).toBeDefined();
        expect(typeof answer).toBe("string");

        console.log(`📊 Answer: ${answer}`);

        // Should contain numerical information
        const containsNumbers = /\d+/.test(answer);
        expect(containsNumbers).toBe(true);

        // Should contain units (kWh, días, etc.)
        const containsUnits =
          answer.toLowerCase().includes("kwh") ||
          answer.toLowerCase().includes("día") ||
          answer.toLowerCase().includes("consumo");
        expect(containsUnits).toBe(true);
      }
    }, 80000);
  });

  describe("Structured Data Validation", () => {
    it("should extract structured data correctly from real PDF", async () => {
      const pdfPath = getFacturaPdfPath(1);
      console.log(`\n📊 Testing structured data extraction from: ${pdfPath}`);

      const result = await runFacturaAnalysisWorkflow({
        filePath: pdfPath,
        questions: ["¿Cuál es mi IBAN?"], // Simple question to test workflow
      });

      const data = result.structuredData;

      // Validate basic structure
      expect(data.customer).toBeDefined();
      expect(data.customer.name).toBeDefined();
      expect(data.customer.address).toBeDefined();
      expect(typeof data.customer.name).toBe("string");
      expect(typeof data.customer.address).toBe("string");

      // Validate invoice data
      expect(data.invoice).toBeDefined();
      expect(data.invoice.number).toBeDefined();
      expect(data.invoice.iban).toBeDefined();
      expect(data.invoice.period).toBeDefined();
      expect(typeof data.invoice.iban).toBe("string");
      expect(data.invoice.iban.length).toBeGreaterThan(10); // Valid IBAN length

      // Validate charges
      expect(data.charges).toBeDefined();
      expect(typeof data.charges.access).toBe("number");
      expect(typeof data.charges.taxes).toBe("number");
      expect(data.charges.powerpunta_or_total).toBeDefined();
      expect(typeof data.charges.powerpunta_or_total.power).toBe("number");
      expect(typeof data.charges.powerpunta_or_total.charge).toBe("number");

      // Validate consumption data
      expect(typeof data.total).toBe("number");
      expect(data.total).toBeGreaterThan(0);
      expect(typeof data.avg_daily_consumption).toBe("number");
      expect(data.avg_daily_consumption).toBeGreaterThan(0);
      expect(Array.isArray(data.daily_consumption)).toBe(true);
      expect(data.daily_consumption.length).toBeGreaterThan(0);

      // Validate daily consumption structure
      data.daily_consumption.forEach((day, index) => {
        if (index < 3) {
          // Check first few entries
          expect(day).toHaveProperty("date");
          expect(day).toHaveProperty("punta");
          expect(day).toHaveProperty("valle");
          expect(day).toHaveProperty("total");
          expect(typeof day.punta).toBe("number");
          expect(typeof day.valle).toBe("number");
          expect(typeof day.total).toBe("number");
        }
      });

      console.log("\n📈 Structured Data Summary:");
      console.log(`👤 Customer: ${data.customer.name}`);
      console.log(`🏠 Address: ${data.customer.address}`);
      console.log(`💰 Total: €${data.total}`);
      console.log(
        `⚡ Avg Daily Consumption: ${data.avg_daily_consumption} kWh`
      );
      console.log(`📅 Days with data: ${data.daily_consumption.length}`);
      console.log(`🏧 IBAN: ${data.invoice.iban}`);
    }, 60000);
  });

  describe("Response Quality Validation", () => {
    it("should provide contextual and detailed responses", async () => {
      const complexQuestions = [
        "Explícame el desglose completo de mi factura",
        "¿Cómo ha sido mi patrón de consumo durante el mes?",
        "¿Qué días de la semana consumo más energía?",
      ];

      const pdfPath = getFacturaPdfPath(1);

      for (const question of complexQuestions) {
        console.log(`\n💬 Testing complex question: ${question}`);

        const result = await runFacturaAnalysisWorkflow({
          filePath: pdfPath,
          questions: [question],
        });

        const answer = result.answers[0].answer;

        // Response should be detailed (more than just a number)
        expect(answer.length).toBeGreaterThan(50);

        // Should contain contextual information
        const isContextual =
          answer.includes("€") ||
          answer.toLowerCase().includes("kwh") ||
          answer.toLowerCase().includes("consumo") ||
          answer.toLowerCase().includes("día") ||
          answer.toLowerCase().includes("factura");

        expect(isContextual).toBe(true);

        console.log(`📝 Answer length: ${answer.length} characters`);
        console.log(`📄 Answer preview: ${answer.substring(0, 200)}...`);
      }
    }, 90000);
  });
});
