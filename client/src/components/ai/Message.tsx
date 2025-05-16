import React from "react";
import { Message as MessageType } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, ThumbsDown, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageProps {
  message: MessageType;
  isLoading?: boolean;
}

const LoadingAnimation = () => (
  <div className="flex space-x-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
  </div>
);

export default function Message({ message, isLoading }: MessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAssistant = message.role === "assistant";

  // Function to format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to copy content to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Function to render message content with code blocks
  const renderContent = (content: string) => {
    // Split content by code blocks (```code```)
    const parts = content.split(/(```[\s\S]*?```)/);

    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const codeMatch = part.match(/```(?:(\w+)\n)?([\s\S]*?)```/);
        const language = codeMatch?.[1] || '';
        const code = codeMatch?.[2] || '';

        return (
          <pre key={index} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-md mt-2 overflow-x-auto text-xs">
            {code}
          </pre>
        );
      }

      // For regular text, render with line breaks and formatting
      return (
        <div key={index} className="whitespace-pre-wrap">
          {part.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < part.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="flex items-start space-x-3">
      {isUser ? (
        <Avatar className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 text-blue-700 dark:text-blue-300">
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      )}

      <div className="flex-1">
        <div 
          className={`rounded-lg p-3 text-sm ${
            isUser 
              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800' 
              : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {isLoading ? <LoadingAnimation /> : renderContent(message.content)}
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {isUser ? 'You' : isAssistant ? (message.modelUsed || 'AI') : 'System'}
            {message.modelUsed && isAssistant && ` • ${message.modelUsed}`}
            {' • '}
            {formatTime(message.timestamp)}
          </span>

          {isAssistant && (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <ThumbsDown className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-6 w-6 p-0 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => copyToClipboard(message.content)}
              >
                <Clipboard className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}