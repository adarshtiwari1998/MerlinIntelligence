
import React, { useEffect, useRef } from "react";
import { Message as MessageType } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, Clipboard, Code, FileText, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageProps {
  message: MessageType;
  isLoading?: boolean;
}

const LoadingAnimation = () => (
  <div className="flex space-x-2 p-4">
    <div className="animate-bounce h-2 w-2 bg-gray-500 rounded-full delay-0"></div>
    <div className="animate-bounce h-2 w-2 bg-gray-500 rounded-full delay-150"></div>
    <div className="animate-bounce h-2 w-2 bg-gray-500 rounded-full delay-300"></div>
  </div>
);

const ContentBlock = ({ type, content }: { type: string; content: string }) => {
  const blockRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (blockRef.current) {
      blockRef.current.style.opacity = '0';
      blockRef.current.style.transform = 'translateY(10px)';
      requestAnimationFrame(() => {
        if (blockRef.current) {
          blockRef.current.style.opacity = '1';
          blockRef.current.style.transform = 'translateY(0)';
        }
      });
    }
  }, []);

  switch (type) {
    case 'code':
      return (
        <div 
          ref={blockRef}
          className="relative group rounded-lg bg-gray-900 dark:bg-gray-800 transition-all duration-300"
          style={{ transition: 'opacity 0.5s, transform 0.5s' }}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 dark:bg-gray-700/50 rounded-t-lg">
            <span className="text-xs text-gray-200">Code</span>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => navigator.clipboard.writeText(content)}
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm text-gray-200">{content}</code>
          </pre>
        </div>
      );

    case 'table':
      return (
        <div 
          ref={blockRef}
          className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300"
          style={{ transition: 'opacity 0.5s, transform 0.5s' }}
        >
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );

    default:
      return (
        <div 
          ref={blockRef}
          className="prose dark:prose-invert max-w-none transition-all duration-300"
          style={{ transition: 'opacity 0.5s, transform 0.5s' }}
        >
          {content.split('\n').map((line, i) => (
            <p key={i} className="mb-2 leading-relaxed">{line}</p>
          ))}
        </div>
      );
  }
};

const detectContentType = (content: string): string => {
  if (content.includes('```')) return 'code';
  if (content.includes('|') && content.includes('-|-')) return 'table';
  if (content.match(/^(\d+\.|•|\*|\-)\s/m)) return 'list';
  return 'text';
};

export default function Message({ message, isLoading }: MessageProps) {
  const isUser = message.role === "user";
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.style.opacity = '0';
      messageRef.current.style.transform = 'translateY(20px)';
      requestAnimationFrame(() => {
        if (messageRef.current) {
          messageRef.current.style.opacity = '1';
          messageRef.current.style.transform = 'translateY(0)';
        }
      });
    }
  }, []);

  const contentBlocks = message.content.split(/(```[\s\S]*?```|\|[\s\S]*?\n\s*[-|\s]+\n[\s\S]*?\n\n)/).filter(Boolean);

  return (
    <div 
      ref={messageRef}
      className={cn(
        "flex items-start space-x-4 p-4",
        isUser ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50',
        "transition-all duration-300"
      )}
      style={{ transition: 'opacity 0.5s, transform 0.5s' }}
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

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          {message.modelUsed && (
            <span className="text-xs text-gray-500">{message.modelUsed}</span>
          )}
        </div>

        <div className={cn(
          "rounded-lg overflow-hidden",
          isUser ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800',
          "p-4 space-y-4"
        )}>
          {isLoading ? (
            <LoadingAnimation />
          ) : (
            contentBlocks.map((block, index) => (
              <ContentBlock
                key={index}
                type={detectContentType(block)}
                content={block.replace(/```([\s\S]*?)```/g, '$1')}
              />
            ))
          )}
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
