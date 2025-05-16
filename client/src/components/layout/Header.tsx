import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Sun,
  HelpCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Check initial dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);
  
  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="bg-white dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between z-10">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <svg 
            className="text-blue-500 mr-2 h-5 w-5" 
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
          <h1 className="text-lg font-semibold">AI Agent Platform</h1>
        </div>
        <div className="hidden md:flex space-x-1">
          <Button variant="ghost" size="sm">Dashboard</Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          >
            AI Agent
          </Button>
          <Button variant="ghost" size="sm">Models</Button>
          <Button variant="ghost" size="sm">Settings</Button>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 rounded-full"
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden md:inline">Help</span>
        </Button>
        <Avatar className="h-8 w-8 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
