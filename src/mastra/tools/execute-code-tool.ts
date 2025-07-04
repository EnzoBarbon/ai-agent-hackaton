import { createTool } from "@mastra/core/tools";
import * as vm from "vm";
import { z } from "zod";

export const executeCodeTool = createTool({
  id: "execute-code",
  description:
    "Executes JavaScript code to help decrypt ciphered text. Use this when the Caesar cipher tool doesn't provide a coherent Spanish result and you need to implement custom decryption logic.",
  inputSchema: z.object({
    encryptedText: z.string().describe("The encrypted text to decrypt"),
    code: z
      .string()
      .describe(
        "JavaScript code that will process the encrypted text. The code should define a function named 'decrypt' that takes the encrypted text as parameter and returns the decrypted text."
      ),
  }),
  outputSchema: z.object({
    result: z.string().describe("The result of executing the code"),
    success: z.boolean().describe("Whether the code executed successfully"),
    error: z.string().optional().describe("Error message if execution failed"),
  }),
  execute: async ({ context }) => {
    const { encryptedText, code } = context;

    try {
      // Create a sandbox context
      const sandbox = {
        console: {
          log: (...args: any[]) => console.log(...args),
          error: (...args: any[]) => console.error(...args),
        },
        result: null,
        encryptedText: encryptedText,
      };

      vm.createContext(sandbox);

      // Prepare the full code with the encrypted text
      const fullCode = `
        ${code}
        
        // Execute the decrypt function if it exists
        if (typeof decrypt === 'function') {
          result = decrypt(encryptedText);
        } else {
          throw new Error('No decrypt function found. Please define a function named "decrypt" that takes the encrypted text as parameter.');
        }
      `;

      // Execute the code with timeout
      vm.runInContext(fullCode, sandbox, { timeout: 500000 });

      return {
        result: String(sandbox.result || ""),
        success: true,
      };
    } catch (error: any) {
      return {
        result: "",
        success: false,
        error: error.message || "Unknown error occurred during code execution",
      };
    }
  },
});
