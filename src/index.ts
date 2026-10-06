#!/usr/bin/env node

import { Command } from "commander";
import { defaultConfig, Config } from "./config.js";
import { DocumentationGenerator } from "./docGenerator.js";

const program = new Command();

program
  .name("codebase-documenter")
  .description("Automatically generate documentation from your codebase using small local LLMs")
  .version("0.1.0");

program
  .command("generate")
  .description("Generate documentation for a codebase")
  .option(
    "--codebase <dir>",
    "Path to the codebase directory",
    defaultConfig.codebaseDir
  )
  .option(
    "--output <dir>",
    "Output directory for generated docs",
    defaultConfig.outputDir
  )
  .option(
    "--model <id>",
    "LLM model to use",
    defaultConfig.modelId
  )
  .option(
    "--url <url>",
    "LM Studio API URL",
    defaultConfig.lmStudioUrl
  )
  .action(async (options) => {
    const config: Config = {
      ...defaultConfig,
      codebaseDir: options.codebase,
      outputDir: options.output,
      modelId: options.model,
      lmStudioUrl: options.url,
    };

    console.log("🚀 Starting documentation generation...");
    console.log(`   Codebase: ${config.codebaseDir}`);
    console.log(`   Model: ${config.modelId}`);
    console.log(`   Output: ${config.outputDir}\n`);

    const generator = new DocumentationGenerator(config);
    const startTime = Date.now();

    try {
      const results = await generator.generateForCodebase();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`\n✅ Generation complete!`);
      console.log(`   Generated ${results.length} documentation entries in ${duration}s`);
      console.log(`   Total tokens used: ${results.reduce((sum, r) => sum + r.tokensUsed, 0)}`);
    } catch (error) {
      console.error("\n❌ Generation failed:");
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);
