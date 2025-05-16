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
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 p-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="form-group">
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">Model Selection</label>
          <div className="flex items-center">
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1 px-3">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-select based on task</SelectItem>
                <SelectItem value="primary">GPT-4 (Azure OpenAI)</SelectItem>
                <SelectItem value="code">Code Llama (Specialized LLM)</SelectItem>
                <SelectItem value="starcoder">StarCoder (Code Completion)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="ml-2 p-1.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="form-group">
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">Task Type</label>
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant="outline"
              size="sm"
              className={`text-xs py-1.5 rounded ${selectedTaskType === 'code_generation' 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'}`}
              onClick={() => onTaskTypeChange('code_generation')}
            >
              Code Generation
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs py-1.5 rounded ${selectedTaskType === 'code_completion' 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'}`}
              onClick={() => onTaskTypeChange('code_completion')}
            >
              Completion
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs py-1.5 rounded ${selectedTaskType === 'code_explanation' 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'}`}
              onClick={() => onTaskTypeChange('code_explanation')}
            >
              Explanation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
