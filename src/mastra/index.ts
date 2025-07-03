import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { hashDetectionAgent } from "./agents/hash-detection-agent";
import { iocExtractionAgent } from "./agents/ioc-extraction-agent";

export const mastra = new Mastra({
  workflows: {},
  agents: { iocExtractionAgent, hashDetectionAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
