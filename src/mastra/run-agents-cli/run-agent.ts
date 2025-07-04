import fs from "fs";
import path from "path";
import readline from "readline";
import { cryptoanalystAgent } from "../agents/cryptoanalyst-agent";
import { hashDetectionAgent } from "../agents/hash-detection-agent";
import { iocExtractionAgent } from "../agents/ioc-extraction-agent";
import { runFacturaAnalysisWorkflow } from "../workflows/factura-analysis-workflow";

const agentList = [
  { name: "hashDetectionAgent", agent: hashDetectionAgent },
  { name: "facturaAnalisisAgent", agent: runFacturaAnalysisWorkflow },
  { name: "iocExtractionAgent", agent: iocExtractionAgent },
  { name: "cryptoanalystAgent", agent: cryptoanalystAgent },
];

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function ask(question: string): Promise<string> {
    return new Promise((resolve) => rl.question(question, resolve));
  }

  try {
    // Print agent list with numbers
    console.log("Available agents:");
    agentList.forEach((entry, idx) => {
      console.log(`  [${idx + 1}] ${entry.name}`);
    });

    let agentIdx: number | undefined;
    while (true) {
      const input = (
        await ask(`Select agent by number (1-${agentList.length}): `)
      ).trim();
      const idx = parseInt(input, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= agentList.length) {
        agentIdx = idx - 1;
        break;
      }
      console.error(
        `Invalid selection. Please enter a number between 1 and ${agentList.length}.`
      );
    }

    const selectedAgentName = agentList[agentIdx].name;
    const agent = agentList[agentIdx].agent;

    // Custom behavior per agent (template)
    let filePath: string | undefined;
    let prompt: string = "";

    switch (selectedAgentName) {
      case "hashDetectionAgent":
        filePath = await ask("Enter path to file: ");
        break;
      case "facturaAnalisisAgent":
        filePath = await ask("Enter path to file: ");
        prompt = await ask("Enter your prompt: ");
        break;
      case "iocExtractionAgent":
        filePath = await ask("Enter path to file: ");
        break;
      case "cryptoanalystAgent":
        prompt = await ask("Enter your prompt: ");
        break;
      default:
        break;
    }

    let fileContent = "";
    if (filePath) {
      try {
        const resolvedPath = path.resolve(filePath);
        const ext = path.extname(resolvedPath).toLowerCase();
        if (ext === ".pdf") {
          // Dynamically import to avoid circular deps if any
          const { extractTextFromPdf } = await import(
            "../tools/extract-text-from-pdf"
          );
          fileContent = await extractTextFromPdf(resolvedPath);
        } else {
          fileContent = fs.readFileSync(resolvedPath, "utf8");
        }
      } catch (err) {
        console.error(`Could not read file at "${filePath}":`, err);
        rl.close();
        return;
      }
    } else {
      console.error("No file path provided");
      rl.close();
      return;
    }

    console.log(fileContent);
    console.log(`\nRunning agent "${selectedAgentName}"...\n`);

    let result;

    switch (selectedAgentName) {
      case "facturaAnalisisAgent":
        result = await runFacturaAnalysisWorkflow({
          filePath: filePath,
          questions: [prompt],
        });
        break;
      case "hashDetectionAgent":
      case "iocExtractionAgent":
      case "cryptoanalystAgent":
        const combinedPrompt = `${prompt}${fileContent}`;
        result = await (agent as any).generate(combinedPrompt);
        break;
      default:
        throw new Error(`Unknown agent: ${selectedAgentName}`);
    }

    // Try to pretty-print JSON if possible
    let output = result?.text;
    try {
      const parsed = JSON.parse(result.text);
      output = JSON.stringify(parsed, null, 2);
    } catch {
      // Not JSON, just print as is
    }

    console.log("Agent result:\n", output);
  } catch (err) {
    console.error("Error running agent:", err);
  } finally {
    rl.close();
  }
}

main();
