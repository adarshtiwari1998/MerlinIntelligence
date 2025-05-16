// model.ts
import crypto from "crypto";

// OpenAI model names
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export const PRIMARY_MODEL = "gpt-4o";
export const CODE_MODEL = "gpt-4o"; // In a production environment, this could be a specialized code model
export const EMBEDDINGS_MODEL = "text-embedding-3-small";

// Anthropic model names
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
export const ANTHROPIC_PRIMARY_MODEL = "claude-3-7-sonnet-20250219";
export const ANTHROPIC_CODE_MODEL = "claude-3-7-sonnet-20250219";

// Model providers
export type ModelProvider = "openai" | "anthropic";

// Compute an MD5 hash for caching
export function computeHash(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

// Determine model type based on task
export function determineModelType(taskType: string): "primary" | "code" | "embeddings" {
  if (taskType.startsWith("code_")) {
    return "code";
  } else if (taskType === "embedding" || taskType === "similarity") {
    return "embeddings";
  }
  return "primary";
}

// Format prompt based on task type
export function formatPrompt(taskType: string, rawPrompt: string, context?: any): string {
  let formattedPrompt = rawPrompt;

  switch (taskType) {
    case "code_completion":
      formattedPrompt = `Complete the following code:\n\n\${context?.code || ""}\n\n\${rawPrompt}`;
      break;
    case "code_generation":
      formattedPrompt = `Generate code for the following requirement:\n\n\${rawPrompt}`;
      break;
    case "code_explanation":
      formattedPrompt = `Explain the following code:\n\n\${context?.code || ""}\n\n\${rawPrompt}`;
      break;
    default:
      // No special formatting needed
      break;
  }

  return formattedPrompt;
}

// Get system prompt based on model type
export function getSystemPrompt(modelType: "primary" | "code" | "embeddings", taskType?: string): string {
  switch (modelType) {
    case "primary":
      return "You are a helpful, accurate, and concise AI assistant. Provide information, answer questions, and assist with various tasks.";
    case "code":
      return "You are a code-specialized AI assistant. Provide clear, efficient, and well-documented code solutions. Follow best practices and explain your reasoning.";
    case "embeddings":
      return "Generate semantic representations of the input text for vector operations.";
    default:
      return "You are a helpful AI assistant.";
  }
}