import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Types
export interface WorkflowCondition {
  id?: string
  deviceId: string
  state: 'ON' | 'OFF'
}

export interface WorkflowStep {
  id: string
  deviceId: string
  action: 'TURN_ON' | 'TURN_OFF' | 'DELAY'
  delay?: number
  conditions?: WorkflowCondition[]
}

export interface Workflow {
  id: string
  name: string
  description?: string
  enabled: boolean
  steps: WorkflowStep[]
  createdAt: string
  updatedAt: string
}

export interface CreateWorkflowData {
  name: string
  description?: string
  steps: WorkflowStep[]
  enabled?: boolean
}

// API Functions
async function fetchWorkflows(): Promise<Workflow[]> {
  const response = await fetch('/api/workflows')
  if (!response.ok) {
    throw new Error('Failed to fetch workflows')
  }
  return response.json()
}

async function fetchWorkflow(id: string): Promise<Workflow> {
  const response = await fetch(`/api/workflows/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch workflow')
  }
  return response.json()
}

async function createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
  const response = await fetch('/api/workflows', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create workflow')
  }
  
  return response.json()
}

async function updateWorkflow(id: string, data: Partial<CreateWorkflowData>): Promise<Workflow> {
  const response = await fetch(`/api/workflows/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update workflow')
  }
  
  return response.json()
}

async function deleteWorkflow(id: string): Promise<void> {
  const response = await fetch(`/api/workflows/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete workflow')
  }
}

async function executeWorkflow(id: string): Promise<{ success: boolean; message: string; executionId: string }> {
  const response = await fetch(`/api/workflows/${id}/execute`, {
    method: 'POST',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to execute workflow')
  }
  
  return response.json()
}

// Hooks
export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => fetchWorkflow(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWorkflowData> }) =>
      updateWorkflow(id, data),
    onSuccess: (updatedWorkflow) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflow', updatedWorkflow.id] })
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export function useExecuteWorkflow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: executeWorkflow,
    onSuccess: () => {
      // Refresh device states after workflow execution
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
} 