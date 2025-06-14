'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DeviceCard } from '@/components/DeviceCard'
import { AddDeviceDialog } from '@/components/AddDeviceDialog'
import { DeviceMetrics } from '@/components/DeviceMetrics'
import { useDevices, useToggleDevicePower, useDashboardStats, useDeviceStateSynchronization } from '@/hooks/useDevices'
import { TasmotaDevice } from '@/lib/api'
import Link from 'next/link'

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

export function Dashboard() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  // Tanstack Query Hooks
  const { data: devices = [], isLoading: loading, isRefetching: refreshing, dataUpdatedAt } = useDevices()
  const togglePowerMutation = useToggleDevicePower()
  const stats = useDashboardStats()
  const { forceRefresh } = useDeviceStateSynchronization()

  const handleTogglePower = async (deviceId: string) => {
    setSelectedDevice(deviceId)
    try {
      const result = await togglePowerMutation.mutateAsync(deviceId)
    } catch (error) {
      console.error('Failed to toggle device power:', error)
    } finally {
      setSelectedDevice(null)
    }
  }

  const lastUpdate = new Date(dataUpdatedAt)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="bg-white/80 rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 w-32 bg-gray-150 rounded-lg"></div>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      <div className="h-8 w-16 bg-gray-250 rounded"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Devices Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/80 rounded-2xl p-6 border border-gray-200 shadow-sm h-80"></div>
              ))}
            </div>
          </div>
        </div>
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

      <main className="relative z-10 max-w-7xl mx-auto px-6 space-y-8">
        {/* Optimized Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Total Devices */}
          <Card className="group bg-white/90 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Total Devices
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-2.5 text-white shadow-lg mt-2">
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
          <Card className="group bg-white/90 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Online
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl p-2.5 text-white shadow-lg mt-2">
                    <div className="w-full h-full bg-emerald-200 rounded-full"></div>
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
          <Card className="group bg-white/90 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Active
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-2.5 text-white shadow-lg mt-2">
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
          <Card className="group bg-white/90 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Total Power
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-2.5 text-white shadow-lg mt-2">
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

        {/* Devices Section */}
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
              <Link href="/devices/discover">
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  Discovery
                </Button>
              </Link>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Device
              </Button>
            </div>
          </div>

          {devices.length === 0 ? (
            <Card className="bg-white/90 rounded-2xl border border-gray-200 shadow-lg">
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
              {devices.map((device) => (
                <DeviceCard
                  key={device.device_id}
                  device={device}
                  onTogglePower={handleTogglePower}
                  isLoading={selectedDevice === device.device_id}
                />
              ))}
            </div>
          )}
        </div>
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