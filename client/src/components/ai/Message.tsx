import React, { useEffect, useRef } from "react";
import { Message as MessageType } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, Clipboard, Code, FileText, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marked } from 'marked';
import hljs from 'highlight.js';

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

const parseContent = (content: string) => {
  marked.setOptions({
    highlight: function(code, lang) {
      return hljs.highlight(code, { language: lang }).value;
    },
    breaks: true,
  });
  return marked.parse(content);
};

const ContentBlock = ({ type, content, level }: { type: string; content: string; level?: number }) => {
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
          className="relative group rounded-lg bg-gray-900 dark:bg-gray-800 transition-all duration-300 my-4"
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
            <code className="text-sm text-gray-200">{content.trim()}</code>
          </pre>
        </div>
      );

    case 'list':
      return (
        <div 
          ref={blockRef}
          className="my-4 transition-all duration-300"
          style={{ transition: 'opacity 0.5s, transform 0.5s' }}
        >
          {content.startsWith('-') || content.startsWith('*') ? (
            <ul className="list-disc list-inside space-y-2">
              {content.split('\n').filter(Boolean).map((item, i) => (
                <li key={i} className="text-gray-700 dark:text-gray-300">{item.replace(/^[-*]\s/, '')}</li>
              ))}
            </ul>
          ) : (
            <ol className="list-decimal list-inside space-y-2">
              {content.split('\n').filter(Boolean).map((item, i) => (
                <li key={i} className="text-gray-700 dark:text-gray-300">{item.replace(/^\d+\.\s/, '')}</li>
              ))}
            </ol>
          )}
        </div>
      );

    case 'heading':
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      return (
        <div 
          ref={blockRef}
          className="my-4 transition-all duration-300"
          style={{ transition: 'opacity 0.5s, transform 0.5s' }}
        >
          <HeadingTag className={`font-bold ${level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg'}`}>
            {content}
          </HeadingTag>
        </div>
      );

    case 'table':
      return (
        <div 
          ref={blockRef}
          className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300"
          style={{ transition: 'opacity 0.5s, transform 0.5s' }}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {content.split('\n').filter(Boolean).map((row, i) => (
              <tr key={i} className={i === 1 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                {row.split('|').filter(Boolean).map((cell, j) => (
                  i === 1 ? null : 
                  i === 0 ? 
                    <th key={j} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {cell.trim()}
                    </th> :
                    <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {cell.trim()}
                    </td>
                ))}
              </tr>
            ))}
          </table>
        </div>
      );

    default:
      return (
        <div 
          ref={blockRef}
          className="prose dark:prose-invert max-w-none my-4 transition-all duration-300"
          style={{ transition: 'opacity 0.5s, transform 0.5s' }}
        >
          {content.split('\n').map((line, i) => {
            // Check for heading (# syntax)
            if (line.startsWith('#')) {
              const level = line.match(/^#+/)[0].length;
              const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
              return <HeadingTag key={i} className="font-bold text-lg mb-2">{line.replace(/^#+\s/, '')}</HeadingTag>;
            }

            // Check for list items
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return <li key={i} className="ml-4 mb-2">{line.slice(2)}</li>;
            }

            // Check for numbered list
            if (/^\d+\./.test(line)) {
              return <li key={i} className="ml-4 mb-2">{line.replace(/^\d+\.\s/, '')}</li>;
            }

            // Check for bold text
            if (line.includes('**')) {
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <p key={i} className="mb-2 leading-relaxed">
                  {parts.map((part, j) => 
                    part.startsWith('**') ? 
                      <strong key={j}>{part.replace(/\*\*/g, '')}</strong> : 
                      part
                  )}
                </p>
              );
            }

            // Regular paragraph
            return line ? <p key={i} className="mb-2 leading-relaxed">{line}</p> : <br key={i} />;
          })}
        </div>
      );
  }
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

  // const contentBlocks = parseContent(message.content);

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
            <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: parseContent(message.content) }}
          />
            
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