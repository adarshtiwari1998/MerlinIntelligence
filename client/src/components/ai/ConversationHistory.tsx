
import React from 'react';
import { Search, Folder } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold mb-4">History</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search History" 
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="flex gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <Button variant="ghost" size="sm" className="flex-1">Pinned</Button>
        <Button variant="secondary" size="sm" className="flex-1">Chats</Button>
        <Button variant="ghost" size="sm" className="flex-1">Projects</Button>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            <span className="text-sm font-medium">Folders</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">+</Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="p-2 space-y-1">
          {conversations.map((conv) => (
            <Button
              key={conv.id}
              variant={conv.id === currentConversationId ? "secondary" : "ghost"}
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => onSelectConversation(conv)}
            >
              <div className="truncate">
                <div className="font-medium text-sm">{conv.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
