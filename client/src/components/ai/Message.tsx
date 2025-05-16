// Message.tsx
import React, { useEffect, useRef } from "react";
import { Message as MessageType } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import hljs from 'highlight.js';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose'
});

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
    const blocks = [];
    const lines = content.split('\n');

    let currentBlock = null;

    const pushBlock = (block) => {
        if (currentBlock) {
            blocks.push(currentBlock);
        }
        currentBlock = block;
    };

    lines.forEach((line, index) => {
        if (line.startsWith('### ')) {
            pushBlock({ type: 'heading', content: line.substring(4), level: 3 });
            currentBlock = null;
        } else if (line.startsWith('## ')) {
            pushBlock({ type: 'heading', content: line.substring(3), level: 2 });
            currentBlock = null;
        } else if (line.startsWith('# ')) {
            pushBlock({ type: 'heading', content: line.substring(2), level: 1 });
            currentBlock = null;
        } else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
            if (!currentBlock || currentBlock.type !== 'list') {
                pushBlock({ type: 'list', items: [line] });
            } else {
                currentBlock.items.push(line);
            }
        } else if (line.startsWith('```')) {
            pushBlock({ type: 'code', language: line.substring(3), content: '' });
            let codeLines = [];
            let i = index + 1;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            currentBlock.content = codeLines.join('\n');
            lines.splice(index + 1, i - index);
        } else if (line.includes('|') && index + 1 < lines.length && lines[index + 1].includes('---')) {
            const tableHeader = line.split('|').filter(Boolean).map(header => header.trim());
            const tableRows = [];
            let i = index + 2;
            while (i < lines.length && lines[i].includes('|')) {
                const row = lines[i].split('|').filter(Boolean).map(cell => cell.trim());
                tableRows.push(row);
                i++;
            }
            pushBlock({ type: 'table', headers: tableHeader, rows: tableRows });
            lines.splice(index + 1, i - index - 1);
        } else if (line.trim() !== '') {
            if (!currentBlock || currentBlock.type !== 'paragraph') {
                pushBlock({ type: 'paragraph', content: line });
            } else {
                currentBlock.content += '\n' + line;
            }
        }
    });

    if (currentBlock) {
        blocks.push(currentBlock);
    }

    return blocks;
};

const ContentBlock = ({ block }: { block: any }) => {
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

    switch (block.type) {
        case 'mermaid':
            useEffect(() => {
        if (blockRef.current && block.content.includes('```mermaid')) {
            const mermaidCode = block.content.split('```mermaid')[1].split('```')[0].trim();
            mermaid.render(`mermaid-${Date.now()}`, mermaidCode)
                .then(({ svg }) => {
                    if (blockRef.current) {
                        blockRef.current.innerHTML = svg;
                    }
                });
        }
    }, [block.content]);

            return (
                <div
                    ref={blockRef}
                    className="my-4 flex justify-center bg-white dark:bg-gray-800 rounded-lg p-4"
                />
            );

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
                            onClick={() => navigator.clipboard.writeText(block.content)}
                        >
                            <Clipboard className="h-4 w-4" />
                        </Button>
                    </div>
                    <pre className="p-4 overflow-x-auto">
                        <code className={`text-sm text-gray-200 language-\${block.language}`} dangerouslySetInnerHTML={{
                            __html: hljs.highlight(block.content, { language: block.language || 'plaintext', ignoreIllegals: true }).value,
                        }} />
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
                    {block.items[0].startsWith('-') || block.items[0].startsWith('*') ? (
                        <ul className="list-disc list-inside space-y-2">
                            {block.items.map((item, i) => (
                                <li key={i} className="text-gray-700 dark:text-gray-300">{item.replace(/^[-*]\s/, '')}</li>
                            ))}
                        </ul>
                    ) : (
                        <ol className="list-decimal list-inside space-y-2">
                            {block.items.map((item, i) => (
                                <li key={i} className="text-gray-700 dark:text-gray-300">{item.replace(/^\d+\.\s/, '')}</li>
                            ))}
                        </ol>
                    )}
                </div>
            );
        case 'heading':
            const HeadingTag = `h\${block.level}` as keyof JSX.IntrinsicElements;
            return (
                <div
                    ref={blockRef}
                    className="my-4 transition-all duration-300"
                    style={{ transition: 'opacity 0.5s, transform 0.5s' }}
                >
                    {/* @ts-expect-error */}
                    <HeadingTag className={`font-bold \${block.level === 1 ? 'text-2xl' : block.level === 2 ? 'text-xl' : 'text-lg'}`}>
                        {block.content}
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
                        <thead>
                            <tr>
                                {block.headers.map((header, j) => (
                                    <th key={j} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {block.rows.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
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
                    <p className="mb-2 leading-relaxed">{block.content}</p>
                </div>
            );
    }
};

export default function Message({ message, isLoading }: MessageProps) {
    const isUser = message.role === "user";
    const messageRef = useRef<HTMLDivElement>(null);
    const contentBlocks = parseContent(message.content);

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
                        <div>
                            {contentBlocks.map((block, index) => (
                                <ContentBlock key={index} block={block} />
                            ))}
                        </div>
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