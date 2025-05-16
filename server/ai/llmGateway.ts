// llmGateway.ts
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
    private anthropic: Anthropic;
    private cache: AICache;
    private gemini: any; // Add proper type when implementing
    private model: any; // Store the generative model instance
    private currentProvider: ModelProvider = "gemini";
    private availableProviders: ModelProvider[] = [];

    private static async initialize(): Promise<LLMGateway> {
        const gateway = new LLMGateway();
        console.log("Initializing LLMGateway...");

        // Initialize Gemini client if API key is available
        const geminiKey = process.env.GEMINI_API_KEY;

        if (!geminiKey) {
            console.error("GEMINI_API_KEY is missing!");
            throw new Error("GEMINI_API_KEY is required but not found in environment variables");
        }

        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(geminiKey);
            gateway.gemini = genAI;
            //MODIFIED: Use a specific version of the model
            gateway.model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro-002" });

            console.log("Gemini model initialized successfully:", gateway.model);
            gateway.availableProviders = ['gemini'];
            gateway.currentProvider = 'gemini';
            console.log("Gemini API key detected and initialized successfully");
        } catch (error) {
            console.error("Failed to initialize Gemini:", error);
            throw new Error("Failed to initialize Gemini client");
        }
        console.log("LLMGateway initialization complete");
        return gateway;
    }

    private constructor() {
        this.cache = new AICache();
        this.availableProviders = [];
        this.currentProvider = 'gemini';
    }

    public static async create(): Promise<LLMGateway> {
        const gateway = await LLMGateway.initialize();
        console.log("Available providers:", gateway.availableProviders);
        return gateway;
    }

    private async tryNextProvider() {
        if (this.availableProviders.length === 0) {
            throw new Error("No available AI providers");
        }

        const currentIndex = this.availableProviders.indexOf(this.currentProvider);
        const nextIndex = (currentIndex + 1) % this.availableProviders.length;
        this.currentProvider = this.availableProviders[nextIndex];
        console.log(`Switching to provider: \${this.currentProvider}`);
        return this.currentProvider;
    }

    /**
     * Routes the request to the appropriate model based on request type
     */
    async routeRequest(request: ModelRequest): Promise<ModelResponse> {
        console.log(`Routing request of type \${request.modelType}:`, request.prompt.slice(0, 50) + "...");
        console.log("Current value of this.model:", this.model);

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
            // Determine provider based on request or settings
            // By default, we'll use Gemini, but this could be configured by the user
            const provider: ModelProvider = request.context?.provider as ModelProvider || this.currentProvider;
            console.log(`Using provider: \${provider}`);

            // Route to appropriate model based on type and provider
            if (provider === "gemini") {
                try {
                    if (!this.model) {
                        console.error("Gemini model is undefined or null!");
                        throw new Error("Gemini model not initialized");
                    }
                    // Build conversation history
                    const history = request.context?.history || [];
                    const messages = history.map(msg => ({ text: msg.content }));
                    
                    // Enhance prompt based on context and request type
                    let enhancedPrompt = request.prompt;
                    if (request.prompt.toLowerCase().includes('flowchart') || 
                        request.prompt.toLowerCase().includes('diagram')) {
                        
                        // Get last topic discussed from history
                        const previousMessages = history
                            .map(msg => msg.content)
                            .join('\n');
                            
                        const lastTopic = previousMessages
                            .split('\n')
                            .filter(line => !line.toLowerCase().includes('flowchart') && 
                                          !line.toLowerCase().includes('diagram'))
                            .pop() || '';

                        // Create context-aware prompt
                        enhancedPrompt = `Based on our previous discussion about "${lastTopic}", create a Mermaid diagram that illustrates this concept. For context, here was our conversation:\n\n${previousMessages}\n\nCreate a detailed Mermaid flowchart diagram about this topic using this format:
                        \`\`\`mermaid
                        flowchart TD
                            // Create a detailed flowchart about the previously discussed topic
                        \`\`\``;
                    }
                    
                    messages.push({ text: enhancedPrompt });
                    const result = await this.model.generateContent(messages);
                    const geminiResponse = await result.response;
                    return {
                        text: geminiResponse.text(),
                        modelUsed: "gemini-pro",
                        tokensUsed: 0, // Gemini doesn't provide token count
                        latencyMs: 0
                    };
                } catch (error) {
                    console.error("Error calling Gemini:", error);
                    return {
                        text: "I apologize, but I encountered an error processing your request with Gemini. Please try again later.",
                        modelUsed: "error",
                        tokensUsed: 0,
                        latencyMs: Date.now() - startTime
                    };
                }
            } else if (provider === "anthropic") {
                switch (request.modelType) {
                    case "code":
                        response = await this.callAnthropicCodeModel(request);
                        break;
                    default:
                        response = await this.callAnthropicPrimaryModel(request);
                }
            } else {
                // Default to OpenAI
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
            }

            // Calculate latency
            const latencyMs = Date.now() - startTime;
            response.latencyMs = latencyMs;

            // Cache the response
            this.cache.set(cacheKey, response);

            return response;
        } catch (error) {
            console.error(`Error in \${request.modelType} model:`, error);

            // Try other providers if current one fails
            let attempts = 3; // Try all three providers
            while (attempts > 0) {
                const nextProvider = await this.tryNextProvider();
                console.log(`Attempting with next provider: \${nextProvider}`);

                try {
                    switch (nextProvider) {
                        case "anthropic":
                            response = await this.callAnthropicPrimaryModel(request);
                            break;
                        case "gemini":
                            // Implement Gemini call here
                            throw new Error("Gemini implementation pending");
                        default:
                            response = await this.callPrimaryModel(request);
                    }

                    const latencyMs = Date.now() - startTime;
                    response.latencyMs = latencyMs;
                    return response;
                } catch (fallbackError) {
                    console.error(`Failed with provider \${nextProvider}:`, fallbackError);
                    attempts--;
                }
            }

            // Return graceful error instead of throwing
            return {
                text: "I apologize, but I encountered an error processing your request. This could be due to API limits, connectivity issues, or other technical problems. Please try again or try using a different model provider.",
                modelUsed: "error",
                tokensUsed: 0,
                latencyMs: Date.now() - startTime
            };
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
        if (!this.openai) {
            return {
                text: "OpenAI API is not configured. Please check your API key configuration.",
                modelUsed: "error",
                tokensUsed: 0,
                latencyMs: 0
            };
        }

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
                userPrompt = `Code context:\n\`\`\`\n\${request.context.code}\n\`\`\`\n\nRequest: \${request.prompt}`;
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
            throw new Error(`Embedding generation error: \${error instanceof Error ? error.message : "Unknown error"}`);
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
     * Calls the Anthropic Claude model for primary tasks
     */
    private async callAnthropicPrimaryModel(request: ModelRequest): Promise<ModelResponse> {
        try {
            console.log("Calling Anthropic Claude model for primary task");

            // Build system prompt to handle various questions
            const systemPrompt = "You are Claude, a versatile AI assistant that can help with a wide range of tasks including answering questions, explaining concepts, analyzing text, and providing thoughtful responses. Be helpful, accurate, and concise.";

            const completion = await this.anthropic.messages.create({
                model: ANTHROPIC_PRIMARY_MODEL,
                max_tokens: request.maxTokens,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: request.prompt
                    }
                ],
                temperature: request.temperature,
            });

            // Extract the response text properly handling Anthropic's response format
            let responseText = "I couldn't generate a response";

            // Check if we have content and it's a text block
            if (completion.content &&
                completion.content.length > 0 &&
                completion.content[0].type === 'text') {
                responseText = completion.content[0].text;
            }

            return {
                text: responseText,
                modelUsed: ANTHROPIC_PRIMARY_MODEL,
                tokensUsed: completion.usage?.output_tokens || 0,
                latencyMs: 0 // Will be set by the caller
            };
        } catch (error) {
            console.error("Error calling Anthropic Claude model:", error);

            // Create a more helpful error response
            return {
                text: "I apologize, but I encountered an error while processing your request with the Claude model. This could be due to API limits, connectivity issues, or other technical problems. Please try again or switch to a different model.",
                modelUsed: "error",
                tokensUsed: 0,
                latencyMs: 0
            };
        }
    }

    /**
     * Calls the Anthropic Claude model for code-related tasks
     */
    private async callAnthropicCodeModel(request: ModelRequest): Promise<ModelResponse> {
        try {
            console.log("Calling Anthropic Claude model for code task");

            // Build system prompt for code-related tasks
            let systemPrompt = "You are Claude, an AI assistant specialized in programming and software development. ";

            if (request.context?.taskType === "code_completion") {
                systemPrompt += "Complete the code snippet with the most logical continuation. Focus on correctness, efficiency, and best practices.";
            } else if (request.context?.taskType === "code_generation") {
                systemPrompt += "Generate well-structured, efficient code based on the requirements. Include helpful comments to explain key parts.";
            } else if (request.context?.taskType === "code_explanation") {
                systemPrompt += "Explain the provided code clearly, focusing on its purpose, algorithm, and important concepts. Break down complex parts into simple explanations.";
            } else {
                systemPrompt += "Provide expert programming assistance based on the user's request.";
            }

            // Add the code context if provided
            let userPrompt = request.prompt;
            if (request.context?.code) {
                userPrompt = `Code context:\n\`\`\`\n\${request.context.code}\n\`\`\`\n\nRequest: \${request.prompt}`;
            }

            const completion = await this.anthropic.messages.create({
                model: ANTHROPIC_CODE_MODEL,
                system: systemPrompt,
                max_tokens: request.maxTokens,
                messages: [
                    {
                        role: "user",
                        content: userPrompt
                    }
                ],
                temperature: request.temperature,
            });

            // Extract the response text properly handling Anthropic's response format
            let responseText = "I couldn't generate code for that request";

            // Check if we have content and it's a text block
            if (completion.content &&
                completion.content.length > 0 &&
                completion.content[0].type === 'text') {
                responseText = completion.content[0].text;
            }

            return {
                text: responseText,
                modelUsed: ANTHROPIC_CODE_MODEL,
                tokensUsed: completion.usage?.output_tokens || 0,
                latencyMs: 0 // Will be set by the caller
            };
        } catch (error) {
            console.error("Error calling Anthropic Claude code model:", error);

            // Create a more helpful error response
            return {
                text: "I apologize, but I encountered an error while processing your code request with the Claude model. This could be due to API limits, connectivity issues, or other technical problems. Please try again or switch to a different model.",
                modelUsed: "error",
                tokensUsed: 0,
                latencyMs: 0
            };
        }
    }

    /**
     * Gets the status of all connected models
     */
    async getStatus(): Promise<{ primary: boolean; code: boolean; embeddings: boolean; anthropic: boolean }> {
        const status = {
            primary: false,
            code: false,
            embeddings: false,
            anthropic: false
        };

        // Check OpenAI connection
        const hasOpenAIKey = !!this.openai.apiKey && this.openai.apiKey !== "sk-dummy-key-for-dev";
        status.primary = hasOpenAIKey;
        status.code = hasOpenAIKey;
        status.embeddings = hasOpenAIKey;

        // Check Anthropic connection
        const hasAnthropicKey = !!this.anthropic.apiKey && this.anthropic.apiKey !== "sk-ant-dummy-key-for-dev";
        status.anthropic = hasAnthropicKey;

        return status;
    }
}