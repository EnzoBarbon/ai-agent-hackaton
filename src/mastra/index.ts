import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { cryptoanalystAgent } from "./agents/cryptoanalyst-agent";
import { facturaAnalisisAgent } from "./agents/factura-agente";
import { facturaQAAgent } from "./agents/factura-qa-agent";
import { hashDetectionAgent } from "./agents/hash-detection-agent";
import { iocExtractionAgent } from "./agents/ioc-extraction-agent";

export const mastra = new Mastra({
  workflows: {},
  agents: {
    iocExtractionAgent,
    hashDetectionAgent,
    cryptoanalystAgent,
    facturaAnalisisAgent,
    facturaQAAgent,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "debug", // Changed to debug to capture telemetry traces
  }),
  // Add telemetry configuration to see tool calls and execution steps
  telemetry: {
    serviceName: "factura-analysis",
    enabled: true,
    sampling: {
      type: "always_on", // Capture all traces
    },
    export: {
      type: "console", // Output traces to console
    },
  },
});
