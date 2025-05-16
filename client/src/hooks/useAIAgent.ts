import { useState } from "react";
import { Message, ModelRequest, ModelResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useAIAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (request: ModelRequest): Promise<ModelResponse | null> => {
    setIsLoading(true);
    
    // Enhanced context handling with better follow-up detection
    const recentMessages = messages.slice(-10);
    
    // Extract main topic and key concepts
    const mainTopic = recentMessages
        .filter(msg => msg.role === "assistant" && msg.content.length > 50)
        .map(msg => msg.content.split('\n')[0])
        .pop() || '';

    // Get the last substantial discussion
    const lastDiscussion = recentMessages
        .filter(msg => msg.role === "assistant" && msg.content.length > 100)
        .pop()?.content || '';

    // Detect if current request is a follow-up
    const isFollowUp = request.prompt.toLowerCase().match(/\b(flowchart|diagram|explain|how|why|it|this|that)\b/g) || 
                      request.prompt.length < 20;

    // Create enhanced conversation context
    const conversationContext = recentMessages.map(msg => {
        // Extract key concepts and relationships
        const concepts = msg.content
            .toLowerCase()
            .match(/\b(api|interface|flowchart|diagram|architecture|process|system|application)\b/g) || [];
            
        // Extract potential topics
        const topics = msg.content
            .split('\n')
            .filter(line => line.length > 50)
            .map(line => line.split('.')[0])
            .filter(Boolean);
            
        return {
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            concepts: [...new Set(concepts)],
            topics: [...new Set(topics)]
        };
    });

    // Build rich context for better follow-up handling
    const contextualHistory = {
        mainTopic,
        lastDiscussion,
        isFollowUp,
        recentTopics: conversationContext
            .flatMap(ctx => ctx.topics)
            .slice(-3),
        conceptChain: conversationContext
            .flatMap(ctx => ctx.concepts)
            .filter(Boolean)
    };

    request.context = {
        ...request.context,
        history: recentMessages,
        contextualHistory,
        conversationContext,
        lastQuery: messages[messages.length - 1]?.content || '',
        requiresFlowchart: request.prompt.toLowerCase().includes('flowchart') ||
                          (contextualHistory.isFollowUp && lastDiscussion.length > 0)
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
