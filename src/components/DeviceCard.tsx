'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DeviceMetrics } from '@/components/DeviceMetrics'
import { DeviceCategoryDialog } from '@/components/DeviceCategoryDialog'
import { CriticalPowerConfirmDialog } from '@/components/CriticalPowerConfirmDialog'
import { PasswordDialog } from '@/components/PasswordDialog'
import { TasmotaDevice } from '@/lib/api'
import { Power, Trash2, AlertTriangle, CheckCircle, Wifi, Settings, ShieldAlert } from 'lucide-react'

// Modern SVG icons with enhanced styling
const PowerIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const PowerButtonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
  </svg>
)

const WifiIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 0 1 7.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
)

const PlugIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077 1.41-.513m14.095-5.13 1.41-.513M5.106 17.785l1.15-.964m11.49-9.642 1.149-.964M7.501 19.795l.75-1.3m7.5-12.99.75-1.3m-6.063 16.658.26-1.477m2.605-14.772.26-1.477m0 17.726-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205 12 12m6.894 5.785-1.149-.964M6.256 8.357l-1.15-.964m1.15 9.272-1.15.964m14.667-9.272-1.149.964M18.364 18.364 12 12m-6.364 6.364L12 12" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
)

const ChipIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="m9 1v6m6-6v6m8-6v6M1 9h6m-6 6h6m8-6h6" />
  </svg>
)

interface DeviceCardProps {
  device: TasmotaDevice
  onTogglePower: (deviceId: string) => void
  onDeleteDevice: (deviceId: string) => Promise<void>
  isLoading?: boolean
}

export function DeviceCard({ device, onTogglePower, onDeleteDevice, isLoading = false }: DeviceCardProps) {
  const [showMetrics, setShowMetrics] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showCriticalConfirm, setShowCriticalConfirm] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [securityEnabled, setSecurityEnabled] = useState(false)

  // Load security configuration on component mount
  useEffect(() => {
    const loadSecurityConfig = async () => {
      try {
        const response = await fetch('/api/security/config')
        if (response.ok) {
          const config = await response.json()
          setSecurityEnabled(config.isEnabled && config.hasPassword)
        }
      } catch (error) {
        console.error('Failed to load security config:', error)
        setSecurityEnabled(false) // Safe fallback
      }
    }
    loadSecurityConfig()
  }, [])
  
  const formatEnergy = (watts: number): string => {
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(1)}kW`
    }
    return `${watts.toFixed(1)}W`
  }

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}d ${hours}h`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getStatusBadge = () => {
    if (device.status === 'offline') {
      return <Badge variant="destructive" className="shadow-sm">Offline</Badge>
    }
    return device.power_state 
      ? <Badge variant="success" className="shadow-sm">Active</Badge> 
      : <Badge variant="warning" className="shadow-sm">Standby</Badge>
  }

  const getWifiStrength = (signal: number) => {
    if (signal >= -50) return { strength: 'Excellent', color: 'text-emerald-500', bars: 4 }
    if (signal >= -60) return { strength: 'Good', color: 'text-green-500', bars: 3 }
    if (signal >= -70) return { strength: 'Fair', color: 'text-yellow-500', bars: 2 }
    return { strength: 'Poor', color: 'text-red-500', bars: 1 }
  }

  const wifi = getWifiStrength(device.wifi_signal)

  const handleDeleteDevice = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    
    try {
      await onDeleteDevice(device.device_id)
      setShowDeleteConfirm(false)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete device')
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePowerToggle = () => {
    // Check if device is critical and currently powered on
    if (device.is_critical && device.power_state && device.status === 'online') {
      if (securityEnabled) {
        // If security is enabled, show password dialog
        setShowPasswordDialog(true)
      } else {
        // If security is disabled, show critical confirmation dialog
        setShowCriticalConfirm(true)
      }
    } else {
      onTogglePower(device.device_id)
    }
  }

  const handleCriticalPowerConfirm = () => {
    onTogglePower(device.device_id)
    setShowCriticalConfirm(false)
  }

  const handlePasswordConfirm = () => {
    onTogglePower(device.device_id)
    setShowPasswordDialog(false)
  }

  return (
    <>
      <Card className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-fit max-w-full">
        {/* Category Color Bar */}
        <div 
          className="h-1"
          style={{ 
            backgroundColor: device.category?.color || (
              device.status === 'offline' 
                ? '#ef4444' 
                : device.power_state
                  ? '#10b981'
                  : '#f59e0b'
            )
          }}
        />

        <CardHeader className="pb-4 pt-5 px-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div 
                className="p-2 rounded-lg text-white flex-shrink-0"
                style={{ 
                  backgroundColor: device.category?.color || (
                    device.power_state && device.status === 'online' 
                      ? '#10b981' 
                      : '#6b7280'
                  )
                }}
              >
                <PlugIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-gray-800 break-words">
                    {device.device_name}
                  </CardTitle>
                  {device.is_critical && (
                    <div className="flex-shrink-0" title="Kritisches Gerät - Erfordert Bestätigung beim Ausschalten">
                      <ShieldAlert 
                        className="h-4 w-4 text-amber-500" 
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 break-all">ID: {device.device_id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
              {getStatusBadge()}
              <DeviceCategoryDialog 
                device={device}
                trigger={
                  <button
                    className="h-7 w-7 p-1 border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-md transition-colors duration-200 flex items-center justify-center flex-shrink-0"
                    title="Kategorie bearbeiten"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                }
              />
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="h-7 w-7 p-1 border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-md transition-colors duration-200 flex items-center justify-center flex-shrink-0"
                title="Gerät entfernen"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-0 px-5">
          {/* Category Info - Always reserve space for consistent layout */}
          <div className="pb-3 border-b border-gray-100 min-w-0 min-h-[28px] flex items-center">
            {device.category ? (
              <div className="flex flex-wrap gap-2 min-w-0">
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium flex-shrink-0"
                  style={{ 
                    backgroundColor: `${device.category.color}15`,
                    borderColor: device.category.color,
                    color: device.category.color
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                    style={{ backgroundColor: device.category.color }}
                  />
                  <span className="truncate">{device.category.name}</span>
                </Badge>
                {device.description && (
                  <span className="text-xs text-gray-500 truncate">• {device.description}</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                <span className="text-xs text-gray-400">Keine Kategorie</span>
              </div>
            )}
          </div>
          
          {/* Network Info */}
          <div className="grid grid-cols-2 gap-4 text-sm min-w-0">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-2 font-medium">NETZWERK</p>
              <p className="font-medium text-gray-700 flex items-center min-w-0 mb-1">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                <span className="truncate">{device.ip_address}</span>
              </p>
              <p className="text-xs text-gray-500 flex items-center min-w-0">
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2 flex-shrink-0"></span>
                <span className="truncate">{device.mac_address}</span>
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-2 font-medium">WIFI SIGNAL</p>
              <div className="flex items-center space-x-2 min-w-0">
                <WifiIcon />
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${wifi.color} truncate`}>
                    {device.wifi_signal}dBm
                  </p>
                  <p className="text-xs text-gray-500 truncate">{wifi.strength}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Power Metrics */}
          <div className="grid grid-cols-4 gap-3 bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1 font-medium">VERBRAUCH</p>
              <p className="text-base font-bold text-blue-600">{formatEnergy(device.energy_consumption)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1 font-medium">SPANNUNG</p>
              <p className="text-base font-bold text-gray-900">{device.voltage?.toFixed(0) || 'N/A'} V</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1 font-medium">STROM</p>
              <p className="text-base font-bold text-gray-900">{device.current?.toFixed(2) || 'N/A'} A</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1 font-medium">GESAMT</p>
              <p className="text-base font-bold text-purple-600">{device.total_energy.toFixed(1)}kWh</p>
            </div>
          </div>

          {/* Power Control */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg min-w-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <PowerIcon />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700">Power Control</p>
                <p className="text-xs text-gray-500 truncate">
                  <span className="inline-flex items-center min-w-0">
                    <ClockIcon />
                    <span className="ml-1 truncate">{formatUptime(device.uptime)} • {device.firmware_version}</span>
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handlePowerToggle}
              disabled={isLoading || device.status === 'offline'}
              className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                device.power_state && device.status === 'online'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              } ${isLoading ? 'animate-pulse scale-95' : 'hover:scale-105'}`}
              title={device.power_state ? 'Ausschalten' : 'Einschalten'}
            >
              <PowerButtonIcon />
            </button>
          </div>

          {/* Metrics Toggle */}
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
              className="text-xs text-gray-500 hover:text-gray-700"
              disabled={device.status === 'offline'}
            >
              {showMetrics ? 'Weniger anzeigen' : 'Detaillierte Messwerte'}
            </Button>
          </div>

          {/* Detailed Metrics Panel */}
          {showMetrics && (
            <div className="border-t border-gray-100 pt-3">
              <DeviceMetrics 
                deviceId={device.device_id} 
                className=""
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Gerät entfernen
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Diese Aktion kann nicht rückgängig gemacht werden
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {deleteError && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    {deleteError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Gerätename:</strong> {device.device_name}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Geräte-ID:</strong> {device.device_id}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>IP-Adresse:</strong> {device.ip_address}
                </p>
              </div>
              
              <p className="text-sm text-gray-600">
                Das Gerät wird aus dem System entfernt. Alle gespeicherten Daten und Metriken 
                zu diesem Gerät werden dauerhaft gelöscht.
              </p>
              
              <div className="flex items-center justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteError(null)
                  }}
                  disabled={isDeleting}
                  className="px-4"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleDeleteDevice}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white px-4"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Entfernen...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Endgültig entfernen
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Power Confirmation Dialog */}
      <CriticalPowerConfirmDialog
        isOpen={showCriticalConfirm}
        onClose={() => setShowCriticalConfirm(false)}
        onConfirm={handleCriticalPowerConfirm}
        device={device}
      />

      {/* Password Dialog for Security-Protected Critical Devices */}
      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onConfirm={handlePasswordConfirm}
        device={device}
      />
    </>
  )
} 