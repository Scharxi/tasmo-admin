import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasmotaAPI, TasmotaDevice, DeviceCategory, CreateCategoryRequest, UpdateCategoryRequest } from '@/lib/api'
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

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
}

// Hook für alle Geräte mit automatischen Updates
export function useDevices() {
  return useQuery({
    queryKey: deviceKeys.lists(),
    queryFn: () => tasmotaAPI.fetchDevices(),
    refetchInterval: 5000, // Alle 5 Sekunden für Echtzeitdaten
    staleTime: 1000, // Kürzere StaleTime für bessere Reaktivität
    refetchOnWindowFocus: false, // Verhindert Race Conditions
    refetchIntervalInBackground: true, // Weiter updaten auch wenn Tab inaktiv
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
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: deviceKeys.lists() })
      
      // Snapshot previous value for rollback
      const previousDevices = queryClient.getQueryData<TasmotaDevice[]>(deviceKeys.lists())
      
      // Optimistically update the UI immediately
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
      // Force immediate update with server response
      const currentDevices = queryClient.getQueryData<TasmotaDevice[]>(deviceKeys.lists())
      if (currentDevices && data) {
        const updatedDevices = currentDevices.map(device => 
          device.device_id === deviceId ? data : device
        )
        queryClient.setQueryData<TasmotaDevice[]>(deviceKeys.lists(), updatedDevices)
      }
    },
    onError: (err, deviceId, context) => {
      // Rollback on error
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

// UPDATED CATEGORY HOOKS

// Hook für alle Kategorien
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => tasmotaAPI.getCategories(),
    refetchInterval: 30000, // Weniger häufige Updates für Kategorien
    staleTime: 10000,
    refetchOnWindowFocus: false,
  })
}

// Hook für Geräte nach Kategorie
export function useDevicesByCategory(categoryId?: string) {
  return useQuery({
    queryKey: [...deviceKeys.lists(), { categoryId }],
    queryFn: () => tasmotaAPI.getDevicesByCategory(categoryId),
    refetchInterval: 5000,
    staleTime: 1000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: true,
  })
}

// Hook für Kategorie erstellen
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (category: CreateCategoryRequest) => tasmotaAPI.createCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

// Hook für Kategorie aktualisieren
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, updates }: { categoryId: string; updates: UpdateCategoryRequest }) => 
      tasmotaAPI.updateCategory(categoryId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}

// Hook für Kategorie löschen
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: string) => tasmotaAPI.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}

// Hook für Device-Kategorie aktualisieren
export function useUpdateDeviceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deviceId, categoryId, description }: { 
      deviceId: string; 
      categoryId: string; 
      description?: string;
    }) => tasmotaAPI.updateDeviceCategory(deviceId, categoryId, description),
    onSuccess: (updatedDevice) => {
      // Update device in cache
      const currentDevices = queryClient.getQueryData<TasmotaDevice[]>(deviceKeys.lists())
      if (currentDevices) {
        const updatedDevices = currentDevices.map(device => 
          device.device_id === updatedDevice.device_id ? updatedDevice : device
        )
        queryClient.setQueryData<TasmotaDevice[]>(deviceKeys.lists(), updatedDevices)
      }
      
      // Also invalidate to be safe
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}

// Hook für das Aktualisieren von Geräteeinstellungen (Display-Name und Beschreibung)
export function useUpdateDeviceSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deviceId, settings }: { 
      deviceId: string; 
      settings: { deviceName?: string; description?: string }; 
    }) => tasmotaAPI.updateDeviceSettings(deviceId, settings),
    onSuccess: (updatedDevice) => {
      // Update device in cache
      const currentDevices = queryClient.getQueryData<TasmotaDevice[]>(deviceKeys.lists())
      if (currentDevices) {
        const updatedDevices = currentDevices.map(device => 
          device.device_id === updatedDevice.device_id ? updatedDevice : device
        )
        queryClient.setQueryData<TasmotaDevice[]>(deviceKeys.lists(), updatedDevices)
      }
      
      // Also invalidate to be safe
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
} 