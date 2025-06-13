'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { TasmotaDevice } from '@/lib/api'

// Modern SVG icons with enhanced styling
const PowerIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
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
    <div className="group relative">
      <Card 
        className={`relative glass rounded-2xl border border-white/20 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100/50 hover:scale-[1.02] ${
          device.power_state && device.status === 'online' 
            ? 'ring-2 ring-emerald-200/50 shadow-emerald-100/50' 
            : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
          device.power_state && device.status === 'online' 
            ? 'from-emerald-50/30 to-blue-50/30 opacity-100' 
            : 'from-gray-50/20 to-slate-50/20 opacity-50'
        }`} />

        {/* Status Indicator Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-300 ${
          device.status === 'offline' 
            ? 'from-red-400 to-red-600' 
            : device.power_state
              ? 'from-emerald-400 to-green-500'
              : 'from-amber-400 to-orange-500'
        }`} />

        <CardHeader className="relative pb-4 pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`relative p-3 rounded-2xl transition-all duration-300 ${
                device.power_state && device.status === 'online' 
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-200' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-lg shadow-gray-200'
              }`}>
                <PlugIcon />
                {device.power_state && device.status === 'online' && (
                  <div className="absolute inset-0 bg-emerald-400 rounded-2xl animate-pulse opacity-50"></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg font-bold text-gray-800 truncate">
                  {device.device_name}
                </CardTitle>
                <p className="text-sm text-gray-500 font-medium">{device.ip_address}</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6 pt-0">
          {/* Power Control Section */}
          <div className="glass-dark rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <PowerIcon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Power Control</p>
                  <p className="text-xs text-gray-500">Device switch</p>
                </div>
              </div>
              <Switch
                checked={device.power_state}
                onCheckedChange={() => onTogglePower(device.device_id)}
                disabled={isLoading || device.status === 'offline'}
                className="switch-button scale-110"
              />
            </div>
          </div>

          {/* Energy Consumption */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-dark rounded-xl p-4 border border-white/10 group hover:border-blue-200/30 transition-colors duration-300">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Draw</p>
                <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {formatEnergy(device.energy_consumption)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((device.energy_consumption / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="glass-dark rounded-xl p-4 border border-white/10 group hover:border-purple-200/30 transition-colors duration-300">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Used</p>
                <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  {device.total_energy.toFixed(1)} kWh
                </p>
                <p className="text-xs text-purple-600 font-medium">Lifetime consumption</p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="glass-dark rounded-xl p-4 border border-white/10">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <ChipIcon />
              <span>Device Information</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <WifiIcon />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium ${wifi.color}`}>
                    {wifi.strength}
                  </p>
                  <p className="text-xs text-gray-500">{device.wifi_signal}dBm</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <ClockIcon />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-700">
                    {formatUptime(device.uptime)}
                  </p>
                  <p className="text-xs text-gray-500">Uptime</p>
                </div>
              </div>
              
              <div className="col-span-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-700">Firmware</p>
                    <p className="text-xs text-gray-500">{device.firmware_version}</p>
                  </div>
                  {device.voltage && (
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-700">{device.voltage}V</p>
                      <p className="text-xs text-gray-500">Input</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-r-blue-400 rounded-full animate-spin animation-delay-150"></div>
              </div>
              <p className="text-sm font-medium text-gray-600">Updating...</p>
            </div>
          </div>
        )}

        {/* Hover Effect Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br from-blue-50/10 to-purple-50/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
      </Card>
    </div>
  )
} 