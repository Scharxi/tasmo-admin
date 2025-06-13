'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { TasmotaDevice } from '@/lib/api'

// Mock icons as simple elements since lucide-react is not installed yet
const PowerIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const WifiIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
)

const PlugIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3V1m0 0h10v18a4 4 0 01-4 4H9a4 4 0 01-4-4V1z" />
  </svg>
)

interface DeviceCardProps {
  device: TasmotaDevice
  onTogglePower: (deviceId: string) => void
  isLoading?: boolean
}

export function DeviceCard({ device, onTogglePower, isLoading = false }: DeviceCardProps) {
  const [isHovered, setIsHovered] = useState(false)

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
      return <Badge variant="destructive">Offline</Badge>
    }
    return device.power_state 
      ? <Badge variant="success">On</Badge> 
      : <Badge variant="warning">Off</Badge>
  }

  const getWifiStrength = (signal: number) => {
    if (signal >= -50) return { strength: 'Excellent', color: 'text-green-500' }
    if (signal >= -60) return { strength: 'Good', color: 'text-yellow-500' }
    if (signal >= -70) return { strength: 'Fair', color: 'text-orange-500' }
    return { strength: 'Poor', color: 'text-red-500' }
  }

  const wifi = getWifiStrength(device.wifi_signal)

  return (
    <Card 
      className={`device-card transition-all duration-300 hover:shadow-lg ${
        device.power_state && device.status === 'online' ? 'ring-2 ring-green-200' : ''
      } ${isHovered ? 'scale-[1.02]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full ${
              device.power_state && device.status === 'online' 
                ? 'bg-green-100 text-green-600 animate-pulse-glow' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              <PlugIcon />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{device.device_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{device.ip_address}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Power Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PowerIcon />
            <span className="text-sm font-medium">Power</span>
          </div>
          <Switch
            checked={device.power_state}
            onCheckedChange={() => onTogglePower(device.device_id)}
            disabled={isLoading || device.status === 'offline'}
            className="switch-button"
          />
        </div>

        {/* Energy Consumption */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="text-lg font-semibold text-blue-600">
              {formatEnergy(device.energy_consumption)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-semibold text-purple-600">
              {device.total_energy.toFixed(2)} kWh
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="pt-3 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <WifiIcon />
              <span className={wifi.color}>{wifi.strength}</span>
              <span>({device.wifi_signal}dBm)</span>
            </div>
            <div>
              Uptime: {formatUptime(device.uptime)}
            </div>
            <div>
              FW: {device.firmware_version}
            </div>
            <div className="flex items-center space-x-1">
              {device.voltage && (
                <span>{device.voltage}V</span>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 