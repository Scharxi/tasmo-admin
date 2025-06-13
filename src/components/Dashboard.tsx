'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeviceCard } from '@/components/DeviceCard'
import { TasmotaDevice, tasmotaAPI } from '@/lib/api'

// Mock icons
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const EnergyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const DevicesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
        setTimeout(() => setRefreshing(false), 500) // Show refresh animation briefly
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="glass border-b border-white/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <HomeIcon />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tasmota Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Smart Device Management System
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Update</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => loadDevices(true)}
                disabled={refreshing}
                className={`p-2 rounded-lg border border-gray-200 bg-white/80 hover:bg-white transition-all duration-200 ${
                  refreshing ? 'animate-spin' : 'hover:scale-105'
                }`}
              >
                <RefreshIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-dark backdrop-blur-lg border-white/20 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Devices
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalDevices}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <DevicesIcon />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-dark backdrop-blur-lg border-white/20 animate-fade-in [animation-delay:100ms]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Online
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.onlineDevices}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-dark backdrop-blur-lg border-white/20 animate-fade-in [animation-delay:200ms]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active
                  </p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.activeDevices}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                  <EnergyIcon />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-dark backdrop-blur-lg border-white/20 animate-fade-in [animation-delay:300ms]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Power
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.totalConsumption.toFixed(1)}W
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <EnergyIcon />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Devices Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Connected Devices
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {devices.length} devices
              </Badge>
              <Badge variant="success" className="text-xs">
                {stats.onlineDevices} online
              </Badge>
            </div>
          </div>

          {devices.length === 0 ? (
            <Card className="glass-dark backdrop-blur-lg border-white/20">
              <CardContent className="p-12 text-center">
                <DevicesIcon />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No devices found
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Make sure your Tasmota devices are connected and running.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device, index) => (
                <div
                  key={device.device_id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
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