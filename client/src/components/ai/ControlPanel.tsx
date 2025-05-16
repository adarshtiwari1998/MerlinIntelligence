import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { TaskType } from "@shared/schema";

interface ControlPanelProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  selectedTaskType: TaskType;
  onTaskTypeChange: (taskType: TaskType) => void;
}

export default function ControlPanel({
  selectedModel,
  onModelChange,
  selectedTaskType,
  onTaskTypeChange
}: ControlPanelProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850">
      <div className="flex justify-between items-center px-4">
        <div className="flex-1">
          <label className="text-sm text-gray-600 dark:text-gray-300 font-medium mr-2">Task Type</label>
        </div>
        <div className="flex items-center">
          <Select value={selectedModel} onValueChange={onModelChange} defaultValue="auto">
            <SelectTrigger className="h-8 text-xs bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 rounded border-0 border-gray-200 dark:border-gray-700 py-1 px-2">
              <SelectValue placeholder="Auto-select based on task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-select based on task</SelectItem>
              <SelectItem value="primary">GPT-4o</SelectItem>
              <SelectItem value="claude">Claude (Anthropic)</SelectItem>
              <SelectItem value="code">Code-Specialized</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex space-x-1 px-2">
        <Button
          variant="ghost"
          className={`text-sm py-2 px-4 rounded-t-md border-b-2 ${selectedTaskType === 'code_generation' 
            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
          onClick={() => onTaskTypeChange('code_generation')}
        >
          Code Generation
        </Button>
        <Button
          variant="ghost"
          className={`text-sm py-2 px-4 rounded-t-md border-b-2 ${selectedTaskType === 'code_completion' 
            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
          onClick={() => onTaskTypeChange('code_completion')}
        >
          Completion
        </Button>
        <Button
          variant="ghost"
          className={`text-sm py-2 px-4 rounded-t-md border-b-2 ${selectedTaskType === 'code_explanation' 
            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
          onClick={() => onTaskTypeChange('code_explanation')}
        >
          Explanation
        </Button>
      </div>
    </div>
  );
}
