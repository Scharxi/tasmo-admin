'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  Zap, 
  Clock,
  CheckCircle,
  AlertCircle,
  Power,
  PowerOff,
  ArrowLeft,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { useDevices } from '@/hooks/useDevices'
import { 
  useWorkflows, 
  useCreateWorkflow, 
  useUpdateWorkflow, 
  useDeleteWorkflow, 
  useExecuteWorkflow,
  type WorkflowStep,
  type WorkflowCondition,
  type CreateWorkflowData,
  type Workflow
} from '@/hooks/useWorkflows'
import { useSearchParams } from 'next/navigation'

// Generate unique ID for steps
const generateStepId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export function WorkflowBuilder() {
  const searchParams = useSearchParams()
  const editWorkflowId = searchParams.get('edit')
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Form state
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [workflowEnabled, setWorkflowEnabled] = useState(true)
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])

  // Hooks
  const { data: devices = [] } = useDevices()
  const { data: workflows = [], isLoading: workflowsLoading } = useWorkflows()
  const createWorkflowMutation = useCreateWorkflow()
  const updateWorkflowMutation = useUpdateWorkflow()
  const deleteWorkflowMutation = useDeleteWorkflow()
  const executeWorkflowMutation = useExecuteWorkflow()

  // Load workflow from URL parameter
  useEffect(() => {
    if (editWorkflowId && workflows.length > 0) {
      const workflowToEdit = workflows.find(w => w.id === editWorkflowId)
      if (workflowToEdit) {
        setEditingWorkflow(workflowToEdit)
      }
    }
  }, [editWorkflowId, workflows])

  // Load workflow data when editing
  useEffect(() => {
    if (editingWorkflow) {
      setWorkflowName(editingWorkflow.name)
      setWorkflowDescription(editingWorkflow.description || '')
      setWorkflowEnabled(editingWorkflow.enabled)
      setWorkflowSteps(editingWorkflow.steps || [])
      setShowCreateForm(true)
    }
  }, [editingWorkflow])

  // Helper function to get device name
  const getDeviceName = useCallback((deviceId: string) => {
    const device = devices.find(d => d.device_id === deviceId)
    return device ? device.device_name : `Unknown Device (${deviceId})`
  }, [devices])

  // Step management functions
  const addStep = useCallback(() => {
    const newStep: WorkflowStep = {
      id: generateStepId(),
      deviceId: '',
      action: 'TURN_ON',
      conditions: []
    }
    setWorkflowSteps(prev => [...prev, newStep])
  }, [])

  const removeStep = useCallback((stepId: string) => {
    setWorkflowSteps(prev => prev.filter(step => step.id !== stepId))
  }, [])

  const updateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }, [])

  const moveStep = useCallback((stepId: string, direction: 'up' | 'down') => {
    setWorkflowSteps(prev => {
      const index = prev.findIndex(step => step.id === stepId)
      if (index === -1) return prev
      
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev
      
      const newSteps = [...prev]
      ;[newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]]
      return newSteps
    })
  }, [])

  const addCondition = useCallback((stepId: string) => {
    const newCondition: WorkflowCondition = {
      deviceId: '',
      state: 'ON'
    }
    updateStep(stepId, {
      conditions: [...(workflowSteps.find(s => s.id === stepId)?.conditions || []), newCondition]
    })
  }, [workflowSteps, updateStep])

  const removeCondition = useCallback((stepId: string, conditionIndex: number) => {
    const step = workflowSteps.find(s => s.id === stepId)
    if (!step?.conditions) return
    
    const newConditions = step.conditions.filter((_, index) => index !== conditionIndex)
    updateStep(stepId, { conditions: newConditions })
  }, [workflowSteps, updateStep])

  const updateCondition = useCallback((stepId: string, conditionIndex: number, updates: Partial<WorkflowCondition>) => {
    const step = workflowSteps.find(s => s.id === stepId)
    if (!step?.conditions) return
    
    const newConditions = step.conditions.map((condition, index) =>
      index === conditionIndex ? { ...condition, ...updates } : condition
    )
    updateStep(stepId, { conditions: newConditions })
  }, [workflowSteps, updateStep])

  // Reset form
  const resetForm = useCallback(() => {
    setWorkflowName('')
    setWorkflowDescription('')
    setWorkflowEnabled(true)
    setWorkflowSteps([])
    setShowCreateForm(false)
    setEditingWorkflow(null)
  }, [])

  // Form handlers
  const handleCreateWorkflow = async () => {
    if (!workflowName.trim()) {
      setNotification({ type: 'error', message: 'Workflow-Name ist erforderlich' })
      return
    }

    if (workflowSteps.length === 0) {
      setNotification({ type: 'error', message: 'Mindestens ein Schritt ist erforderlich' })
      return
    }

    // Validate steps
    for (const step of workflowSteps) {
      if (!step.deviceId) {
        setNotification({ type: 'error', message: 'Alle Schritte müssen ein Gerät haben' })
        return
      }
    }

    try {
      const workflowData: CreateWorkflowData = {
        name: workflowName,
        description: workflowDescription,
        enabled: workflowEnabled,
        steps: workflowSteps
      }

      if (editingWorkflow) {
        // Update existing workflow
        await updateWorkflowMutation.mutateAsync({
          id: editingWorkflow.id,
          data: workflowData
        })
        setNotification({ type: 'success', message: 'Workflow erfolgreich aktualisiert!' })
      } else {
        // Create new workflow
        await createWorkflowMutation.mutateAsync(workflowData)
        setNotification({ type: 'success', message: 'Workflow erfolgreich erstellt!' })
      }
      
      resetForm()
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Fehler beim Speichern des Workflows'
      })
    }
  }

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow)
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      const result = await executeWorkflowMutation.mutateAsync(workflowId)
      setNotification({ type: 'success', message: result.message })
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Fehler beim Ausführen des Workflows'
      })
    }
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Workflow löschen möchten?')) {
      return
    }

    try {
      await deleteWorkflowMutation.mutateAsync(workflowId)
      setNotification({ type: 'success', message: 'Workflow erfolgreich gelöscht!' })
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Fehler beim Löschen des Workflows'
      })
    }
  }

  // Clear notification after 5 seconds
  if (notification) {
    setTimeout(() => setNotification(null), 5000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-2.5 text-white shadow-lg">
                <Settings className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Workflow Builder
                </h1>
                <p className="text-gray-600 font-medium">Erstellen Sie automatisierte Geräte-Sequenzen</p>
              </div>
            </div>
            
            <Button 
              onClick={() => {
                setEditingWorkflow(null)
                setShowCreateForm(true)
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Neuer Workflow
            </Button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <Alert className={`${notification.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
            <AlertDescription className={notification.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {notification.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workflow List */}
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Verfügbare Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflowsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : workflows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Noch keine Workflows erstellt</p>
                  <p className="text-sm">Klicken Sie auf "Neuer Workflow" um zu beginnen</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                          <Badge variant={workflow.enabled ? "default" : "secondary"}>
                            {workflow.enabled ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExecuteWorkflow(workflow.id)}
                            disabled={!workflow.enabled || executeWorkflowMutation.isPending}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteWorkflow(workflow.id)}
                            disabled={deleteWorkflowMutation.isPending}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {workflow.description && (
                        <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                      )}
                      
                      <div className="text-sm text-gray-500">
                        {workflow.steps.length} Schritt{workflow.steps.length !== 1 ? 'e' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Workflow Form */}
          {showCreateForm && (
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-500" />
                  Neuen Workflow erstellen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workflow-name">Workflow-Name *</Label>
                    <Input
                      id="workflow-name"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      placeholder="z.B. Server-Startup-Sequenz"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="workflow-description">Beschreibung</Label>
                    <Input
                      id="workflow-description"
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                      placeholder="Beschreibung des Workflows..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="workflow-enabled"
                      checked={workflowEnabled}
                      onCheckedChange={setWorkflowEnabled}
                    />
                    <Label htmlFor="workflow-enabled">Workflow aktiviert</Label>
                  </div>
                </div>

                <Separator />

                {/* Steps */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Workflow-Schritte</h3>
                    <Button onClick={addStep} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Schritt hinzufügen
                    </Button>
                  </div>

                  {workflowSteps.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Keine Schritte definiert</p>
                      <p className="text-sm">Fügen Sie Schritte hinzu, um die Ausführungsreihenfolge zu definieren</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {workflowSteps.map((step, index) => (
                        <Card key={step.id} className="p-4 border border-gray-200">
                          <div className="space-y-4">
                            {/* Step Header */}
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="px-3 py-1">
                                Schritt {index + 1}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveStep(step.id, 'up')}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveStep(step.id, 'down')}
                                  disabled={index === workflowSteps.length - 1}
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeStep(step.id)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Step Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Gerät</Label>
                                <Select
                                  value={step.deviceId}
                                  onValueChange={(value: string) => updateStep(step.id, { deviceId: value })}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Gerät auswählen" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {devices.map((device) => (
                                      <SelectItem key={device.device_id} value={device.device_id}>
                                        {device.device_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Aktion</Label>
                                <Select
                                  value={step.action}
                                  onValueChange={(value: 'TURN_ON' | 'TURN_OFF' | 'DELAY') => 
                                    updateStep(step.id, { action: value })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="TURN_ON">
                                      <div className="flex items-center gap-2">
                                        <Power className="w-4 h-4 text-green-600" />
                                        Einschalten
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="TURN_OFF">
                                      <div className="flex items-center gap-2">
                                        <PowerOff className="w-4 h-4 text-red-600" />
                                        Ausschalten
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="DELAY">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                        Warten
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Delay Configuration */}
                            {step.action === 'DELAY' && (
                              <div>
                                <Label htmlFor={`delay-${step.id}`}>Wartezeit (Sekunden)</Label>
                                <Input
                                  id={`delay-${step.id}`}
                                  type="number"
                                  min="1"
                                  value={step.delay || ''}
                                  onChange={(e) => updateStep(step.id, { delay: parseInt(e.target.value) || undefined })}
                                  placeholder="Wartezeit in Sekunden"
                                  className="mt-1"
                                />
                              </div>
                            )}

                            {/* Conditions */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Bedingungen (optional)</Label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addCondition(step.id)}
                                  className="text-xs"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Bedingung
                                </Button>
                              </div>

                              {step.conditions && step.conditions.length > 0 && (
                                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                                  {step.conditions.map((condition, conditionIndex) => (
                                    <div key={conditionIndex} className="flex items-center gap-2">
                                      <Select
                                        value={condition.deviceId}
                                        onValueChange={(value: string) => 
                                          updateCondition(step.id, conditionIndex, { deviceId: value })
                                        }
                                      >
                                        <SelectTrigger className="flex-1">
                                          <SelectValue placeholder="Gerät auswählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {devices.map((device) => (
                                            <SelectItem key={device.device_id} value={device.device_id}>
                                              {device.device_name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>

                                      <span className="text-sm text-gray-500">muss</span>

                                      <Select
                                        value={condition.state}
                                        onValueChange={(value: 'ON' | 'OFF') => 
                                          updateCondition(step.id, conditionIndex, { state: value })
                                        }
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="ON">AN</SelectItem>
                                          <SelectItem value="OFF">AUS</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      <span className="text-sm text-gray-500">sein</span>

                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeCondition(step.id, conditionIndex)}
                                        className="text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setWorkflowName('')
                      setWorkflowDescription('')
                      setWorkflowSteps([])
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleCreateWorkflow}
                    disabled={createWorkflowMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    {createWorkflowMutation.isPending ? 'Erstelle...' : 'Workflow erstellen'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}