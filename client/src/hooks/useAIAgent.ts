import { useState } from "react";
import { Message, ModelRequest, ModelResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useAIAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (request: ModelRequest): Promise<ModelResponse | null> => {
    setIsLoading(true);
    
    try {
      // Add user message to state
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: request.prompt,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Send request to backend
      const response = await apiRequest("POST", "/api/llm", request);
      const data: ModelResponse = await response.json();
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text,
        timestamp: new Date(),
        modelUsed: data.modelUsed,
        tokens: data.tokensUsed,
        latency: data.latencyMs,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response from AI'}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
