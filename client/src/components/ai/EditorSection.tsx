import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { EditorFile, EditorLanguage } from "@/types";

interface EditorSectionProps {
  files: EditorFile[];
  setFiles: React.Dispatch<React.SetStateAction<EditorFile[]>>;
}

export default function EditorSection({ files, setFiles }: EditorSectionProps) {
  const activeFile = files.find((file) => file.active) || files[0];
  
  const handleFileClick = (fileName: string) => {
    setFiles(files.map(file => ({
      ...file,
      active: file.name === fileName
    })));
  };

  const addNewFile = () => {
    const newFileName = `new_file_${files.length + 1}.py`;
    setFiles([
      ...files.map(file => ({ ...file, active: false })),
      {
        name: newFileName,
        language: EditorLanguage.PYTHON,
        content: "# New file\n",
        active: true
      }
    ]);
  };

  const handleContentChange = (content: string) => {
    if (activeFile) {
      setFiles(files.map(file => 
        file.name === activeFile.name ? { ...file, content } : file
      ));
    }
  };

  // Helper function for syntax highlighting
  const highlightCode = (code: string, language: EditorLanguage) => {
    return code.split('\n').map((line, index) => {
      // Simplified syntax highlighting
      let highlightedLine = line;
      
      // Match Python/JS keywords
      highlightedLine = highlightedLine.replace(
        /(import|from|def|class|if|else|elif|return|async|await|try|except|for|while|in|pass|break|continue|new|function|const|let|var)/g,
        '<span class="text-blue-600 dark:text-blue-400">$1</span>'
      );
      
      // Match strings
      highlightedLine = highlightedLine.replace(
        /(".*?"|'.*?')/g,
        '<span class="text-orange-600 dark:text-orange-400">$1</span>'
      );
      
      // Match comments
      highlightedLine = highlightedLine.replace(
        /(#.*)$/g,
        '<span class="text-green-600 dark:text-green-400">$1</span>'
      );
      
      // Match types and classes
      highlightedLine = highlightedLine.replace(
        /\b([A-Z][A-Za-z0-9_]*)\b/g,
        '<span class="text-yellow-600 dark:text-yellow-400">$1</span>'
      );
      
      // Match functions 
      highlightedLine = highlightedLine.replace(
        /(\w+)(?=\s*\()/g,
        '<span class="text-purple-600 dark:text-purple-400">$1</span>'
      );
      
      return (
        <div key={index} className="leading-6">
          {highlightedLine ? (
            <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
          ) : (
            <span>&nbsp;</span>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-1">
        <div className="flex items-center overflow-x-auto hide-scrollbar">
          {files.map((file) => (
            <Button
              key={file.name}
              variant="ghost"
              size="sm"
              className={`mr-2 text-xs px-2 py-1 rounded ${
                file.active
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              onClick={() => handleFileClick(file.name)}
            >
              {file.name}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            onClick={addNewFile}
          >
            New File
          </Button>
        </div>
        <div>
          <Button variant="ghost" size="sm" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-850 p-4 font-mono text-sm relative">
        <textarea
          value={activeFile?.content || ""}
          onChange={(e) => handleContentChange(e.target.value)}
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-gray-800 dark:caret-gray-200 p-4 resize-none outline-none font-mono text-sm"
          spellCheck="false"
        />
        <pre className="text-gray-800 dark:text-gray-200 pointer-events-none">
          {activeFile && highlightCode(activeFile.content, activeFile.language)}
        </pre>
      </div>
    </div>
  );
}
