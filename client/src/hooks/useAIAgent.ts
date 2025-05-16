import { useState } from "react";
import { Message, ModelRequest, ModelResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useAIAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (request: ModelRequest): Promise<ModelResponse | null> => {
    setIsLoading(true);
    
    // Enhanced context handling
    // Get more context from recent messages
    const recentMessages = messages.slice(-10); // Increased context window
    
    // Find the main topic from recent substantial messages
    const mainTopic = recentMessages
        .filter(msg => msg.role === "assistant" && msg.content.length > 50)
        .map(msg => msg.content.split('\n')[0])
        .pop() || '';

    // Create a structured conversation history
    const conversationSummary = recentMessages
        .map(msg => {
            // Extract key concepts from each message
            const concepts = msg.content
                .toLowerCase()
                .match(/\b(api|interface|flowchart|diagram|architecture)\b/g) || [];
            
            return {
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                concepts: [...new Set(concepts)] // Unique concepts
            };
        });

    request.context = {
        ...request.context,
        history: recentMessages,
        mainTopic,
        conversationContext: conversationSummary,
        lastQuery: messages[messages.length - 1]?.content || ''
    };
    
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
