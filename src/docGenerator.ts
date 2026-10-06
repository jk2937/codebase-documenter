import * as fs from "fs/promises";
import * as path from "path";
import { Config } from "./config.js";
import { CodeParser, CodeEntity } from "./parser.js";
import { LLMClient } from "./llm.js";
import { EmbeddingsClient } from "./embeddings.js";

export interface GenerationResult {
  file: string;
  entity: CodeEntity;
  documentation: string;
  tokensUsed: number;
}

export class DocumentationGenerator {
  private parser: CodeParser;
  private llm: LLMClient;
  private embeddings: EmbeddingsClient;

  constructor(private config: Config) {
    this.parser = new CodeParser();
    this.llm = new LLMClient(config);
    this.embeddings = new EmbeddingsClient(config);
  }

  async generateForCodebase(): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];
    const files = await this.parser.findAllFiles(this.config.codebaseDir);

    console.log(`Found ${files.length} files to process...`);

    for (const file of files) {
      const entities = await this.parser.parseFile(file);
      console.log(`Processing ${file} (${entities.length} entities)...`);

      for (const entity of entities) {
        try {
          const result = await this.generateForEntity(file, entity, entities);
          results.push(result);
          console.log(`  ✓ Documented ${entity.type} "${entity.name}"`);
        } catch (error) {
          console.error(`  ✗ Failed to document ${entity.name}:`, error);
        }
      }
    }

    await this.saveResults(results);
    return results;
  }

  private async generateForEntity(
    file: string,
    entity: CodeEntity,
    allEntities: CodeEntity[]
  ): Promise<GenerationResult> {
    // Find related code for context
    const otherEntities = allEntities
      .filter((e) => e.name !== entity.name)
      .map((e) => e.code);

    let context = "";
    if (otherEntities.length > 0) {
      try {
        const related = await this.embeddings.findRelatedCode(entity.code, otherEntities, 2);
        context = related.join("\n\n---\n\n");
      } catch {
        context = "";
      }
    }

    // Generate documentation
    const { content, tokens } = await this.llm.generateDocumentation(
      entity.code,
      entity.type as "function" | "module" | "class",
      context
    );

    return {
      file,
      entity,
      documentation: content,
      tokensUsed: tokens,
    };
  }

  private async saveResults(results: GenerationResult[]): Promise<void> {
    await fs.mkdir(this.config.outputDir, { recursive: true });

    // Group by file
    const byFile = new Map<string, GenerationResult[]>();
    for (const result of results) {
      if (!byFile.has(result.file)) {
        byFile.set(result.file, []);
      }
      byFile.get(result.file)!.push(result);
    }

    // Generate markdown files
    for (const [file, fileResults] of byFile) {
      const relativePath = path.relative(this.config.codebaseDir, file);
      const docPath = path.join(
        this.config.outputDir,
        relativePath.replace(/\.(ts|tsx|js)$/, ".md")
      );

      await fs.mkdir(path.dirname(docPath), { recursive: true });

      const markdown = this.generateMarkdown(file, fileResults);
      await fs.writeFile(docPath, markdown);
      console.log(`\nGenerated ${docPath}`);
    }
  }

  private generateMarkdown(file: string, results: GenerationResult[]): string {
    const relativePath = path.relative(this.config.codebaseDir, file);
    let md = `# Documentation for \`${relativePath}\`\n\n`;

    for (const result of results) {
      md += `## ${result.entity.type.toUpperCase()}: ${result.entity.name}\n\n`;
      md += `**Location:** Lines ${result.entity.startLine + 1}-${result.entity.endLine + 1}\n\n`;
      md += `### Overview\n${result.documentation}\n\n`;
      md += `### Source\n\`\`\`\n${result.entity.code}\n\`\`\`\n\n`;
    }

    return md;
  }
}
