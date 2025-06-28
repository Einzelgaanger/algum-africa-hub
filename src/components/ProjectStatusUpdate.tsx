
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ProjectStatusUpdateProps {
  currentStatus: string;
  onStatusUpdate: (status: string) => void;
}

export function ProjectStatusUpdate({ currentStatus, onStatusUpdate }: ProjectStatusUpdateProps) {
  const statusOptions = [
    { value: 'todo', label: 'To Do', icon: AlertCircle, color: 'text-gray-600' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-yellow-600' },
    { value: 'done', label: 'Done', icon: CheckCircle, color: 'text-green-600' },
  ];

  const currentStatusData = statusOptions.find(option => option.value === currentStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {currentStatusData && (
            <currentStatusData.icon className={`h-4 w-4 ${currentStatusData.color}`} />
          )}
          Update Status
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onStatusUpdate(option.value)}
            className="flex items-center gap-2"
            disabled={option.value === currentStatus}
          >
            <option.icon className={`h-4 w-4 ${option.color}`} />
            {option.label}
            {option.value === currentStatus && (
              <span className="ml-auto text-xs text-gray-500">(current)</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
