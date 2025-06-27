'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, Edit, Save, FileText, Tag, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TasmotaDevice } from '@/lib/api'
import { useUpdateDeviceSettings, useUpdateDeviceCategory, useCategories } from '@/hooks/useDevices'
import { cn } from '@/lib/utils'

// Inline Dialog Components
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background text-foreground p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 text-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

interface DeviceSettingsDialogProps {
  device: TasmotaDevice
  trigger?: React.ReactNode
  onDeviceUpdated?: (device: TasmotaDevice) => void
}

export function DeviceSettingsDialog({ 
  device, 
  trigger, 
  onDeviceUpdated 
}: DeviceSettingsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [displayName, setDisplayName] = React.useState(device.device_name)
  const [description, setDescription] = React.useState(device.description || '')
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>(device.category?.id || '')
  const [error, setError] = React.useState<string | null>(null)
  
  const updateDeviceSettingsMutation = useUpdateDeviceSettings()
  const updateDeviceCategoryMutation = useUpdateDeviceCategory()
  const { data: categories = [] } = useCategories()

  // Reset form when device changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setDisplayName(device.device_name)
      setDescription(device.description || '')
      setSelectedCategoryId(device.category?.id || '')
      setError(null)
    }
  }, [open, device])

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('Display-Name ist erforderlich')
      return
    }

    setError(null)
    try {
      // Update device settings first
      let updatedDevice = await updateDeviceSettingsMutation.mutateAsync({
        deviceId: device.device_id,
        settings: {
          deviceName: displayName.trim(),
          description: description.trim() || undefined
        }
      })

      // Then update category if it changed
      if (selectedCategoryId !== (device.category?.id || '')) {
        updatedDevice = await updateDeviceCategoryMutation.mutateAsync({
          deviceId: device.device_id,
          categoryId: selectedCategoryId,
          description: description.trim() || undefined
        })
      }
      
      onDeviceUpdated?.(updatedDevice)
      setOpen(false)
    } catch (error) {
      console.error('Failed to update device:', error)
      setError(error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Geräteeinstellungen')
    }
  }

  const handleRemoveCategory = () => {
    setSelectedCategoryId('')
  }

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)
  
  const hasChanges = displayName.trim() !== device.device_name || 
                    (description.trim() || '') !== (device.description || '') ||
                    selectedCategoryId !== (device.category?.id || '')
  
  const isLoading = updateDeviceSettingsMutation.isPending || updateDeviceCategoryMutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Bearbeiten
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Geräteeinstellungen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Device Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded-full border border-border"
                style={{ 
                  backgroundColor: device.category?.color || (
                    device.status === 'offline' 
                      ? '#ef4444' 
                      : device.power_state
                        ? '#10b981'
                        : '#f59e0b'
                  )
                }}
              />
              <span className="font-medium text-foreground">
                {device.device_id}
              </span>
              <span className="text-sm text-muted-foreground">
                • {device.ip_address}
              </span>
            </div>
            {device.category && (
              <div className="text-sm text-muted-foreground">
                Kategorie: {device.category.name}
              </div>
            )}
          </div>

          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <h3 className="font-semibold">Grundlegende Informationen</h3>
            </div>
            
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display-Name *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  setError(null)
                }}
                placeholder="z.B. Küchen Kaffeemaschine"
                maxLength={100}
                className={error && !displayName.trim() ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Dies ist der Name, der in der Benutzeroberfläche angezeigt wird
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Zusätzliche Informationen über dieses Gerät..."
                maxLength={500}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Kurze Beschreibung oder Notizen zu diesem Gerät
                </p>
                <span className="text-xs text-muted-foreground">
                  {description.length}/500
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Category Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <h3 className="font-semibold">Kategorie</h3>
            </div>

            {/* Current Category Display */}
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium text-foreground mb-2 block">Aktuell:</Label>
              {device.category ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: device.category.color }}
                  />
                  <span className="font-medium text-foreground">{device.category.name}</span>
                  {device.category.description && (
                    <span className="text-sm text-muted-foreground">- {device.category.description}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-muted-foreground border border-border" />
                  <span className="text-muted-foreground">Keine Kategorie zugewiesen</span>
                </div>
              )}
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Kategorie auswählen:</Label>
              <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 relative overflow-hidden",
                      selectedCategoryId === category.id
                        ? "bg-primary/10 border-2 border-primary shadow-md"
                        : "bg-muted hover:bg-muted/80 border border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium transition-colors duration-300",
                          selectedCategoryId === category.id ? "text-foreground font-semibold" : "text-foreground"
                        )}>
                          {category.name}
                        </span>
                        {category.isDefault && (
                          <Badge variant={selectedCategoryId === category.id ? "default" : "secondary"} className="text-xs">
                            Standard
                          </Badge>
                        )}
                      </div>
                      {category.description && (
                        <p className={cn(
                          "text-sm truncate transition-colors duration-300",
                          selectedCategoryId === category.id ? "text-muted-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {category.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Remove Category Option */}
            {selectedCategoryId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveCategory}
                className="text-muted-foreground hover:text-foreground"
              >
                Kategorie entfernen
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Preview */}
          {hasChanges && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Label className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2 block flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Vorschau:
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {selectedCategory ? (
                    <>
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: selectedCategory.color }}
                      />
                      <span className="font-medium text-blue-900 dark:text-blue-200">{selectedCategory.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full bg-muted-foreground border border-border" />
                      <span className="text-blue-700 dark:text-blue-300">Keine Kategorie</span>
                    </>
                  )}
                </div>
                <p className="font-medium text-blue-900 dark:text-blue-200">
                  {displayName.trim() || 'Unbenanntes Gerät'}
                </p>
                {description.trim() && (
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {description.trim()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!hasChanges || !displayName.trim() || isLoading}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Speichere...' : 'Speichern'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 