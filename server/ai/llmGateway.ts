import OpenAI from "openai";
import { ModelRequest, ModelResponse } from "@shared/schema";
import { AICache } from "./cache";
import { PRIMARY_MODEL, CODE_MODEL, EMBEDDINGS_MODEL, computeHash } from "./models";

export class LLMGateway {
  private openai: OpenAI;
  private cache: AICache;
  
  constructor() {
    // Initialize OpenAI client with API key from environment variables
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-dev" 
    });
    
    // Initialize cache for responses
    this.cache = new AICache();
  }
  
  /**
   * Routes the request to the appropriate model based on request type
   */
  async routeRequest(request: ModelRequest): Promise<ModelResponse> {
    console.log(`Routing request of type ${request.modelType}:`, request.prompt.slice(0, 50) + "...");
    
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = this.cache.get(cacheKey);
    
    if (cachedResponse) {
      console.log("Cache hit for request!");
      return cachedResponse;
    }
    
    // Start measuring response time
    const startTime = Date.now();
    let response: ModelResponse;
    
    try {
      // Route to appropriate model
      switch (request.modelType) {
        case "code":
          response = await this.callCodeModel(request);
          break;
        case "embeddings":
          response = await this.callEmbeddingsModel(request);
          break;
        default:
          response = await this.callPrimaryModel(request);
      }
      
      // Calculate latency
      const latencyMs = Date.now() - startTime;
      response.latencyMs = latencyMs;
      
      // Cache the response
      this.cache.set(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error(`Error in ${request.modelType} model:`, error);
      
      // If code model fails, try falling back to primary
      if (request.modelType === "code") {
        console.log("Falling back to primary model");
        return this.callPrimaryModel(request);
      }
      
      throw error;
    }
  }
  
  /**
   * Calls the primary LLM (GPT-4o, etc.)
   */
  private async callPrimaryModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: PRIMARY_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant specialized in coding and software development. Provide clear, accurate, and efficient solutions."
          },
          {
            role: "user",
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      });
      
      return {
        text: completion.choices[0].message.content || "No response generated",
        modelUsed: PRIMARY_MODEL,
        tokensUsed: completion.usage?.total_tokens || 0,
        latencyMs: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error("Error calling primary model:", error);
      throw new Error(`Primary model error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  /**
   * Calls the code-specialized LLM for code completion, generation, etc.
   */
  private async callCodeModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      // For code-related tasks, we'll add specific instructions to the prompt
      let systemPrompt = "You are a code-specialized AI assistant. ";
      
      if (request.context?.taskType === "code_completion") {
        systemPrompt += "Complete the code snippet with the most logical continuation. Focus on correctness and best practices.";
      } else if (request.context?.taskType === "code_generation") {
        systemPrompt += "Generate well-structured, efficient code based on the requirements. Include comments to explain key parts.";
      } else if (request.context?.taskType === "code_explanation") {
        systemPrompt += "Explain the provided code clearly, focusing on its purpose, algorithm, and any important concepts.";
      }
      
      // Add the code context if provided
      let userPrompt = request.prompt;
      if (request.context?.code) {
        userPrompt = `Code context:\n\`\`\`\n${request.context.code}\n\`\`\`\n\nRequest: ${request.prompt}`;
      }
      
      const completion = await this.openai.chat.completions.create({
        model: CODE_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      });
      
      return {
        text: completion.choices[0].message.content || "No response generated",
        modelUsed: CODE_MODEL,
        tokensUsed: completion.usage?.total_tokens || 0,
        latencyMs: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error("Error calling code model:", error);
      throw new Error(`Code model error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  /**
   * Uses the embeddings model to generate vector representations
   */
  private async callEmbeddingsModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      // For embeddings, we don't need an actual completion, just the embedding itself
      // We'll return a message indicating that embeddings were generated successfully
      
      const embedding = await this.generateEmbedding(request.prompt);
      
      return {
        text: JSON.stringify({ 
          message: "Embeddings generated successfully", 
          dimensions: embedding.length
        }),
        modelUsed: EMBEDDINGS_MODEL,
        tokensUsed: request.prompt.split(/\s+/).length, // Rough estimate
        latencyMs: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error("Error calling embeddings model:", error);
      throw new Error(`Embeddings model error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  /**
   * Generates embeddings for the input text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: EMBEDDINGS_MODEL,
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error(`Embedding generation error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  /**
   * Generates a cache key for the request
   */
  private generateCacheKey(request: ModelRequest): string {
    return computeHash(JSON.stringify({
      modelType: request.modelType,
      prompt: request.prompt,
      maxTokens: request.maxTokens,
      temperature: request.temperature
    }));
  }
  
  /**
   * Gets the status of all connected models
   */
  async getStatus(): Promise<{ primary: boolean; code: boolean; embeddings: boolean }> {
    // In a real implementation, you would check the actual status of each model
    // Here we'll simulate by just checking if we have an API key
    const hasApiKey = !!this.openai.apiKey && this.openai.apiKey !== "sk-dummy-key-for-dev";
    
    return {
      primary: hasApiKey,
      code: hasApiKey,
      embeddings: hasApiKey
    };
  }
}
