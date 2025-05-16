import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ControlPanel from "@/components/ai/ControlPanel";
import EditorSection from "@/components/ai/EditorSection";
import AIInteractionPanel from "@/components/ai/AIInteractionPanel";
import { Message, TaskType } from "@shared/schema";
import { EditorFile, EditorLanguage } from "@/types";

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string>("auto");
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType>("code_generation");
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content: "Hello! I'm your AI assistant. I can help you with:\n- Code generation and completion\n- Code explanation and debugging\n- Finding similar code examples\n- Answering programming questions\n\nWhat would you like help with today?",
      timestamp: new Date(),
      modelUsed: "GPT-4",
    },
  ]);

  const [files, setFiles] = useState<EditorFile[]>([
    {
      name: "main.py",
      language: EditorLanguage.PYTHON,
      content: 
`import os
import json
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
import httpx
import logging
from typing import Dict, List, Optional, Union

# Initialize FastAPI app
app = FastAPI(title="LLM Gateway API")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("llm_gateway")

class LLMRequest(BaseModel):
    prompt: str
    model_type: str = "primary"  # primary, code, embeddings
    context: Optional[Dict] = None
    max_tokens: int = 1000
    temperature: float = 0.7

class LLMResponse(BaseModel):
    text: str
    model_used: str
    tokens_used: int
    latency_ms: float

# LLM Gateway class
class LLMGateway:
    def __init__(self):
        self.primary_llm_endpoint = os.getenv("PRIMARY_LLM_ENDPOINT")
        self.code_llm_endpoint = os.getenv("CODE_LLM_ENDPOINT")
        self.embeddings_endpoint = os.getenv("EMBEDDINGS_ENDPOINT")
        self.api_key = os.getenv("OPENAI_API_KEY")
        
        # Simple in-memory cache
        self.cache = {}
        
    async def route_request(self, request: LLMRequest) -> LLMResponse:
        # Check cache for identical requests
        cache_key = f"{request.model_type}:{request.prompt}:{request.max_tokens}:{request.temperature}"
        if cache_key in self.cache:
            logger.info(f"Cache hit for request: {cache_key[:30]}...")
            return self.cache[cache_key]
            
        # Route to appropriate model based on request type
        if request.model_type == "code":
            response = await self._call_code_model(request)
        elif request.model_type == "embeddings":
            response = await self._call_embeddings_model(request)
        else:  # Default to primary
            response = await self._call_primary_model(request)
            
        # Cache the response
        self.cache[cache_key] = response
        return response
    
    async def _call_primary_model(self, request: LLMRequest) -> LLMResponse:
        # Implementation for calling primary LLM (GPT-4, etc.)
        pass
        
    async def _call_code_model(self, request: LLMRequest) -> LLMResponse:
        # Implementation for calling code-specialized LLM
        pass
        
    async def _call_embeddings_model(self, request: LLMRequest) -> LLMResponse:
        # Implementation for generating embeddings
        pass

# Initialize gateway
gateway = LLMGateway()`,
      active: true,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Make API call to backend
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: content,
          modelType: selectedModel === "auto" ? 
            (selectedTaskType === "code_completion" || selectedTaskType === "code_generation" ? "code" : "primary") 
            : selectedModel,
          context: {
            code: files.find(f => f.active)?.content || "",
            taskType: selectedTaskType,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.text,
        timestamp: new Date(),
        modelUsed: data.modelUsed,
        tokens: data.tokensUsed,
        latency: data.latencyMs,
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "system",
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response from AI'}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900">
        <ControlPanel 
          selectedModel={selectedModel} 
          onModelChange={setSelectedModel}
          selectedTaskType={selectedTaskType}
          onTaskTypeChange={setSelectedTaskType}
        />
        
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <EditorSection 
            files={files}
            setFiles={setFiles}
          />
          
          <AIInteractionPanel 
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            selectedModel={selectedModel}
          />
        </div>
      </div>
    </MainLayout>
  );
}
