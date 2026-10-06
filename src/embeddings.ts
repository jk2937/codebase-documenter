import { Config } from "./config.js";

export interface Embedding {
  text: string;
  embedding: number[];
}

export class EmbeddingsClient {
  constructor(private config: Config) {}

  async embedText(text: string): Promise<number[]> {
    const response = await fetch(`${this.config.lmStudioUrl}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.embeddingModelId,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embeddings API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.data[0].embedding;
  }

  async findRelatedCode(queryText: string, codeSnippets: string[], topK: number = 3): Promise<string[]> {
    const queryEmbedding = await this.embedText(queryText);

    const snippetEmbeddings = await Promise.all(
      codeSnippets.map((snippet) => this.embedText(snippet))
    );

    const similarities = snippetEmbeddings.map((embedding, idx) => ({
      index: idx,
      similarity: this.cosineSimilarity(queryEmbedding, embedding),
    }));

    const topMatches = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return topMatches.map((match) => codeSnippets[match.index]);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
