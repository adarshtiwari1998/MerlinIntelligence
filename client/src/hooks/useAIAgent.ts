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
      
      // Create placeholder for AI response
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };
      
      setMessages(prev => [...prev, userMessage, aiMessage]);
      
      // Stream response
      const response = await fetch("/api/llm/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: msg.content + chunk }
              : msg
          ));
        }
      }
      
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
