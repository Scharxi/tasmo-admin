'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, Edit, Save, Tag, Info, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background text-foreground p-0 shadow-lg duration-200 sm:rounded-lg max-h-[85vh] overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 text-foreground z-10">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left px-6 py-4 border-b", className)} {...props} />
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
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>(device.category?.id || 'none')
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState('general')
  
  const updateDeviceSettingsMutation = useUpdateDeviceSettings()
  const updateDeviceCategoryMutation = useUpdateDeviceCategory()
  const { data: categories = [] } = useCategories()

  // Reset form when device changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setDisplayName(device.device_name)
      setDescription(device.description || '')
      setSelectedCategoryId(device.category?.id || 'none')
      setError(null)
      setActiveTab('general')
    }
  }, [open, device])

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('Display-Name ist erforderlich')
      setActiveTab('general')
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
      if (selectedCategoryId !== (device.category?.id || 'none')) {
        updatedDevice = await updateDeviceCategoryMutation.mutateAsync({
          deviceId: device.device_id,
          categoryId: selectedCategoryId === 'none' ? '' : selectedCategoryId,
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

  const selectedCategory = selectedCategoryId === 'none' ? null : categories.find(cat => cat.id === selectedCategoryId)
  
  const hasChanges = displayName.trim() !== device.device_name || 
                    (description.trim() || '') !== (device.description || '') ||
                    selectedCategoryId !== (device.category?.id || 'none')
  
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
            <Settings className="h-5 w-5" />
            Geräteeinstellungen
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {device.device_id} • {device.ip_address}
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 pt-4 pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general" className="gap-2">
                  <Info className="h-4 w-4" />
                  Allgemein
                </TabsTrigger>
                <TabsTrigger value="category" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Kategorie
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
            <TabsContent value="general" className="px-6 py-4 space-y-4 m-0">
              <div className="space-y-4">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    Display-Name *
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value)
                      setError(null)
                    }}
                    placeholder="z.B. Küchen Kaffeemaschine"
                    maxLength={100}
                    className={error && !displayName.trim() ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Name für die Anzeige in der Benutzeroberfläche
                  </p>
                </div>

                
              </div>
            </TabsContent>

            <TabsContent value="category" className="px-6 py-4 space-y-4 m-0">
              <div className="space-y-4">
                {/* Current Category */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Label className="text-sm font-medium mb-2 block">Aktuelle Kategorie:</Label>
                  {device.category ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: device.category.color }}
                      />
                      <span className="font-medium">{device.category.name}</span>
                      {device.category.description && (
                        <span className="text-sm text-muted-foreground">
                          • {device.category.description}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Keine Kategorie zugewiesen</span>
                  )}
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Neue Kategorie wählen:</Label>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={setSelectedCategoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie auswählen">
                        {selectedCategory && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: selectedCategory.color }}
                            />
                            <span>{selectedCategory.name}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                          <span>Keine Kategorie</span>
                        </div>
                      </SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="flex-1">{category.name}</span>
                            {category.isDefault && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Standard
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                                     {selectedCategory?.description && (
                     <p className="text-xs text-muted-foreground mt-1">
                       {selectedCategory.description}
                     </p>
                   )}
                 </div>

                 {/* Device Description */}
                 <div className="space-y-2">
                   <Label htmlFor="description" className="text-sm font-medium">
                     Gerätebeschreibung
                   </Label>
                   <Textarea
                     id="description"
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     placeholder="Zusätzliche Informationen über dieses Gerät..."
                     maxLength={200}
                     rows={2}
                     className="resize-none"
                   />
                   <div className="flex justify-between items-center">
                     <p className="text-xs text-muted-foreground">
                       Optional: Notizen oder Details zu diesem Gerät
                     </p>
                     <span className="text-xs text-muted-foreground">
                       {description.length}/200
                     </span>
                   </div>
                 </div>
               </div>
            </TabsContent>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mb-4">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-4 border-t bg-muted/20">
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!hasChanges || !displayName.trim() || isLoading}
                className="flex-1 gap-2"
                size="sm"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Speichere...' : 'Änderungen speichern'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                size="sm"
              >
                Abbrechen
              </Button>
            </div>
            {hasChanges && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {displayName.trim() && selectedCategory 
                  ? `"${displayName.trim()}" wird der Kategorie "${selectedCategory.name}" zugeordnet`
                  : displayName.trim() 
                    ? `"${displayName.trim()}" wird gespeichert`
                    : 'Änderungen werden gespeichert'
                }
              </p>
            )}
          </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
} 