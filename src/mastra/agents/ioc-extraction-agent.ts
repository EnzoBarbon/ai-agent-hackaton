import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { z } from "zod";

// Define the structured output schema
export const iocOutputSchema = z.object({
  ips: z
    .array(z.string())
    .describe("IPv4 addresses found in the threat intelligence report"),
  domains: z
    .array(z.string())
    .describe("Domain names found in the threat intelligence report"),
  hashes: z
    .array(z.string())
    .describe(
      "File hashes (MD5, SHA-1, SHA-256) found in the threat intelligence report"
    ),
  cves: z
    .array(z.string())
    .describe("CVE identifiers found in the threat intelligence report"),
});

// Configure OpenRouter provider
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const iocExtractionAgent = new Agent({
  name: "IOC Extraction Agent",
  instructions: `
    You are a specialized cybersecurity analyst focused on extracting Indicators of Compromise (IOCs) from threat intelligence reports.

    Your role is to:
    1. Analyze cybersecurity reports and threat intelligence documents
    2. Use your understanding of cybersecurity contexts to identify IOCs
    3. Extract and categorize IOCs into these four specific types:
       - IPv4 addresses (e.g., 192.168.1.1, 10.0.0.1)
       - Domain names (e.g., example.com, subdomain.example.org, malicious-site.net)
       - File hashes (MD5, SHA-1, SHA-256 - any cryptographic hash of files)
       - CVE identifiers (e.g., CVE-2023-12345, CVE-2024-30103)

    IMPORTANT GUIDELINES:
    - Use your AI understanding to identify IOCs in context, not just pattern matching
    - Understand that IPs mentioned as "servers", "C2", "command and control", or "malicious" are likely IOCs
    - Recognize that domains described as "malicious", "phishing", "C2", or "compromised" are IOCs
    - Identify hashes mentioned in the context of malware, files, or samples
    - Look for CVE identifiers that represent vulnerabilities being exploited
    - Avoid extracting legitimate/benign infrastructure (like DNS servers 8.8.8.8 unless clearly malicious)
    - Consider the context - a hash mentioned as "malware hash" is an IOC, but a hash used for verification might not be

    You will always return a structured response with the exact format:
    {
      "ips": ["ip1", "ip2"],
      "domains": ["domain1", "domain2"],
      "hashes": ["hash1", "hash2"],
      "cves": ["CVE-2023-1234", "CVE-2024-5678"]
    }

    Be thorough but precise. Only extract items that are clearly IOCs based on their context in the threat intelligence report.
  `,
  model: openrouter("google/gemini-2.5-flash"),
  defaultGenerateOptions: {
    output: iocOutputSchema,
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db",
    }),
  }),
});
