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
  
  const [inputValue, setInputValue] = useState("");
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
    setInputValue("");

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
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-3xl flex flex-col items-center">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Welcome to Merlin</h1>
          
          {messages.length > 1 ? (
            <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 overflow-y-auto max-h-[60vh]">
              {messages.map((message) => (
                <div key={message.id} className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'assistant' 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                        : message.role === 'system' 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    }`}>
                      {message.role === 'assistant' ? 'AI' : message.role === 'system' ? 'S' : 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          
          <div className="w-full relative">
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
              <textarea
                placeholder="Type your prompt here"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(inputValue);
                  }
                }}
                className="w-full p-4 pr-12 border-0 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none resize-none min-h-[60px]"
                rows={2}
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                  <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center">
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="mr-2 text-xs bg-transparent text-gray-500 border-none focus:outline-none"
                  >
                    <option value="auto">Gemini 2.0 Flash</option>
                    <option value="primary">GPT-4o</option>
                    <option value="code">Claude (Code)</option>
                  </select>
                  
                  <button
                    onClick={() => sendMessage(inputValue)}
                    disabled={isLoading || !inputValue.trim()}
                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6 w-full">
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="w-5 h-5 flex items-center justify-center">🔍</span>
              <span>Get deep research insights</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="w-5 h-5 flex items-center justify-center">🌐</span>
              <span>Research with web</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="w-5 h-5 flex items-center justify-center">💬</span>
              <span>Chat with documents</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="w-5 h-5 flex items-center justify-center">📊</span>
              <span>Make charts and diagrams</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="w-5 h-5 flex items-center justify-center">📈</span>
              <span>Analyze data</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span className="w-5 h-5 flex items-center justify-center">🖼️</span>
              <span>Generate image</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
