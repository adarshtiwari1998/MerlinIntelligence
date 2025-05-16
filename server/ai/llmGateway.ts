import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { ModelRequest, ModelResponse } from "@shared/schema";
import { AICache } from "./cache";
import { 
  PRIMARY_MODEL, 
  CODE_MODEL, 
  EMBEDDINGS_MODEL, 
  ANTHROPIC_PRIMARY_MODEL,
  ANTHROPIC_CODE_MODEL,
  ModelProvider,
  computeHash 
} from "./models";

export class LLMGateway {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private cache: AICache;
  
  constructor() {
    // Initialize OpenAI client with API key from environment variables
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-dev" 
    });
    
    // Initialize Anthropic client with API key from environment variables
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "sk-ant-dummy-key-for-dev"
    });
    
    // Initialize cache for responses
    this.cache = new AICache();
    
    console.log("LLM Gateway initialized with OpenAI and Anthropic support");
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
      console.log("Calling OpenAI primary model with API key:", this.openai.apiKey ? "API key is set" : "No API key");
      
      // Build a robust system prompt to handle various user questions
      const systemPrompt = "You are a versatile AI assistant that can help with coding, text analysis, explanations, and general questions. Respond in a helpful, accurate, and concise manner. For code, include explanations of what the code does.";
      
      const completion = await this.openai.chat.completions.create({
        model: PRIMARY_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      });
      
      // For safety, check if we have a valid response
      const responseText = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response at this time.";
      
      return {
        text: responseText,
        modelUsed: PRIMARY_MODEL,
        tokensUsed: completion.usage?.total_tokens || 0,
        latencyMs: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error("Error calling primary model:", error);
      
      // Create a more helpful error response
      return {
        text: "I apologize, but I encountered an error while processing your request. This could be due to API limits, connection issues, or other technical problems. Please try again with a different question or check if the OpenAI API key is properly configured.",
        modelUsed: "error",
        tokensUsed: 0,
        latencyMs: 0
      };
    }
  }
  
  /**
   * Calls the code-specialized LLM for code completion, generation, etc.
   */
  private async callCodeModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      // For code-related tasks, we'll add specific instructions to the prompt
      let systemPrompt = "You are a code-specialized AI assistant that excels at programming tasks. ";
      
      if (request.context?.taskType === "code_completion") {
        systemPrompt += "Complete the code snippet with the most logical continuation. Focus on correctness and best practices. Make sure to handle edge cases and provide efficient solutions.";
      } else if (request.context?.taskType === "code_generation") {
        systemPrompt += "Generate well-structured, efficient code based on the requirements. Include helpful comments to explain key parts and make the code easily understandable.";
      } else if (request.context?.taskType === "code_explanation") {
        systemPrompt += "Explain the provided code clearly, focusing on its purpose, algorithm, and any important concepts. Break down complex parts into simple explanations.";
      } else {
        systemPrompt += "Provide helpful coding assistance based on the user's request. Focus on delivering practical, working solutions with explanations.";
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
      
      // For safety, check if we have a valid response
      const responseText = completion.choices[0].message.content || "I'm sorry, I couldn't generate code for that request.";
      
      return {
        text: responseText,
        modelUsed: CODE_MODEL,
        tokensUsed: completion.usage?.total_tokens || 0,
        latencyMs: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error("Error calling code model:", error);
      
      // Create a more helpful error response
      return {
        text: "I apologize, but I encountered an error while processing your code request. Please try simplifying your request or check if the OpenAI API key is properly configured. For code generation, being specific about the programming language and functionality you need can help.",
        modelUsed: "error",
        tokensUsed: 0,
        latencyMs: 0
      };
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
      
      // Create a more helpful error response instead of throwing
      return {
        text: "I apologize, but I encountered an error while generating embeddings for your text. This feature is used for semantic search and similarity calculations. Please try again with different text or check if the OpenAI API key is properly configured.",
        modelUsed: "error",
        tokensUsed: 0,
        latencyMs: 0
      };
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
