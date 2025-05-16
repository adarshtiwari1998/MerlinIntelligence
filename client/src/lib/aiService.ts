import { ModelRequest, ModelResponse } from "@shared/schema";
import { apiRequest } from "./queryClient";

export async function sendAIRequest(request: ModelRequest): Promise<ModelResponse> {
  try {
    const response = await apiRequest("POST", "/api/llm", request);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error sending AI request:", error);
    return {
      text: `Error: Failed to connect to the AI service. Please check your connection and try again. ${error instanceof Error ? error.message : ''}`,
      modelUsed: "error",
      tokensUsed: 0,
      latencyMs: 0
    };
  }
}

export async function getModelStatus(): Promise<{
  primary: boolean;
  code: boolean;
  embeddings: boolean;
}> {
  try {
    const response = await apiRequest("GET", "/api/llm/status", undefined);
    return await response.json();
  } catch (error) {
    console.error("Error getting model status:", error);
    return {
      primary: false,
      code: false,
      embeddings: false,
    };
  }
}

export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await apiRequest("POST", "/api/embeddings", { text });
    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

export async function similaritySearch(
  embedding: number[],
  limit: number = 5
): Promise<{ id: string; text: string; similarity: number }[]> {
  try {
    const response = await apiRequest("POST", "/api/similarity", {
      embedding,
      limit,
    });
    return await response.json();
  } catch (error) {
    console.error("Error performing similarity search:", error);
    throw error;
  }
}
