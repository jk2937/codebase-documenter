import { Config } from "./config.js";

export interface LLMResponse {
  content: string;
  tokens: number;
}

export class LLMClient {
  constructor(private config: Config) {}

  async generateDocumentation(
    code: string,
    docType: "function" | "module" | "class",
    context?: string
  ): Promise<LLMResponse> {
    const prompt = this.buildPrompt(code, docType, context);
    const response = await fetch(`${this.config.lmStudioUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.modelId,
        messages: [
          {
            role: "system",
            content: "You are a technical documentation expert. Generate clear, concise documentation for code.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: this.config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.choices[0].message.content;
    const tokens = data.usage.completion_tokens;

    return { content, tokens };
  }

  private buildPrompt(code: string, docType: string, context?: string): string {
    const basePrompt = `Generate documentation for this ${docType}:

\`\`\`
${code}
\`\`\`

Format the documentation as:
- Brief one-line description
- Purpose/what it does
- Parameters/Arguments (if applicable)
- Returns (if applicable)
- Example usage (if applicable)

Keep it concise and accurate.`;

    if (context) {
      return `${basePrompt}\n\nRelated code context:\n${context}`;
    }
    return basePrompt;
  }
}
