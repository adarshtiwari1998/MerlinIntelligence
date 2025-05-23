import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Trash2, Send, Paperclip, SmilePlus } from "lucide-react";
import Message from "./Message";
import { Message as MessageType } from "@shared/schema";

interface AIInteractionPanelProps {
  messages: MessageType[];
  isLoading: boolean;
  onSendMessage: (content: string) => Promise<void>;
  selectedModel: string;
}

export default function AIInteractionPanel({
  messages,
  isLoading,
  onSendMessage,
  selectedModel
}: AIInteractionPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom when messages change
  // Improved scroll handling
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        const container = messagesEndRef.current.parentElement;
        const isNearBottom = container && 
          (container.scrollHeight - container.scrollTop - container.clientHeight < 100);

        if (isNearBottom || messages[messages.length - 1]?.role === 'user') {
          messagesEndRef.current.scrollIntoView({ 
            behavior: messages[messages.length - 1]?.role === 'user' ? 'instant' : 'smooth',
            block: "end"
          });
        }
      }
    };
    
    scrollToBottom();
    // Handle dynamic content and animations
    const timeoutIds = [100, 200, 500, 1000].map(delay => 
      setTimeout(scrollToBottom, delay)
    );
    
    return () => timeoutIds.forEach(id => clearTimeout(id));
  }, [messages, isLoading]);

  // Handle streaming updates
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const message = inputValue;
      setInputValue("");
      await onSendMessage(message);
      
      // Focus back on input
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full flex bg-white dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700 md:border-t-0">
      <ConversationHistory 
        conversations={conversations}
        onSelectConversation={selectConversation}
        currentConversationId={currentConversation?.id}
      />
      <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
        <h3 className="font-medium">AI Agent Interaction</h3>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-500 dark:text-gray-400">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-500 dark:text-gray-400">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <Message 
              key={message.id} 
              message={message} 
              isLoading={isLoading && index === messages.length - 1} 
            />
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Textarea
              ref={messageInputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Message AI Assistant..."
              disabled={isLoading}
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-1 text-gray-400">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-gray-600 dark:hover:text-gray-300">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-gray-600 dark:hover:text-gray-300">
                <SmilePlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm flex items-center"
          >
            <span>Send</span>
            <Send className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div>Model: <span className="font-medium">{selectedModel === 'auto' ? 'Auto (Based on Task)' : selectedModel}</span></div>
          <div>
            <Button variant="ghost" size="sm" className="p-0 h-auto hover:text-gray-700 dark:hover:text-gray-300">
              <Settings className="h-3 w-3 mr-1 inline" />
              <span>Advanced Options</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Loading dots are styled using CSS classes in index.css */}
    </div>
  );
}
