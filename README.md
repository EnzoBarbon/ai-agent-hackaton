# AI Agent Hackathon - Cybersecurity Agents

This project implements three specialized cybersecurity agents using [Mastra](https://mastra.ai) for a hackathon challenge.

## 🔍 IOC Extraction Agent

The IOC (Indicators of Compromise) Extraction Agent is a specialized cybersecurity analyst that extracts threat intelligence from security reports using AI-powered context understanding.

### Features

- **Context-Aware Analysis**: Uses AI to understand cybersecurity context, not just pattern matching
- **Structured Output**: Guaranteed JSON format using Zod schemas
- **Type Safety**: Full TypeScript support with proper validation
- **Memory Integration**: Remembers previous analyses for better context
- **Powered by Gemini 2.5 Flash**: Uses Google's latest Gemini model via OpenRouter for superior performance

### Supported IOC Types

- **IPv4 Addresses**: Malicious IP addresses from threat reports
- **Domains**: Phishing sites, C2 servers, and compromised domains
- **File Hashes**: MD5, SHA-1, and SHA-256 hashes of malware samples
- **CVE Identifiers**: Exploited vulnerabilities (e.g., CVE-2023-12345)

## 🚀 Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- OpenRouter API key (set as `OPENROUTER_API_KEY` environment variable)
  - Get your API key from [OpenRouter](https://openrouter.ai/)

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the project root (you can copy from `env.example`):

```bash
cp env.example .env
```

Then edit `.env` with your API key:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Running the Agent

#### Option 1: Use the Mastra Development Server

```bash
npm run dev
```

Then access the agent at: `http://localhost:4111/api/agents/iocExtractionAgent/generate`

#### Option 2: Run the Example Script

```bash
npm run example:ioc
```

#### Option 3: Direct API Usage

```bash
curl -X POST http://localhost:4111/api/agents/iocExtractionAgent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "The malware connects to C2 server at 192.168.1.100 and uses domain evil.com. Hash: abc123def456abc123def456abc123def456. Exploits CVE-2023-1234."
      }
    ],
    "output": {
      "type": "object",
      "properties": {
        "ips": { "type": "array", "items": { "type": "string" } },
        "domains": { "type": "array", "items": { "type": "string" } },
        "hashes": { "type": "array", "items": { "type": "string" } },
        "cves": { "type": "array", "items": { "type": "string" } }
      }
    }
  }'
```

### Testing

Run the test suite:

```bash
npm test
```

Or run tests once:

```bash
npm run test:run
```

## 💡 Usage Examples

### Basic Usage

```typescript
import {
  iocExtractionAgent,
  iocOutputSchema,
} from "./src/mastra/agents/ioc-extraction-agent.js";

const threatReport = `
  APT group used malicious domain evil.com and IP 192.168.1.100.
  The malware hash is abc123def456abc123def456abc123def456.
  They exploited CVE-2023-1234.
`;

const result = await iocExtractionAgent.generate(threatReport, {
  output: iocOutputSchema,
});

const iocs = result.object;
console.log("Extracted IOCs:", iocs);
// Output: {
//   "ips": ["192.168.1.100"],
//   "domains": ["evil.com"],
//   "hashes": ["abc123def456abc123def456abc123def456"],
//   "cves": ["CVE-2023-1234"]
// }
```

### With Memory Context

```typescript
const result = await iocExtractionAgent.generate(threatReport, {
  output: iocOutputSchema,
  memory: {
    thread: "investigation-1",
    resource: "analyst-123",
  },
});
```

### Batch Processing

```typescript
const reports = [report1, report2, report3];

const results = await Promise.all(
  reports.map(async (report) => {
    const result = await iocExtractionAgent.generate(report, {
      output: iocOutputSchema,
    });
    return result.object;
  })
);

// Combine and deduplicate IOCs
const allIocs = {
  ips: [...new Set(results.flatMap((ioc) => ioc.ips))],
  domains: [...new Set(results.flatMap((ioc) => ioc.domains))],
  hashes: [...new Set(results.flatMap((ioc) => ioc.hashes))],
  cves: [...new Set(results.flatMap((ioc) => ioc.cves))],
};
```

## 🏗️ Architecture

### Agent Structure

```
src/mastra/
├── agents/
│   ├── ioc-extraction-agent.ts    # Main agent implementation
│   └── weather-agent.ts           # Example weather agent
├── tests/
│   └── ioc-extraction-agent.test.ts # Test suite
├── index.ts                       # Main Mastra configuration
└── ...
```

### Key Components

1. **Agent**: Uses Google Gemini 2.5 Flash for intelligent IOC extraction
2. **Zod Schema**: Ensures structured output validation
3. **Memory System**: LibSQL storage for conversation history
4. **Testing**: Comprehensive test suite with vitest
5. **OpenRouter Integration**: Reliable access to Gemini 2.5 Flash model

## 🧪 Testing

The project includes comprehensive tests covering:

- **IOC Extraction**: Verifies correct extraction from Spanish threat reports
- **Context Awareness**: Tests ability to distinguish malicious vs. legitimate infrastructure
- **Structured Output**: Validates schema compliance and type safety
- **Edge Cases**: Handles empty reports and complex scenarios

## 🔒 Security Considerations

- **Context Validation**: AI validates IOCs based on threat context
- **Schema Compliance**: Guaranteed response format prevents injection attacks
- **Memory Isolation**: Each user/thread has isolated memory context
- **Type Safety**: Full TypeScript validation prevents runtime errors
- **API Key Security**: OpenRouter API key is safely stored in environment variables

## 🤖 Model Information

- **Model**: Google Gemini 2.5 Flash Experimental
- **Provider**: OpenRouter (https://openrouter.ai/)
- **Performance**: Optimized for speed and accuracy in cybersecurity analysis
- **Context Window**: Large context window for processing lengthy threat reports

## 📖 Training Data

The agent was trained and tested using the provided Spanish threat intelligence reports in `src/mastra/problem-data/`.

## 🚧 Future Enhancements

- Hash Detection Agent (for precise hash classification)
- Cryptoanalyst Agent (for classical cipher decryption)
- Integration with external threat intelligence APIs
- Advanced memory search and recall capabilities

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

This is a hackathon project. For questions or improvements, please open an issue or submit a pull request.
