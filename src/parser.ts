import * as fs from "fs/promises";
import * as path from "path";

export interface CodeEntity {
  type: "function" | "class" | "interface" | "type";
  name: string;
  code: string;
  startLine: number;
  endLine: number;
}

export class CodeParser {
  async parseFile(filePath: string): Promise<CodeEntity[]> {
    const content = await fs.readFile(filePath, "utf-8");
    return this.parseContent(content);
  }

  parseContent(content: string): CodeEntity[] {
    const entities: CodeEntity[] = [];
    const lines = content.split("\n");

    let currentEntity: Partial<CodeEntity> | null = null;
    let entityStartLine = 0;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect function/class/interface declarations
      if (!currentEntity) {
        if (trimmed.startsWith("export function ") || trimmed.startsWith("function ")) {
          currentEntity = {
            type: "function",
            name: this.extractName(line),
            startLine: i,
          };
          entityStartLine = i;
        } else if (trimmed.startsWith("export class ") || trimmed.startsWith("class ")) {
          currentEntity = {
            type: "class",
            name: this.extractName(line),
            startLine: i,
          };
          entityStartLine = i;
        } else if (trimmed.startsWith("export interface ") || trimmed.startsWith("interface ")) {
          currentEntity = {
            type: "interface",
            name: this.extractName(line),
            startLine: i,
          };
          entityStartLine = i;
        } else if (trimmed.startsWith("export type ") || trimmed.startsWith("type ")) {
          currentEntity = {
            type: "type",
            name: this.extractName(line),
            startLine: i,
          };
          entityStartLine = i;
        }
      }

      // Track braces to find entity end
      if (currentEntity) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0 && line.includes("}")) {
          currentEntity.code = lines.slice(entityStartLine, i + 1).join("\n");
          currentEntity.endLine = i;
          entities.push(currentEntity as CodeEntity);
          currentEntity = null;
        }
      }
    }

    return entities;
  }

  private extractName(line: string): string {
    const match = line.match(/(?:function|class|interface|type)\s+(\w+)/);
    return match ? match[1] : "unknown";
  }

  async findAllFiles(dir: string, extensions: string[] = [".ts", ".tsx", ".js"]): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        files.push(...await this.findAllFiles(fullPath, extensions));
      } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }

    return files;
  }
}
