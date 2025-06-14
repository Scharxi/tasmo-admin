import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasmotaAPI, TasmotaDevice } from '@/lib/api'
import { useEffect } from 'react'

// Query Keys für bessere Organisation
export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...deviceKeys.lists(), { filters }] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
  metrics: (id: string) => [...deviceKeys.detail(id), 'metrics'] as const,
}

// Hook für alle Geräte mit automatischen Updates
export function useDevices() {
  return useQuery({
    queryKey: deviceKeys.lists(),
    queryFn: () => tasmotaAPI.fetchDevices(),
    refetchInterval: 5000, // Alle 5 Sekunden für Echtzeitdaten
    staleTime: 2000, // Daten sind 2 Sekunden lang frisch
  })
}

// Hook für ein spezifisches Gerät
export function useDevice(deviceId: string) {
  return useQuery({
    queryKey: deviceKeys.detail(deviceId),
    queryFn: () => tasmotaAPI.fetchDeviceInfo(deviceId),
    enabled: !!deviceId,
    refetchInterval: 3000, // Häufigere Updates für einzelne Geräte
  })
}

// Hook für Gerätemetriken (Messwerte)
export function useDeviceMetrics(deviceId: string) {
  return useQuery({
    queryKey: deviceKeys.metrics(deviceId),
    queryFn: () => tasmotaAPI.fetchDeviceMetrics(deviceId),
    enabled: !!deviceId,
    refetchInterval: 2000, // Sehr häufig für Messwerte
    staleTime: 1000,
  })
}

// Hook für Power Toggle mit verbesserter State-Synchronisation
export function useToggleDevicePower() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deviceId: string) => tasmotaAPI.toggleDevicePower(deviceId),
    onMutate: async (deviceId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: deviceKeys.lists() })
      
      // Snapshot previous value
      const previousDevices = queryClient.getQueryData<TasmotaDevice[]>(deviceKeys.lists())
      
      // Optimistically update
      if (previousDevices) {
        const targetDevice = previousDevices.find(d => d.device_id === deviceId)
        if (targetDevice) {
          const newPowerState = !targetDevice.power_state
          
          const updatedDevices = previousDevices.map((device) => {
            if (device.device_id === deviceId) {
              return { ...device, power_state: newPowerState }
            }
            return device
          })
          
          queryClient.setQueryData<TasmotaDevice[]>(deviceKeys.lists(), updatedDevices)
        }
      }
      
      return { previousDevices, deviceId }
    },
    onSuccess: (data, deviceId, context) => {
      // Always use server response as the source of truth
      const currentDevices = queryClient.getQueryData<TasmotaDevice[]>(deviceKeys.lists())
      if (currentDevices) {
        const updatedDevices = currentDevices.map(device => 
          device.device_id === deviceId ? data : device
        )
        queryClient.setQueryData<TasmotaDevice[]>(deviceKeys.lists(), updatedDevices)
      }
    },
    onError: (err, deviceId, context) => {
      // Rollback bei Fehler
      if (context?.previousDevices) {
        queryClient.setQueryData(deviceKeys.lists(), context.previousDevices)
      }
    },
  })
}

// Hook für Gerät hinzufügen
export function useAddDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => tasmotaAPI.addDevice(data),
    onSuccess: () => {
      // Invalidate und refetch devices nach dem Hinzufügen
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}

// Hook für Gerät löschen
export function useDeleteDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete device')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidate und refetch devices nach dem Löschen
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}

// Hook für Device Discovery
export function useDiscoverDevices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => tasmotaAPI.discoverDevices(),
    onSuccess: () => {
      // Nach Discovery die Device-Liste aktualisieren
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}

// Hook für Dashboard Statistiken
export function useDashboardStats() {
  const { data: devices = [] } = useDevices()
  
  const stats = {
    totalDevices: devices.length,
    onlineDevices: devices.filter(d => d.status === 'online').length,
    activeDevices: devices.filter(d => d.power_state && d.status === 'online').length,
    totalConsumption: devices
      .filter(d => d.status === 'online')
      .reduce((sum, d) => sum + d.energy_consumption, 0),
    totalEnergy: devices
      .filter(d => d.status === 'online')
      .reduce((sum, d) => sum + d.total_energy, 0),
    averageVoltage: devices.filter(d => d.status === 'online' && d.voltage && d.voltage > 0)
      .reduce((sum, d, _, arr) => sum + (d.voltage || 0) / arr.length, 0),
    averageCurrent: devices.filter(d => d.status === 'online' && d.current && d.current > 0)
      .reduce((sum, d, _, arr) => sum + (d.current || 0) / arr.length, 0),
  }
  
  return stats
}

// Hook for device state synchronization
export function useDeviceStateSynchronization() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // Force an immediate refresh when the app starts to ensure we have accurate states
    queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
  }, [queryClient])
  
  return {
    forceRefresh: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    }
  }
} 