import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { ConversationHistory } from "../ai/ConversationHistory";
import { useAIAgent } from "@/hooks/useAIAgent";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { conversations, currentConversation, selectConversation } = useAIAgent();

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200 h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ConversationHistory 
          conversations={conversations}
          onSelectConversation={selectConversation}
          currentConversationId={currentConversation?.id}
        />
        {children}
      </div>
    </div>
  );
}
