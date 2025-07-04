import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const calculationTool = createTool({
  id: "calculation",
  description:
    "Perform basic mathematical calculations including sum, average, multiplication, division, min, max, and count operations on arrays of numbers or individual operations",
  inputSchema: z.object({
    operation: z
      .enum([
        "sum",
        "average",
        "multiply",
        "divide",
        "min",
        "max",
        "count",
        "add",
        "subtract",
      ])
      .describe("The mathematical operation to perform"),
    numbers: z
      .array(z.number())
      .optional()
      .describe(
        "Array of numbers for operations like sum, average, min, max, count. It's CRUCIAL that you PROVIDE ALL THE NUMBERS NEEDED FOR THE OPERATION"
      ),
    value1: z
      .number()
      .optional()
      .describe(
        "First number for binary operations like multiply, divide, add, subtract"
      ),
    value2: z
      .number()
      .optional()
      .describe(
        "Second number for binary operations like multiply, divide, add, subtract"
      ),
  }),
  execute: async ({ context }) => {
    const { operation, numbers, value1, value2 } = context;
    try {
      switch (operation) {
        case "sum":
          if (!numbers || numbers.length === 0) {
            throw new Error(
              "Se requiere un array de números para la operación suma"
            );
          }
          return {
            result: numbers.reduce((acc: number, num: number) => acc + num, 0),
          };

        case "average":
          if (!numbers || numbers.length === 0) {
            throw new Error(
              "Se requiere un array de números para calcular el promedio"
            );
          }
          const avg =
            numbers.reduce((acc: number, num: number) => acc + num, 0) /
            numbers.length;
          return { result: Math.round(avg * 100) / 100 }; // Round to 2 decimal places

        case "min":
          if (!numbers || numbers.length === 0) {
            throw new Error(
              "Se requiere un array de números para encontrar el mínimo"
            );
          }
          return { result: Math.min(...numbers) };

        case "max":
          if (!numbers || numbers.length === 0) {
            throw new Error(
              "Se requiere un array de números para encontrar el máximo"
            );
          }
          return { result: Math.max(...numbers) };

        case "count":
          if (!numbers) {
            throw new Error("Se requiere un array de números para contar");
          }
          return { result: numbers.length };

        case "multiply":
          if (value1 === undefined || value2 === undefined) {
            throw new Error("Se requieren dos valores para la multiplicación");
          }
          return { result: value1 * value2 };

        case "divide":
          if (value1 === undefined || value2 === undefined) {
            throw new Error("Se requieren dos valores para la división");
          }
          if (value2 === 0) {
            throw new Error("No se puede dividir por cero");
          }
          return { result: Math.round((value1 / value2) * 100) / 100 }; // Round to 2 decimal places

        case "add":
          if (value1 === undefined || value2 === undefined) {
            throw new Error("Se requieren dos valores para la suma");
          }
          return { result: value1 + value2 };

        case "subtract":
          if (value1 === undefined || value2 === undefined) {
            throw new Error("Se requieren dos valores para la resta");
          }
          return { result: value1 - value2 };

        default:
          throw new Error(`Operación no soportada: ${operation}`);
      }
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido en el cálculo",
        result: null,
      };
    }
  },
});
