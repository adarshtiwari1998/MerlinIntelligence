
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@shared/schema";

interface ConversationHistoryProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  currentConversationId?: string;
}

export function ConversationHistory({
  conversations,
  onSelectConversation,
  currentConversationId
}: ConversationHistoryProps) {
  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold">Conversation History</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-64px)]">
        <div className="p-2 space-y-2">
          {conversations.map((conv) => (
            <Button
              key={conv.id}
              variant={conv.id === currentConversationId ? "secondary" : "ghost"}
              className="w-full justify-start text-left"
              onClick={() => onSelectConversation(conv)}
            >
              <div className="truncate">
                <div className="font-medium">{conv.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
