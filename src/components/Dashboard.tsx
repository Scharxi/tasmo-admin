'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DeviceCard } from '@/components/DeviceCard'
import { AddDeviceDialog } from '@/components/AddDeviceDialog'
import { 
  useDevices, 
  useCategories,
  useDashboardStats,
  useToggleDevicePower,
  useDeleteDevice,
  useDeviceStateSynchronization
} from '@/hooks/useDevices'
import { useWorkflows, useExecuteWorkflow, useDeleteWorkflow } from '@/hooks/useWorkflows'
import { TasmotaDevice, DeviceCategory } from '@/lib/api'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Grid, List, Filter, Palette } from 'lucide-react'


// Modern SVG Icons with better styling
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" />
  </svg>
)

const EnergyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const DevicesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-10.5 3.75H7.5m9-6.75h1.5m-9 6.75v1.5m-1.5-3h1.5m9-6.75V3m-3.75 3.75h3.75m0 0V3m0 3.75L18 7.5M3.75 9.75L7.5 6m0 0L3.75 9.75M7.5 6h.75m9.75 3L13.5 12m0 0 3.75 3.75M13.5 12H7.5m0 0L3.75 9.75" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
)

const ActivityIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
)

const PowerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

type ViewMode = 'categories' | 'grid'

export function Dashboard() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('categories')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  
  // Tanstack Query Hooks
  const { data: devices = [], isLoading: devicesLoading, dataUpdatedAt, isRefetching: refreshing } = useDevices()
  const { data: workflows = [], isLoading: workflowsLoading } = useWorkflows()
  const executeWorkflowMutation = useExecuteWorkflow()
  const deleteWorkflowMutation = useDeleteWorkflow()
  const togglePowerMutation = useToggleDevicePower()
  const deleteDeviceMutation = useDeleteDevice()
  const stats = useDashboardStats()
  const { forceRefresh } = useDeviceStateSynchronization()
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()



  const handleTogglePower = async (deviceId: string) => {
    setSelectedDevice(deviceId)
    try {
      const result = await togglePowerMutation.mutateAsync(deviceId)
      console.log('Toggle power result:', result)
    } catch (error) {
      console.error('Failed to toggle device power:', error)
      setNotification({
        type: 'error',
        message: 'Failed to toggle device power'
      })
    } finally {
      // Clear loading state immediately after request completes
      setSelectedDevice(null)
    }
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    const workflow = workflows.find((w: any) => w.id === workflowId)
    const workflowName = workflow?.name || 'Unbekannter Workflow'
    
    try {
      // Show executing notification via Toast
      if ((window as any).workflowToast) {
        (window as any).workflowToast.showWorkflowExecuting(workflowName)
      }
      
      // Also show in dashboard alert
      setNotification({
        type: 'success',
        message: `⏳ Workflow "${workflowName}" wird ausgeführt...`
      })
      
      const result = await executeWorkflowMutation.mutateAsync(workflowId)
      
      // Show success notification via Toast
      if ((window as any).workflowToast) {
        (window as any).workflowToast.showWorkflowSuccess(workflowName, result.message)
      }
      
      // Also show in dashboard alert
      setNotification({
        type: 'success',
        message: `✅ ${result.message || `Workflow "${workflowName}" erfolgreich ausgeführt!`}`
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      
      // Show error notification via Toast
      if ((window as any).workflowToast) {
        (window as any).workflowToast.showWorkflowError(workflowName, errorMessage)
      }
      
      // Also show in dashboard alert
      setNotification({
        type: 'error',
        message: `❌ Workflow "${workflowName}" fehlgeschlagen: ${errorMessage}`
      })
    }
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Workflow löschen möchten?')) {
      return
    }

    try {
      await deleteWorkflowMutation.mutateAsync(workflowId)
      setNotification({
        type: 'success',
        message: 'Workflow erfolgreich gelöscht!'
      })
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Fehler beim Löschen des Workflows'
      })
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await deleteDeviceMutation.mutateAsync(deviceId)
      
      // Show success message
      setNotification({
        type: 'success',
        message: 'Gerät erfolgreich entfernt!'
      })
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
      
    } catch (error) {
      console.error('Failed to delete device:', error)
      throw error // Re-throw for DeviceCard to handle
    }
  }

  const lastUpdate = new Date(dataUpdatedAt)

  // Categorize devices
  const devicesByCategory = useMemo(() => {
    const categorized: Record<string, TasmotaDevice[]> = {}
    const uncategorized: TasmotaDevice[] = []
    
    devices.forEach(device => {
      if (device.category?.id) {
        if (!categorized[device.category.id]) {
          categorized[device.category.id] = []
        }
        categorized[device.category.id].push(device)
      } else {
        uncategorized.push(device)
      }
    })
    
    return { categorized, uncategorized }
  }, [devices])

  // Filter devices based on selected category
  const filteredDevices = useMemo(() => {
    if (!selectedCategoryId) return devices
    if (selectedCategoryId === 'uncategorized') return devicesByCategory.uncategorized
    return devicesByCategory.categorized[selectedCategoryId] || []
  }, [devices, selectedCategoryId, devicesByCategory])



  // Clear notification after 7 seconds (longer for workflow messages)
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 7000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  if (devicesLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Laden...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Simplified Background - Static for better performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-100/60 to-transparent rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-100/40 to-transparent rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-2.5 text-white shadow-lg">
                    <HomeIcon />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Tasmota Hub
                  </h1>
                  <p className="text-gray-600 font-medium">Smart Device Management System</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Sync</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {lastUpdate.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {refreshing && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Live Updates
                  </Badge>
                  <Link href="/settings">
                    <button
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      title="Data Logging Settings"
                    >
                      <SettingsIcon />
                    </button>
                  </Link>
                  <button
                    onClick={forceRefresh}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    title="Force Refresh"
                  >
                    <RefreshIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Alert */}
      {notification && (
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-4">
          <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className={notification.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className={notification.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {notification.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Home Dashboard</h1>
            <p className="text-gray-600">Verwalten Sie Ihre Tasmota-Geräte nach Kategorien</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/devices/discover">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Discover
              </Button>
            </Link>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Gerät hinzufügen
            </Button>
            <Link href="/settings/categories">
              <Button variant="outline" className="gap-2">
                <Palette className="h-4 w-4" />
                Kategorien verwalten
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Geräte Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDevices}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <SettingsIcon />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online</p>
                <p className="text-2xl font-bold text-green-600">{stats.onlineDevices}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktiv</p>
                <p className="text-2xl font-bold text-orange-600">{stats.activeDevices}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verbrauch</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalConsumption.toFixed(1)}W</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <EnergyIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Workflows Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200/50 p-4 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-3">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-l from-purple-300 to-blue-300 rounded-full transform translate-x-10 -translate-y-10"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white shadow-md">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12l-7.5 7.5M3 12h18" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
                    Workflows
                  </h2>
                  <p className="text-xs text-gray-600">Automatisierte Aktionen für Ihre Geräte</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/workflows">
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    size="sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Erstellen
                  </Button>
                </Link>
                {workflows.length > 0 && (
                  <Link href="/workflows">
                    <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                      Verwalten
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            
            {workflows.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {workflows.slice(0, 4).map((workflow: any) => (
                    <div
                      key={workflow.id}
                      className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-lg p-3 hover:shadow-md hover:bg-white/90 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-md flex items-center justify-center text-white text-xs font-bold">
                          W
                        </div>
                        <h3 className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors text-sm truncate">
                          {workflow.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs mb-3">
                        <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full font-medium">
                          {workflow.steps ? new Set(workflow.steps.map((step: any) => step.deviceId)).size : 0} Geräte
                        </span>
                        <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
                          {workflow.steps?.length || 0} Aktionen
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleExecuteWorkflow(workflow.id)}
                          disabled={executeWorkflowMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs h-8"
                        >
                          {executeWorkflowMutation.isPending ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                              Läuft...
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                              </svg>
                              Start
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          disabled={deleteWorkflowMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 w-10 p-0 flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {workflows.length > 4 && (
                  <div className="mt-3 text-center">
                    <Link href="/workflows">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50 text-xs"
                      >
                        +{workflows.length - 4} weitere anzeigen
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12l-7.5 7.5M3 12h18" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Keine Workflows</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Erstellen Sie Workflows für automatisierte Aktionen
                </p>
                <Link href="/workflows">
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Erstellen
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'categories' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('categories')}
              className="gap-2"
            >
              <Grid className="h-4 w-4" />
              Kategorien
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              Liste
            </Button>
          </div>
          
          {viewMode === 'grid' && (
            <div className="flex items-center gap-3">
              {/* Custom Styled Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="justify-between min-w-48 bg-white"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span>
                      {selectedCategoryId === null 
                        ? `Alle Geräte (${devices.length})`
                        : selectedCategoryId === 'uncategorized'
                        ? `Ohne Kategorie (${devicesByCategory.uncategorized.length})`
                        : `${categories.find(cat => cat.id === selectedCategoryId)?.name} (${devicesByCategory.categorized[selectedCategoryId]?.length || 0})`
                      }
                    </span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                
                {showCategoryDropdown && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowCategoryDropdown(false)}
                    />
                    
                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
                      {/* All Devices Option */}
                      <button
                        onClick={() => {
                          setSelectedCategoryId(null)
                          setShowCategoryDropdown(false)
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${
                          selectedCategoryId === null ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                        <span>Alle Geräte ({devices.length})</span>
                      </button>
                      
                      {/* Categories with devices */}
                      {categories
                        .filter(category => (devicesByCategory.categorized[category.id]?.length || 0) > 0)
                        .map(category => (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategoryId(category.id)
                              setShowCategoryDropdown(false)
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${
                              selectedCategoryId === category.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <div
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: category.color }}
                            />
                            <span>{category.name} ({devicesByCategory.categorized[category.id]?.length || 0})</span>
                          </button>
                        ))}
                      
                      {/* Uncategorized devices */}
                      {devicesByCategory.uncategorized.length > 0 && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => {
                              setSelectedCategoryId('uncategorized')
                              setShowCategoryDropdown(false)
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${
                              selectedCategoryId === 'uncategorized' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                            <span>Ohne Kategorie ({devicesByCategory.uncategorized.length})</span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Category indicator with color */}
              {selectedCategoryId && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: selectedCategoryId === 'uncategorized' 
                          ? '#6B7280' 
                          : categories.find(cat => cat.id === selectedCategoryId)?.color 
                      }}
                    />
                    <span className="text-sm text-gray-700">
                      {selectedCategoryId === 'uncategorized' 
                        ? 'Ohne Kategorie' 
                        : categories.find(cat => cat.id === selectedCategoryId)?.name
                      }
                    </span>
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      className="text-gray-400 hover:text-gray-600 ml-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {viewMode === 'categories' ? (
          <div className="space-y-8">
            {/* Categorized Devices */}
            {categories.map(category => {
              const categoryDevices = devicesByCategory.categorized[category.id] || []
              if (categoryDevices.length === 0) return null
              
              return (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: category.color }}
                    />
                    <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {categoryDevices.length} Gerät{categoryDevices.length !== 1 ? 'e' : ''}
                    </Badge>
                    {category.description && (
                      <p className="text-sm text-gray-500">- {category.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryDevices.map(device => (
                      <DeviceCard
                        key={device.device_id}
                        device={device}
                        onTogglePower={handleTogglePower}
                        onDeleteDevice={handleDeleteDevice}
                        isLoading={selectedDevice === device.device_id}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Uncategorized Devices */}
            {devicesByCategory.uncategorized.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-gray-400 border border-gray-300" />
                  <h2 className="text-lg font-semibold text-gray-900">Ohne Kategorie</h2>
                  <Badge variant="secondary" className="text-xs">
                    {devicesByCategory.uncategorized.length} Gerät{devicesByCategory.uncategorized.length !== 1 ? 'e' : ''}
                  </Badge>
                  <p className="text-sm text-gray-500">- Geräte ohne zugewiesene Kategorie</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {devicesByCategory.uncategorized.map(device => (
                    <DeviceCard
                      key={device.device_id}
                      device={device}
                      onTogglePower={handleTogglePower}
                      onDeleteDevice={handleDeleteDevice}
                      isLoading={selectedDevice === device.device_id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {devices.length === 0 && (
              <div className="text-center py-12">
                <div className="h-12 w-12 text-gray-300 mx-auto mb-4">
                  <SettingsIcon />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Geräte gefunden</h3>
                <p className="text-gray-500">Fügen Sie Ihre ersten Tasmota-Geräte hinzu, um loszulegen.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDevices.map(device => (
                <DeviceCard
                  key={device.device_id}
                  device={device}
                  onTogglePower={handleTogglePower}
                  onDeleteDevice={handleDeleteDevice}
                  isLoading={selectedDevice === device.device_id}
                />
              ))}
            </div>
            
            {filteredDevices.length === 0 && (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Geräte in dieser Kategorie</h3>
                <p className="text-gray-500">
                  {selectedCategoryId 
                    ? 'Wählen Sie eine andere Kategorie oder fügen Sie Geräte zu dieser Kategorie hinzu.'
                    : 'Keine Geräte verfügbar.'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Device Dialog */}
      <AddDeviceDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onDeviceAdded={() => {
          setShowAddDialog(false)
        }}
      />
    </div>
  )
}