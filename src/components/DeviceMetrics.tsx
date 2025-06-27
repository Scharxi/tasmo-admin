'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeviceMetrics } from '@/hooks/useDevices'
import { Skeleton } from './ui/skeleton'
import { useState, useCallback, useEffect } from 'react'
import { Loader2, Zap, AlertCircle } from 'lucide-react'

// Icons für Messwerte
const VoltageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)

const CurrentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
  </svg>
)

const PowerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)

const EnergyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.012-.529 1.348A109.58 109.58 0 0112 18.75c-2.305 0-4.584-.124-6.826-.364-.423-.336-.651-.849-.529-1.348L7.25 4.97" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const WarningIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

interface DeviceMetricsProps {
  deviceId: string
  className?: string
}

interface MetricsData {
  power: number
  apparent_power: number
  reactive_power: number
  factor: number
  voltage: number
  current: number
  total: number
  today: number
  yesterday: number
  has_energy_monitoring?: boolean
  device_online?: boolean
  last_update: string
  message?: string
}

export function DeviceMetrics({ deviceId, className = '' }: DeviceMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData>({
    voltage: 0,
    current: 0,
    power: 0,
    apparent_power: 0,
    reactive_power: 0,
    factor: 0,
    today: 0,
    yesterday: 0,
    total: 0,
    last_update: new Date().toISOString(),
    message: undefined
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/devices/${deviceId}/metrics`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setMetrics(data)
      } catch (err) {
        console.error('Error fetching device metrics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    
    // Refresh metrics every 10 seconds
    const interval = setInterval(fetchMetrics, 10000)
    return () => clearInterval(interval)
  }, [deviceId])

  if (loading) {
    return (
      <Card className={`bg-white/90 dark:bg-gray-800/90 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading metrics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-white/90 dark:bg-gray-800/90 rounded-lg border border-red-200 dark:border-red-800 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasEnergyMonitoring = metrics.has_energy_monitoring !== false

  return (
    <Card className={`bg-white/90 dark:bg-gray-800/90 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
              <Zap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            Detaillierte Messwerte
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
        </div>
        
        {metrics.message && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {metrics.message}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3 p-3 pt-0">
        {/* Primary Measurements Grid */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          {/* Spannung */}
          <div className="text-center">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-100 dark:border-yellow-800">
              <VoltageIcon />
              <div className="mt-1">
                <div className="font-bold text-gray-900 dark:text-gray-100">
                  {metrics.voltage?.toFixed(1) || '0.0'}
                </div>
                <div className="text-gray-500 dark:text-gray-400">V</div>
              </div>
            </div>
          </div>

          {/* Strom */}
          <div className="text-center">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
              <CurrentIcon />
              <div className="mt-1">
                <div className="font-bold text-gray-900 dark:text-gray-100">
                  {metrics.current?.toFixed(3) || '0.000'}
                </div>
                <div className="text-gray-500 dark:text-gray-400">A</div>
              </div>
            </div>
          </div>

          {/* Leistung */}
          <div className="text-center">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-800">
              <PowerIcon />
              <div className="mt-1">
                <div className="font-bold text-gray-900 dark:text-gray-100">
                  {metrics.power?.toFixed(1) || '0.0'}
                </div>
                <div className="text-gray-500 dark:text-gray-400">W</div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Power Metrics (wenn verfügbar) */}
        {hasEnergyMonitoring && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {metrics.apparent_power?.toFixed(1) || '0.0'} VA
              </div>
              <div className="text-gray-500 dark:text-gray-400">Scheinleistung</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {metrics.reactive_power?.toFixed(1) || '0.0'} var
              </div>
              <div className="text-gray-500 dark:text-gray-400">Blindleistung</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {metrics.factor?.toFixed(2) || '0.00'}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Leistungsfaktor</div>
            </div>
          </div>
        )}

        {/* Energy Consumption Summary */}
        {(metrics.today > 0 || metrics.yesterday > 0 || hasEnergyMonitoring) && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center bg-emerald-50 dark:bg-emerald-900/30 rounded p-2">
                <div className="font-semibold text-emerald-900 dark:text-emerald-100">
                  {((metrics.today || 0) / 1000).toFixed(2)} kWh
                </div>
                <div className="text-emerald-600 dark:text-emerald-400">Heute</div>
              </div>
              <div className="text-center bg-gray-50 dark:bg-gray-700 rounded p-2">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {((metrics.yesterday || 0) / 1000).toFixed(2)} kWh
                </div>
                <div className="text-gray-600 dark:text-gray-400">Gestern</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 