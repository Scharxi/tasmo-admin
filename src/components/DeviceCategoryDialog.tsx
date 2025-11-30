'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, Tag, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DeviceCategory, TasmotaDevice } from '@/lib/api'
import { useCategories, useUpdateDeviceCategory } from '@/hooks/useDevices'
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
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white dark:bg-slate-900 text-foreground p-6 shadow-lg duration-200 sm:rounded-lg",
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

interface DeviceCategoryDialogProps {
  device: TasmotaDevice
  trigger?: React.ReactNode
  onCategoryUpdated?: (device: TasmotaDevice) => void
}

export function DeviceCategoryDialog({ 
  device, 
  trigger, 
  onCategoryUpdated 
}: DeviceCategoryDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>(device.category?.id || '')
  const [description, setDescription] = React.useState(device.description || '')
  const [isLoading, setIsLoading] = React.useState(false)
  
  const { data: categories = [] } = useCategories()
  const updateDeviceCategoryMutation = useUpdateDeviceCategory()

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)

  const handleSubmit = async () => {
    if (!selectedCategoryId) return

    setIsLoading(true)
    try {
      const updatedDevice = await updateDeviceCategoryMutation.mutateAsync({
        deviceId: device.device_id,
        categoryId: selectedCategoryId,
        description: description.trim() || undefined
      })
      
      onCategoryUpdated?.(updatedDevice)
      setOpen(false)
    } catch (error) {
      console.error('Failed to update device category:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCategory = async () => {
    setIsLoading(true)
    try {
      // To remove category, we can set categoryId to empty string (if API supports it)
      // or we need to implement a separate endpoint for this
      const updatedDevice = await updateDeviceCategoryMutation.mutateAsync({
        deviceId: device.device_id,
        categoryId: '', // This might need API adjustment
        description: description.trim() || undefined
      })
      
      onCategoryUpdated?.(updatedDevice)
      setOpen(false)
    } catch (error) {
      console.error('Failed to remove device category:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Tag className="h-4 w-4" />
            Kategorie
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Kategorie für {device.device_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Category Display */}
          <div className="p-4 bg-muted rounded-lg">
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
            <Label>Kategorie auswählen</Label>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 text-left relative overflow-hidden group cursor-pointer",
                    selectedCategoryId === category.id
                      ? 'border-primary/30 bg-primary/5 shadow-lg shadow-primary/20 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent before:translate-x-full before:animate-shimmer'
                      : 'border-border hover:border-primary/20 hover:shadow-md hover:bg-muted/50 hover:scale-[1.02] hover:shadow-primary/10'
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border border-border flex-shrink-0 transition-all duration-300",
                      selectedCategoryId === category.id && "ring-2 ring-primary/30 shadow-sm"
                    )}
                    style={{ 
                      backgroundColor: category.color,
                      boxShadow: selectedCategoryId === category.id 
                        ? `0 0 12px ${category.color}40` 
                        : undefined 
                    }}
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Zusätzliche Beschreibung für dieses Gerät..."
              maxLength={200}
            />
          </div>

          {/* Preview */}
          {selectedCategory && (
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium text-foreground mb-2 block">Vorschau:</Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <span className="font-medium text-foreground">{selectedCategory.name}</span>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!selectedCategoryId || isLoading}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Speichere...' : 'Speichern'}
            </Button>
            {device.category && (
              <Button
                variant="outline"
                onClick={handleRemoveCategory}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Entfernen
              </Button>
            )}
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