import React from "react";
import { Message as MessageType } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, Clipboard, Code, Terminal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageProps {
  message: MessageType;
  isLoading?: boolean;
}

const LoadingAnimation = () => (
  <div className="flex flex-col space-y-4 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
  </div>
);

const detectContentType = (content: string) => {
  if (content.includes("```")) return "code";
  if (content.startsWith("$") || content.startsWith(">")) return "terminal";
  if (content.includes("://") || content.includes("www.")) return "link";
  return "text";
};

const CodeBlock = ({ code, language }: { code: string; language: string }) => (
  <div className="relative group rounded-md bg-gray-900 dark:bg-gray-800">
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 dark:bg-gray-700/50 rounded-t-md">
      <span className="text-xs text-gray-200">{language || 'code'}</span>
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => navigator.clipboard.writeText(code)}
      >
        <Clipboard className="h-4 w-4" />
      </Button>
    </div>
    <pre className="p-4 overflow-x-auto">
      <code className="text-sm text-gray-200">{code}</code>
    </pre>
  </div>
);

const TextBlock = ({ text }: { text: string }) => (
  <div className="prose dark:prose-invert max-w-none">
    {text.split('\n').map((line, i) => (
      <p key={i} className="mb-2">{line}</p>
    ))}
  </div>
);

export default function Message({ message, isLoading }: MessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const renderContent = (content: string) => {
    // Split content by different patterns
    const parts = content.split(/(```[\s\S]*?```|\[.*?\]|\{.*?\}|\$.*?\$)/);

    return parts.map((part, index) => {
      // Code blocks
      if (part.startsWith('```') && part.endsWith('```')) {
        const [, language, code] = part.match(/```(\w*)\n?([\s\S]*?)```/) || [null, '', part.slice(3, -3)];
        return <CodeBlock key={index} code={code.trim()} language={language} />;
      }
      
      // JSON/Object notation
      if (part.startsWith('{') && part.endsWith('}')) {
        try {
          const formatted = JSON.stringify(JSON.parse(part), null, 2);
          return <CodeBlock key={index} code={formatted} language="json" />;
        } catch {
          return <TextBlock key={index} text={part} />;
        }
      }

      // Inline code or command
      if (part.startsWith('$')) {
        return (
          <code key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
            {part}
          </code>
        );
      }

      // Regular text
      return <TextBlock key={index} text={part} />;
    });
  };

  return (
    <div 
      className={`flex items-start space-x-4 p-4 ${
        isUser ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
      } animate-fadeIn`}
    >
      {isUser ? (
        <Avatar className="w-8 h-8 bg-blue-600">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="w-8 h-8 bg-purple-600">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
          </span>
          {message.modelUsed && (
            <span className="text-xs text-gray-500">{message.modelUsed}</span>
          )}
        </div>

        <div className={`rounded-lg overflow-hidden ${
          isUser ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
        } p-4`}>
          {isLoading ? <LoadingAnimation /> : renderContent(message.content)}
        </div>

        {!isUser && !isLoading && (
          <div className="flex items-center gap-2 mt-2">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ThumbsDown className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => navigator.clipboard.writeText(message.content)}
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}