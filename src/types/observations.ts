export interface Observation {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  field?: string;
  requiresAction: boolean;
  task?: Task;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  completedAt?: Date;
}

export interface ProgrammingRequest {
  id: string;
  title: string;
  description: string;
  requester: string;
  assignedTo?: string;
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'completed';
  observations: Observation[];
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  observations: Observation[];
  onResolveObservation: (observationId: string) => void;
  onAssignTask: (taskId: string, assignedTo: string) => void;
  onCompleteTask: (taskId: string) => void;
}