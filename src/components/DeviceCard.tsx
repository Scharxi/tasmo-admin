'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeviceMetrics } from '@/components/DeviceMetrics'
import { TasmotaDevice } from '@/lib/api'
import { Power } from 'lucide-react'

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
  isLoading?: boolean
}

export function DeviceCard({ device, onTogglePower, isLoading = false }: DeviceCardProps) {
  const [showMetrics, setShowMetrics] = useState(false)
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

  return (
    <Card className={`bg-white/95 rounded-xl border shadow-md hover:shadow-lg transition-all duration-200 ${
      device.power_state && device.status === 'online' 
        ? 'border-emerald-300 bg-emerald-50/30' 
        : 'border-gray-200'
    }`}>
      {/* Status Indicator Bar */}
      <div className={`h-1 bg-gradient-to-r ${
        device.status === 'offline' 
          ? 'from-red-400 to-red-600' 
          : device.power_state
            ? 'from-emerald-400 to-green-500'
            : 'from-amber-400 to-orange-500'
      }`} />

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              device.power_state && device.status === 'online' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gray-400 text-white'
            }`}>
              <PlugIcon />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-800">
                {device.device_name}
              </CardTitle>
              <p className="text-xs text-gray-500">ID: {device.device_id}</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {getStatusBadge()}
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {formatEnergy(device.energy_consumption)}
              </div>
              <div className="text-xs text-gray-500">Verbrauch</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Network Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">NETZWERK</p>
            <p className="font-medium text-gray-700">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              {device.ip_address}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              {device.mac_address}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">WIFI SIGNAL</p>
            <div className="flex items-center space-x-2">
              <WifiIcon />
              <div>
                <p className={`text-sm font-medium ${wifi.color}`}>
                  {device.wifi_signal}dBm
                </p>
                <p className="text-xs text-gray-500">{wifi.strength}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Power Metrics */}
        <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">SPANNUNG</p>
            <p className="text-sm font-bold text-gray-900">{device.voltage?.toFixed(0) || 'N/A'} V</p>
          </div>
          <div className="text-center border-l border-r border-gray-200">
            <p className="text-xs text-gray-500 mb-1">STROM</p>
            <p className="text-sm font-bold text-gray-900">{device.current?.toFixed(2) || 'N/A'} A</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">GESAMT</p>
            <p className="text-sm font-bold text-purple-600">{device.total_energy.toFixed(1)}kWh</p>
          </div>
        </div>

        {/* Power Control */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <PowerIcon />
            <div>
              <p className="text-sm font-medium text-gray-700">Power Control</p>
                             <p className="text-xs text-gray-500">
                 <span className="inline-flex items-center">
                   <ClockIcon />
                   <span className="ml-1">{formatUptime(device.uptime)} • {device.firmware_version}</span>
                 </span>
               </p>
            </div>
          </div>
          <button
            onClick={() => onTogglePower(device.device_id)}
            disabled={isLoading || device.status === 'offline'}
            className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              device.power_state && device.status === 'online'
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gray-400 text-white hover:bg-gray-500'
            } ${isLoading ? 'animate-pulse' : ''}`}
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
  )
} 