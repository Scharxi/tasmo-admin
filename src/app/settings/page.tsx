'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Settings, Database, Clock, HardDrive, Save, RefreshCw, Trash2 } from 'lucide-react'
import { useDevices } from '@/hooks/useDevices'

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
              // Error loading config - don't use fallback values
              throw new Error(`Failed to load config for ${device.device_id}`)
            }
          } catch (err) {
            console.error(`Error loading config for ${device.device_id}:`, err)
            // Return minimal config for error cases
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
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup old data')
    } finally {
      setSaving(false)
    }
  }



  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Data Logging Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure how measurement data is stored across all devices
        </p>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-md mb-6">
          <AlertCircle className="h-4 w-4" />
          <span>Settings updated successfully!</span>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-md mb-6">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Global Settings
              </CardTitle>
              <CardDescription>
                Apply these settings to all devices at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Enable Data Logging</Label>
                  <p className="text-sm text-gray-600">
                    Store historical measurement data for all devices
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    {globalConfig.enableDataLogging ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={globalConfig.enableDataLogging}
                    onCheckedChange={(checked) => setGlobalConfig(prev => ({ ...prev, enableDataLogging: checked }))}
                    disabled={saving}
                  />
                </div>
              </div>

              {globalConfig.enableDataLogging && (
                <>
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Retention (Days)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={globalConfig.dataRetentionDays}
                        onChange={(e) => setGlobalConfig(prev => ({ 
                          ...prev, 
                          dataRetentionDays: parseInt(e.target.value) || 30 
                        }))}
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Min Log Interval (Seconds)</Label>
                      <Input
                        type="number"
                        min="10"
                        max="3600"
                        value={globalConfig.minLogInterval}
                        onChange={(e) => setGlobalConfig(prev => ({ 
                          ...prev, 
                          minLogInterval: parseInt(e.target.value) || 60 
                        }))}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={applyGlobalSettings}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Apply to All Devices
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={loadDeviceConfigs}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Individual Device Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Individual Device Settings
              </CardTitle>
              <CardDescription>
                Fine-tune settings for each device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deviceConfigs.map((device) => (
                  <div key={device.deviceId} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{device.deviceName}</h4>
                        <p className="text-sm text-gray-500">{device.deviceId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          {device.enableDataLogging ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          checked={device.enableDataLogging}
                          onCheckedChange={(checked) => updateDeviceConfig(device.deviceId, { enableDataLogging: checked })}
                        />
                        <Badge variant={device.enableDataLogging ? "default" : "secondary"}>
                          {device.enableDataLogging ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                    
                    {device.enableDataLogging && (
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <Label className="text-xs">Retention (Days)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            value={device.dataRetentionDays}
                            onChange={(e) => updateDeviceConfig(device.deviceId, { 
                              dataRetentionDays: parseInt(e.target.value) || 30 
                            })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Interval (Sec)</Label>
                          <Input
                            type="number"
                            min="10"
                            max="3600"
                            value={device.minLogInterval}
                            onChange={(e) => updateDeviceConfig(device.deviceId, { 
                              minLogInterval: parseInt(e.target.value) || 60 
                            })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Storage (Actual/Est)</Label>
                          <div className="h-8 flex items-center text-xs font-medium">
                            <div className="text-blue-600">{device.actualStorage}</div>
                            <span className="text-gray-500 mx-1">/</span>
                            <div className="text-gray-600">{device.estimatedStorage}</div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {device.recordCount.toLocaleString()} records
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Storage Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {storageSummary?.totalActualStorage?.formatted || '0 B'}
                </div>
                <p className="text-sm text-gray-600">Total actual storage</p>
                <div className="text-sm text-gray-500 mt-1">
                  Est: {storageSummary?.totalEstimatedStorage?.formatted || '0 B'}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Active devices:</span>
                  <span className="font-medium">
                    {storageSummary?.activeDevices || 0} / {storageSummary?.totalDevices || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total records:</span>
                  <span className="font-medium">
                    {storageSummary?.totalRecords?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg retention:</span>
                  <span className="font-medium">
                    {storageSummary?.averageRetentionDays || 0} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg interval:</span>
                  <span className="font-medium">
                    {storageSummary?.averageIntervalSeconds || 0}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Storage efficiency:</span>
                  <span className="font-medium">
                    {Math.round((storageSummary?.storageEfficiency || 0) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                onClick={cleanupOldData}
                disabled={saving}
                className="w-full flex items-center gap-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Cleanup Old Data
              </Button>
              <p className="text-xs text-gray-600 mt-2">
                Remove data older than retention settings
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 