'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeviceCard } from '@/components/DeviceCard'
import { TasmotaDevice, tasmotaAPI } from '@/lib/api'

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

interface DashboardStats {
  totalDevices: number
  onlineDevices: number
  activeDevices: number
  totalConsumption: number
}

export function Dashboard() {
  const [devices, setDevices] = useState<TasmotaDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)

  const loadDevices = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const data = await tasmotaAPI.fetchDevices()
      setDevices(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load devices:', error)
    } finally {
      setLoading(false)
      if (showRefreshIndicator) {
        setTimeout(() => setRefreshing(false), 800) // Show refresh animation briefly
      }
    }
  }

  const handleTogglePower = async (deviceId: string) => {
    setSelectedDevice(deviceId)
    try {
      await tasmotaAPI.toggleDevicePower(deviceId)
      await loadDevices() // Refresh data after toggle
    } catch (error) {
      console.error('Failed to toggle device power:', error)
    } finally {
      setSelectedDevice(null)
    }
  }

  const calculateStats = (): DashboardStats => {
    return {
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.status === 'online').length,
      activeDevices: devices.filter(d => d.power_state && d.status === 'online').length,
      totalConsumption: devices
        .filter(d => d.status === 'online')
        .reduce((sum, d) => sum + d.energy_consumption, 0)
    }
  }

  useEffect(() => {
    loadDevices()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadDevices()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="glass rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-8 w-48 bg-white/20 rounded-lg"></div>
                    <div className="h-4 w-32 bg-white/15 rounded-lg"></div>
                  </div>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl"></div>
              </div>
            </div>
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="h-4 w-20 bg-white/20 rounded"></div>
                      <div className="h-8 w-16 bg-white/30 rounded"></div>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Devices Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 border border-white/20 h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-2.5 text-white shadow-lg">
                    <HomeIcon />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
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
                <button
                  onClick={() => loadDevices(true)}
                  disabled={refreshing}
                  className={`group relative p-3 rounded-xl bg-white/80 hover:bg-white border border-gray-200/50 hover:border-gray-300/50 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshIcon />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 space-y-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Total Devices */}
          <Card className="group relative glass rounded-2xl border border-white/30 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-100/25 transition-all duration-300 hover:scale-[1.02] animate-fade-in overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="relative p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Total Devices
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-2.5 text-white shadow-lg group-hover:shadow-blue-200/50 transition-all duration-300 mt-2">
                    <DevicesIcon />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {stats.totalDevices}
                  </p>
                  <p className="text-sm text-blue-600 font-medium mt-1">Connected nodes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Online Devices */}
          <Card className="group relative glass rounded-2xl border border-white/30 backdrop-blur-xl hover:shadow-xl hover:shadow-emerald-100/25 transition-all duration-300 hover:scale-[1.02] animate-fade-in [animation-delay:100ms] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-green-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="relative p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Online
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl p-2.5 text-white shadow-lg group-hover:shadow-emerald-200/50 transition-all duration-300 mt-2">
                    <div className="w-full h-full bg-emerald-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                    {stats.onlineDevices}
                  </p>
                  <p className="text-sm text-emerald-600 font-medium mt-1">Connected now</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Devices */}
          <Card className="group relative glass rounded-2xl border border-white/30 backdrop-blur-xl hover:shadow-xl hover:shadow-orange-100/25 transition-all duration-300 hover:scale-[1.02] animate-fade-in [animation-delay:200ms] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-amber-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="relative p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Active
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-2.5 text-white shadow-lg group-hover:shadow-orange-200/50 transition-all duration-300 mt-2">
                    <ActivityIcon />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-br from-orange-600 to-orange-800 bg-clip-text text-transparent">
                    {stats.activeDevices}
                  </p>
                  <p className="text-sm text-orange-600 font-medium mt-1">Powered on</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Power */}
          <Card className="group relative glass rounded-2xl border border-white/30 backdrop-blur-xl hover:shadow-xl hover:shadow-purple-100/25 transition-all duration-300 hover:scale-[1.02] animate-fade-in [animation-delay:300ms] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-violet-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="relative p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Total Power
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-2.5 text-white shadow-lg group-hover:shadow-purple-200/50 transition-all duration-300 mt-2">
                    <EnergyIcon />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    {stats.totalConsumption.toFixed(1)}W
                  </p>
                  <p className="text-sm text-purple-600 font-medium mt-1">Current draw</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Devices Section */}
        <div className="space-y-6 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Connected Devices
              </h2>
              <p className="text-gray-600 mt-1">Manage your smart home ecosystem</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="px-3 py-1 font-medium border-gray-300 text-gray-700">
                {devices.length} devices
              </Badge>
              <Badge variant="success" className="px-3 py-1 font-medium">
                {stats.onlineDevices} online
              </Badge>
            </div>
          </div>

          {devices.length === 0 ? (
            <Card className="glass rounded-2xl border border-white/20 backdrop-blur-xl">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4 mx-auto mb-6">
                  <DevicesIcon />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No devices detected
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Make sure your Tasmota devices are connected to the network and configured properly.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device, index) => (
                <div
                  key={device.device_id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <DeviceCard
                    device={device}
                    onTogglePower={handleTogglePower}
                    isLoading={selectedDevice === device.device_id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 