'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { 
  AlertCircle, 
  Settings, 
  Database, 
  Clock, 
  HardDrive, 
  Save, 
  RefreshCw, 
  Trash2,
  Shield,
  ChevronRight,
  Smartphone,
  Monitor,
  Zap,
  ArrowLeft,
  Home
} from 'lucide-react'
import { useDevices } from '@/hooks/useDevices'
import { SecuritySettings } from '@/components/SecuritySettings'
import { LdapSettings } from '@/components/LdapSettings'
import Link from 'next/link'

interface GlobalLoggingConfig {
  enableDataLogging: boolean
  dataRetentionDays: number
  minLogInterval: number
}

interface DeviceLoggingStatus {
  deviceId: string
  deviceName: string
  enableDataLogging: boolean
  dataRetentionDays: number
  minLogInterval: number
  actualStorage: string
  estimatedStorage: string
  recordCount: number
}

interface StorageSummary {
  totalActualStorage: { bytes: number; formatted: string }
  totalEstimatedStorage: { bytes: number; formatted: string }
  totalRecords: number
  activeDevices: number
  totalDevices: number
  averageRetentionDays: number
  averageIntervalSeconds: number
  storageEfficiency: number
}

export default function SettingsPage() {
  const { data: devices = [] } = useDevices()
  const [globalConfig, setGlobalConfig] = useState<GlobalLoggingConfig>({
    enableDataLogging: true,
    dataRetentionDays: 30,
    minLogInterval: 60
  })
  const [deviceConfigs, setDeviceConfigs] = useState<DeviceLoggingStatus[]>([])
  const [storageSummary, setStorageSummary] = useState<StorageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load device configurations and storage data
  useEffect(() => {
    if (devices.length > 0) {
      loadDeviceConfigs()
      loadStorageData()
    }
  }, [devices])

  const loadDeviceConfigs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const configs = await Promise.all(
        devices.map(async (device) => {
          try {
            const [configResponse, storageResponse] = await Promise.all([
              fetch(`/api/devices/${device.device_id}/logging-config`),
              fetch(`/api/devices/${device.device_id}/storage`)
            ])
            
            const configData = await configResponse.json()
            const storageData = storageResponse.ok ? await storageResponse.json() : null
            
            if (configResponse.ok) {
              return {
                deviceId: device.device_id,
                deviceName: device.device_name,
                enableDataLogging: configData.config.enableDataLogging,
                dataRetentionDays: configData.config.dataRetentionDays,
                minLogInterval: configData.config.minLogInterval,
                actualStorage: storageData?.actualStorage?.formatted || '0 B',
                estimatedStorage: storageData?.estimatedStorage?.formatted || '0 B',
                recordCount: storageData?.actualStorage?.recordCount || 0
              }
            } else {
              throw new Error(`Failed to load config for ${device.device_id}`)
            }
          } catch (err) {
            console.error(`Error loading config for ${device.device_id}:`, err)
            return {
              deviceId: device.device_id,
              deviceName: device.device_name,
              enableDataLogging: false,
              dataRetentionDays: 30,
              minLogInterval: 60,
              actualStorage: '0 B',
              estimatedStorage: '0 B',
              recordCount: 0
            }
          }
        })
      )
      
      setDeviceConfigs(configs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations')
    } finally {
      setLoading(false)
    }
  }

  const loadStorageData = async () => {
    try {
      const response = await fetch('/api/storage')
      if (response.ok) {
        const data = await response.json()
        setStorageSummary(data.summary)
      }
    } catch (err) {
      console.error('Failed to load storage data:', err)
    }
  }

  const applyGlobalSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)
      
      const updatePromises = devices.map(device => 
        fetch(`/api/devices/${device.device_id}/logging-config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(globalConfig)
        })
      )
      
      await Promise.all(updatePromises)
      
      // Reload configurations and storage data
      await loadDeviceConfigs()
      await loadStorageData()
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply global settings')
    } finally {
      setSaving(false)
    }
  }

  const updateDeviceConfig = async (deviceId: string, config: Partial<GlobalLoggingConfig>) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/logging-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update device configuration')
      }
      
      // Reload data to get updated storage calculations
      await loadDeviceConfigs()
      await loadStorageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device')
    }
  }

  const cleanupOldData = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Call cleanup for all devices
      const cleanupPromises = devices.map(device => 
        fetch(`/api/devices/${device.device_id}/cleanup`, {
          method: 'POST'
        })
      )
      
      await Promise.all(cleanupPromises)
      
      // Reload data after cleanup
      await loadDeviceConfigs()
      await loadStorageData()
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup old data')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900 dark:hover:border-blue-600 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <Home className="h-4 w-4" />
                <span>Zurück zum Dashboard</span>
              </Button>
            </Link>
            
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg">
              <Settings className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Einstellungen</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">System- und Sicherheitskonfiguration</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="security" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
            <TabsTrigger value="security" className="flex items-center gap-2 rounded-lg">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Sicherheit</span>
            </TabsTrigger>
            <TabsTrigger value="ldap" className="flex items-center gap-2 rounded-lg">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">LDAP</span>
            </TabsTrigger>
            <TabsTrigger value="logging" className="flex items-center gap-2 rounded-lg">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Datenlogging</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2 rounded-lg">
              <HardDrive className="h-4 w-4" />
              <span className="hidden sm:inline">Speicher</span>
            </TabsTrigger>
          </TabsList>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <SecuritySettings />
          </TabsContent>

          {/* LDAP Tab */}
          <TabsContent value="ldap" className="space-y-6">
            <LdapSettings />
          </TabsContent>

          {/* Logging Tab */}
          <TabsContent value="logging" className="space-y-6">
            {/* Global Settings Card */}
            <Card className="border-2 border-green-100 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <span>Globale Logging-Einstellungen</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={globalConfig.enableDataLogging ? "default" : "secondary"}
                        className={`text-xs font-medium ${
                          globalConfig.enableDataLogging 
                            ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-600 dark:text-white dark:border-green-600' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {globalConfig.enableDataLogging ? 'Aktiviert' : 'Deaktiviert'}
                      </Badge>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Diese Einstellungen werden auf alle Geräte angewendet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable Logging Toggle */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      Datenlogging aktivieren
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sammlung von Gerätedaten für Analyse und Monitoring
                    </p>
                  </div>
                  <Switch
                    checked={globalConfig.enableDataLogging}
                    onCheckedChange={(checked) => 
                      setGlobalConfig(prev => ({ ...prev, enableDataLogging: checked }))
                    }
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                {globalConfig.enableDataLogging && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Retention Days */}
                    <div className="space-y-2">
                      <Label htmlFor="retention" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Aufbewahrungsdauer (Tage)
                      </Label>
                      <Input
                        id="retention"
                        type="number"
                        min={1}
                        max={365}
                        value={globalConfig.dataRetentionDays}
                        onChange={(e) => 
                          setGlobalConfig(prev => ({ 
                            ...prev, 
                            dataRetentionDays: Math.max(1, parseInt(e.target.value) || 1)
                          }))
                        }
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Log Interval */}
                    <div className="space-y-2">
                      <Label htmlFor="interval" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Log-Intervall (Sekunden)
                      </Label>
                      <Input
                        id="interval"
                        type="number"
                        min={10}
                        max={3600}
                        value={globalConfig.minLogInterval}
                        onChange={(e) => 
                          setGlobalConfig(prev => ({ 
                            ...prev, 
                            minLogInterval: Math.max(10, parseInt(e.target.value) || 60)
                          }))
                        }
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <RefreshCw className="h-4 w-4" />
                      <span className="font-medium">Einstellungen erfolgreich angewendet</span>
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                <Button
                  onClick={applyGlobalSettings}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 rounded-xl shadow-lg border border-green-700 transition-all duration-300"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Anwenden...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>Auf alle Geräte anwenden</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Device Specific Settings */}
            {deviceConfigs.length > 0 && (
              <Card className="border-2 border-blue-100 dark:border-blue-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
                      <Monitor className="h-6 w-6" />
                    </div>
                    Gerätespezifische Einstellungen
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Individuelle Konfiguration für jedes Gerät
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deviceConfigs.map((device) => (
                    <div
                      key={device.deviceId}
                      className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg">
                            <Zap className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{device.deviceName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{device.deviceId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={device.enableDataLogging ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {device.enableDataLogging ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Logging</span>
                          <Switch
                            checked={device.enableDataLogging}
                            onCheckedChange={(checked) => 
                              updateDeviceConfig(device.deviceId, { enableDataLogging: checked })
                            }
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Aufbewahrung (Tage)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            value={device.dataRetentionDays}
                            onChange={(e) => 
                              updateDeviceConfig(device.deviceId, { 
                                dataRetentionDays: Math.max(1, parseInt(e.target.value) || 1)
                              })
                            }
                            className="h-8 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            disabled={!device.enableDataLogging}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Intervall (s)</Label>
                          <Input
                            type="number"
                            min={10}
                            max={3600}
                            value={device.minLogInterval}
                            onChange={(e) => 
                              updateDeviceConfig(device.deviceId, { 
                                minLogInterval: Math.max(10, parseInt(e.target.value) || 60)
                              })
                            }
                            className="h-8 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            disabled={!device.enableDataLogging}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Speicher: {device.actualStorage}</span>
                          <span>Datensätze: {device.recordCount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-6">
            {/* Storage Summary */}
            {storageSummary && (
              <Card className="border-2 border-orange-100 dark:border-orange-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg shadow-md">
                      <HardDrive className="h-6 w-6" />
                    </div>
                    Speicherübersicht
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Aktuelle Speichernutzung und -statistiken
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 text-white rounded-lg">
                          <Database className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Gesamtspeicher</p>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {storageSummary.totalActualStorage.formatted}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 text-white rounded-lg">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Datensätze</p>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {storageSummary.totalRecords.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 text-white rounded-lg">
                          <Monitor className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Aktive Geräte</p>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {storageSummary.activeDevices} / {storageSummary.totalDevices}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 text-white rounded-lg">
                          <RefreshCw className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Effizienz</p>
                          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {Math.round(storageSummary.storageEfficiency * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cleanup Section */}
                  <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <h3 className="font-semibold text-red-800 dark:text-red-300">Datenbereinigung</h3>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      Entfernt abgelaufene Daten basierend auf den Aufbewahrungsrichtlinien jedes Geräts.
                    </p>
                    <Button
                      onClick={cleanupOldData}
                      disabled={saving}
                      variant="destructive"
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Bereinigung läuft...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          <span>Alte Daten bereinigen</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 