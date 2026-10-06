# codebase-documenter

Automatically generate accurate, up-to-date documentation from your codebase using small local LLMs.

## Features

- **Local-first**: Uses small models running locally on your machine via LM Studio
- **Semantic understanding**: Uses embeddings to find related code for better context
- **Multi-language support**: Parses TypeScript/JavaScript with extensible architecture
- **Smart chunking**: Processes code entities (functions, classes, interfaces) individually
- **Markdown output**: Generates well-formatted documentation with source code

## Architecture

```
┌─────────────┐
│  Codebase   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Code Parser    │ Extracts functions, classes, interfaces
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Embeddings Client      │ Finds related code for context
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  LLM Client (2B Model)  │ Generates documentation
└────────┬────────────────┘
         │
         ▼
┌─────────────────┐
│  Output (Docs)  │ Markdown files per source file
└─────────────────┘
```

## Requirements

- **LM Studio** running locally on `http://localhost:1234`
- **Models installed:**
  - `qwen3-vl-2b-instruct` (for documentation generation)
  - `text-embedding-nomic-embed-text-v1.5` (for semantic search)
- **Node.js 18+**

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Usage

```bash
npm start -- generate --codebase ./src
```

### Options

```bash
npm start -- generate \
  --codebase ./src \
  --output ./docs \
  --model qwen3-vl-2b-instruct \
  --url http://localhost:1234/v1
```

### Environment Variables

```bash
LM_STUDIO_URL=http://localhost:1234/v1
MODEL_ID=qwen3-vl-2b-instruct
EMBEDDING_MODEL_ID=text-embedding-nomic-embed-text-v1.5
```

## Output

Generated documentation is saved as Markdown files in the output directory, mirroring the source structure:

```
docs/
├── api.md          # From src/api.ts
├── utils.md        # From src/utils.ts
└── types.md        # From src/types.ts
```

Each file contains:

```markdown
# Documentation for `api.ts`

## FUNCTION: fetchUser

**Location:** Lines 12-28

### Overview
[Generated documentation]

### Source
[Original code]
```

## Scaffolding Notes

This is a minimal scaffold designed to be extended:

- **Parser**: Currently handles TypeScript/JavaScript. Add more languages in `src/parser.ts`
- **LLM Prompts**: Templates in `src/llm.ts` can be customized per language/framework
- **Context**: Embedding-based context gathering can be tuned in `src/docGenerator.ts`
- **Output formats**: Extend markdown generation in `docGenerator.ts` for other formats

## Next Steps

1. Test with a sample codebase
2. Refine LLM prompts for your code style
3. Add validation/filtering for accuracy
4. Integrate with CI/CD for automatic documentation updates
5. Add support for more languages

## License

MIT
