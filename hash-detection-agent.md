# Hash Detection Agent

## Overview

The Hash Detection Agent is a specialized AI agent designed to analyze technical reports, malware analysis documents, and system logs to automatically detect and classify file hashes. This agent is particularly useful in cybersecurity contexts where analysts need to extract and categorize cryptographic hashes from various sources.

## Problem Statement

In cybersecurity analysis, technical reports often contain numerous file hashes scattered throughout the text. These hashes can be in different formats (MD5, SHA-1, SHA-256, SHA-512, ssdeep) and may appear in various contexts. Manually extracting and classifying these hashes is time-consuming and error-prone.

The Hash Detection Agent solves this problem by:

- Automatically detecting all hash values in technical documents
- Classifying each hash according to its type based on length and format
- Handling truncated or partial hashes
- Supporting multiple languages (Spanish and English)
- Providing structured JSON output for further processing

## Supported Hash Types

The agent can detect and classify the following hash types:

| Hash Type               | Description            | Length                          | Example                                                                                                                            |
| ----------------------- | ---------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **MD5**                 | 128-bit hash           | 32 hexadecimal characters       | `d41d8cd98f00b204e9800998ecf8427e`                                                                                                 |
| **SHA-1**               | 160-bit hash           | 40 hexadecimal characters       | `da39a3ee5e6b4b0d3255bfef95601890afd80709`                                                                                         |
| **SHA-256**             | 256-bit hash           | 64 hexadecimal characters       | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`                                                                 |
| **SHA-512**             | 512-bit hash           | 128 hexadecimal characters      | `cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e` |
| **ssdeep**              | Fuzzy hash             | Variable format with colons     | `3072:Z3z1y2xWv:aBc`                                                                                                               |
| **parcial_desconocido** | Truncated/unknown hash | Variable, often ends with `...` | `900150983cd24fb0d696...`                                                                                                          |

## Output Format

The agent returns a structured JSON response with the following format:

```json
{
  "hashes": [
    {
      "valor": "hash_value_here",
      "tipo": "hash_type_here"
    }
  ]
}
```

## Usage Examples

### Basic Usage

```typescript
import {
  hashDetectionAgent,
  hashDetectionOutputSchema,
} from "./mastra/agents/hash-detection-agent";

const report = `*** Malware Analysis Report ***
File: malware.exe
MD5: d41d8cd98f00b204e9800998ecf8427e
SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;

const result = await hashDetectionAgent.generate(report, {
  output: hashDetectionOutputSchema,
});

console.log(result.object.hashes);
// Output:
// [
//   { "valor": "d41d8cd98f00b204e9800998ecf8427e", "tipo": "MD5" },
//   { "valor": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "tipo": "SHA-256" }
// ]
```

### Training Data Example

The agent was designed to solve the specific problem outlined in the training data:

**Input:**

```
*** Notas de Análisis de Malware - 20250630 ***

Muestra 1: 'payload.dll'
El hash MD5 del fichero es d41d8cd98f00b204e9800998ecf8427e.
También hemos calculado el SHA-1: da39a3ee5e6b4b0d3255bfef95601890afd80709.

Muestra 2: 'installer.msi'
Este instalador es más complejo. El análisis de VirusTotal muestra un hash principal (SHA-256) de e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.
Un analista apuntó este hash como SHA-1: 5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a.

Muestra 3: 'kernel_driver.sys'
Hash de alta entropía detectado, 128 caracteres de longitud:
cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e
El hash difuso (ssdeep) para comparar similitudes es: 3072:Z3z1y2xWv... (el resto no es relevante para el análisis).

Muestra 4: Log de sistema
El log muestra una entrada truncada del hash del proceso: "firwall block for process with hash 900150983cd24fb0d696...".
```

**Expected Output:**

```json
[
  { "valor": "d41d8cd98f00b204e9800998ecf8427e", "tipo": "MD5" },
  { "valor": "da39a3ee5e6b4b0d3255bfef95601890afd80709", "tipo": "SHA-1" },
  {
    "valor": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "tipo": "SHA-256"
  },
  { "valor": "5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a", "tipo": "SHA-1" },
  {
    "valor": "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
    "tipo": "SHA-512"
  },
  { "valor": "3072:Z3z1y2xWv...", "tipo": "ssdeep" },
  { "valor": "900150983cd24fb0d696...", "tipo": "parcial_desconocido" }
]
```

## Running the Example

To see the agent in action, you can run the provided example:

```bash
npm run dev:hash-example
```

Or directly with Node.js:

```bash
npx ts-node src/example-hash-detection.ts
```

## Running Tests

The agent comes with comprehensive tests covering various scenarios:

```bash
npm test src/mastra/tests/hash-detection-agent.test.ts
```

Test coverage includes:

- Training data validation
- Edge cases with mixed formats
- Case sensitivity handling
- Truncated hash detection
- ssdeep format variations
- Multi-language support
- Empty input handling

## Key Features

### 🌐 Multi-language Support

- Handles both Spanish and English technical reports
- Recognizes hash indicators in multiple languages ("hash", "huella", "checksum", etc.)

### 🔍 Context-Aware Detection

- Uses AI understanding rather than simple regex patterns
- Identifies hashes based on context and explicit labeling
- Handles various presentation formats

### 📏 Format Classification

- Automatically classifies hashes based on length and format
- Recognizes standard cryptographic hash formats
- Handles special formats like ssdeep fuzzy hashes

### ⚠️ Partial Hash Handling

- Detects truncated hashes ending with "..."
- Classifies incomplete hashes as "parcial_desconocido"
- Handles corrupted or fragmentary hash data

### 🔧 Structured Output

- Always returns valid JSON structure via Zod schema validation
- Consistent format for integration with other tools
- Type-safe output with TypeScript support

## Architecture

The Hash Detection Agent is built using:

- **Mastra Core**: Agent framework for structured AI interactions
- **OpenRouter**: AI model provider (Google Gemini 2.5 Flash)
- **Zod**: Schema validation for structured output
- **LibSQL**: Memory storage for agent state
- **Vitest**: Comprehensive testing framework

## Integration

The agent can be integrated into larger cybersecurity workflows:

1. **Incident Response**: Extract hashes from incident reports for IOC tracking
2. **Malware Analysis**: Automatically catalog hashes from analysis reports
3. **Threat Intelligence**: Process feeds and reports to build hash databases
4. **Forensics**: Extract file hashes from forensic analysis documents

## Performance Considerations

- **Throughput**: Optimized for batch processing of multiple reports
- **Accuracy**: Comprehensive test suite ensures high detection accuracy
- **Scalability**: Stateless design allows for horizontal scaling
- **Memory**: Uses in-memory storage by default for fast processing

## Troubleshooting

### Common Issues

1. **Missing API Key**: Ensure `OPENROUTER_API_KEY` is set in your environment
2. **No Hashes Detected**: Check that the input contains valid hash formats
3. **Wrong Classification**: Verify hash length matches expected format

### Debug Mode

Enable debug logging to troubleshoot detection issues:

```typescript
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({
  level: "debug",
});
```

## Contributing

To extend the Hash Detection Agent:

1. Add new hash types to the schema enum
2. Update classification rules in the agent instructions
3. Add corresponding test cases
4. Update this documentation

## License

This implementation is part of the AI Agent Hackathon project and follows the same license terms.
