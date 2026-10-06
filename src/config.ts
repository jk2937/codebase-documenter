export interface Config {
  lmStudioUrl: string;
  modelId: string;
  embeddingModelId: string;
  outputDir: string;
  codebaseDir: string;
  maxContextLength: number;
  temperature: number;
}

export const defaultConfig: Config = {
  lmStudioUrl: process.env.LM_STUDIO_URL || "http://localhost:1234/v1",
  modelId: process.env.MODEL_ID || "qwen3-vl-2b-instruct",
  embeddingModelId: process.env.EMBEDDING_MODEL_ID || "text-embedding-nomic-embed-text-v1.5",
  outputDir: "./docs",
  codebaseDir: "./src",
  maxContextLength: 4096,
  temperature: 0.3,
};
