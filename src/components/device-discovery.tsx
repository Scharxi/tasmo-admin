'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// import { Checkbox } from '@/components/ui/checkbox' // Temporarily disabled due to import issues
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Wifi, Zap, CheckCircle, Loader2, Search } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DiscoveredDevice {
  device_id: string
  device_name: string
  ip_address: string
  mac_address?: string
  firmware_version: string
  status: string
  power_state: boolean
  energy_consumption: number
  wifi_signal: number
  voltage: number
  current: number
}

interface DeviceDiscoveryProps {
  onDevicesSelected: (devices: DiscoveredDevice[]) => void
}

export function DeviceDiscovery({ onDevicesSelected }: DeviceDiscoveryProps) {
  const [ipRange, setIpRange] = useState('172.25.0.100-172.25.0.102') // Default to known working range
  const [isScanning, setIsScanning] = useState(false)
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([])
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set())
  const [scanResults, setScanResults] = useState<{ totalScanned: number; totalFound: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState<string>('')
  
  const handleScan = async () => {
    if (!ipRange.trim()) {
      setError('Bitte gib eine IP-Range ein')
      return
    }
    
    setIsScanning(true)
    setError(null)
    setDiscoveredDevices([])
    setScanResults(null)
    
    try {
      const response = await fetch('/api/devices/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: ipRange,
          maxConcurrency: 20
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Scan fehlgeschlagen')
      }
      
      const data = await response.json()
      setDiscoveredDevices(data.discoveredDevices || [])
      setScanResults({
        totalScanned: data.totalScanned || 0,
        totalFound: data.totalFound || 0
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Scannen')
    } finally {
      setIsScanning(false)
    }
  }
  
  const handleDeviceToggle = (deviceId: string) => {
    const newSelected = new Set(selectedDevices)
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId)
    } else {
      newSelected.add(deviceId)
    }
    setSelectedDevices(newSelected)
  }
  
  const handleSelectAll = () => {
    if (selectedDevices.size === discoveredDevices.length) {
      setSelectedDevices(new Set())
    } else {
      setSelectedDevices(new Set(discoveredDevices.map(d => d.device_id)))
    }
  }
  
  const handleAddSelected = () => {
    const devicesToAdd = discoveredDevices.filter(device => 
      selectedDevices.has(device.device_id)
    )
    onDevicesSelected(devicesToAdd)
  }
  
  const getWifiStrengthColor = (signal: number) => {
    if (signal > -50) return 'text-green-600'
    if (signal > -70) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const formatSignal = (signal: number) => {
    return `${signal} dBm`
  }

  return (
    <div className="space-y-8">
      {/* IP Range Input */}
      <Card className="bg-white/90 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-2 text-white shadow-lg">
              <Search className="w-full h-full" />
            </div>
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Netzwerk Scan
              </div>
              <p className="text-sm text-gray-600 font-normal mt-1">IP-Bereich für Discovery konfigurieren</p>
            </div>
          </CardTitle>
          <CardDescription className="text-gray-600 leading-relaxed">
            Scanne ein IP-Bereich nach Tasmota-Geräten. Unterstützte Formate:
            <br />
            <span className="inline-flex items-center gap-1 mt-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              <strong>Range:</strong> 192.168.1.1-192.168.1.254
            </span>
            <br />
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <strong>CIDR:</strong> 192.168.1.0/24
            </span>
            <br />
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              <strong>Einzelne IP:</strong> 192.168.1.100
            </span>
            <br />
            <span className="inline-flex items-center gap-1 mt-2 p-2 bg-blue-50 rounded-lg">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
              <strong>Tipp:</strong> Verwende 172.25.0.100-172.25.0.102 für die Simulator-Geräte
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="ip-range">IP-Bereich</Label>
              <Input
                id="ip-range"
                value={ipRange}
                onChange={(e) => setIpRange(e.target.value)}
                placeholder="192.168.1.1-192.168.1.254"
                disabled={isScanning}
              />
            </div>
            <div className="flex items-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIpRange('172.25.0.100-172.25.0.102')}
                disabled={isScanning}
                className="rounded-xl border-gray-300 hover:bg-gray-50 px-4 py-2"
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                Simulator-Range
              </Button>
              <Button 
                onClick={handleScan} 
                disabled={isScanning}
                className="min-w-[140px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg px-6 py-2.5"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Scanne...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Scannen
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isScanning && scanProgress && (
            <div className="text-sm text-blue-600 font-medium">
              {scanProgress}
            </div>
          )}
          
          {scanResults && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{scanResults.totalScanned} IPs gescannt</span>
              <span>{scanResults.totalFound} Geräte gefunden</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Discovered Devices */}
      {discoveredDevices.length > 0 && (
        <Card className="bg-white/95 rounded-xl border border-gray-200 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg text-white">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    Gefundene Geräte ({discoveredDevices.length})
                  </div>
                  <p className="text-sm text-gray-600 font-normal">Wähle die Geräte aus, die hinzugefügt werden sollen</p>
                </div>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedDevices.size === discoveredDevices.length ? 'Alle abwählen' : 'Alle auswählen'}
                </Button>
                <Button
                  onClick={handleAddSelected}
                  disabled={selectedDevices.size === 0}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white text-xs disabled:opacity-50"
                >
                  {selectedDevices.size} hinzufügen
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {discoveredDevices.map((device) => (
                <Card key={device.device_id} className={`bg-white/95 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 ${
                  selectedDevices.has(device.device_id) ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
                }`}>
                  {/* Status Indicator Bar */}
                  <div className={`h-1 bg-gradient-to-r ${
                    device.power_state
                      ? 'from-emerald-400 to-green-500'
                      : 'from-amber-400 to-orange-500'
                  }`} />
                  
                  <CardContent className="p-4 pt-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          device.power_state 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-gray-400 text-white'
                        }`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-gray-800">{device.device_name}</h4>
                          <p className="text-xs text-gray-500">ID: {device.device_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedDevices.has(device.device_id)}
                          onChange={() => handleDeviceToggle(device.device_id)}
                          className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2"
                        />
                        <div className="flex flex-col items-end space-y-1">
                          <Badge 
                            variant={device.power_state ? "default" : "secondary"}
                            className={device.power_state ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}
                          >
                            {device.power_state ? 'Aktiv' : 'Standby'}
                          </Badge>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {device.energy_consumption.toFixed(1)}W
                            </div>
                            <div className="text-xs text-gray-500">Verbrauch</div>
                          </div>
                        </div>
                      </div>
                    </div>
                        
                    {/* Network Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">NETZWERK</p>
                        <p className="font-medium text-gray-700">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {device.ip_address}
                        </p>
                        {device.mac_address && (
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                            {device.mac_address}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">WIFI SIGNAL</p>
                        <div className="flex items-center space-x-2">
                          <Wifi className="w-4 h-4 text-gray-600" />
                          <div>
                            <p className={`text-sm font-medium ${getWifiStrengthColor(device.wifi_signal)}`}>
                              {device.wifi_signal}dBm
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Power Metrics */}
                    <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">SPANNUNG</p>
                        <p className="text-sm font-bold text-gray-900">{device.voltage.toFixed(0)}V</p>
                      </div>
                      <div className="text-center border-l border-r border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">STROM</p>
                        <p className="text-sm font-bold text-gray-900">{device.current.toFixed(2)}A</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">FIRMWARE</p>
                        <p className="text-sm font-bold text-blue-600">{device.firmware_version}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 