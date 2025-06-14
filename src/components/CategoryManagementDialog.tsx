'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, Plus, Edit, Trash2, Palette, Tag, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ColorPicker } from '@/components/ui/color-picker'
import { DeviceCategory, CreateCategoryRequest, UpdateCategoryRequest } from '@/lib/api'
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
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
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
    className={cn("text-lg font-semibold text-gray-900", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

interface CategoryManagementDialogProps {
  categories: DeviceCategory[]
  onCreateCategory: (category: CreateCategoryRequest) => Promise<void>
  onUpdateCategory: (categoryId: string, updates: UpdateCategoryRequest) => Promise<void>
  onDeleteCategory: (categoryId: string) => Promise<void>
  trigger?: React.ReactNode
}

export function CategoryManagementDialog({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  trigger
}: CategoryManagementDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<DeviceCategory | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  
  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    color: '#6B7280',
    description: ''
  })

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#6B7280',
      description: ''
    })
    setEditingCategory(null)
    setIsCreating(false)
  }

  const handleEdit = (category: DeviceCategory) => {
    setFormData({
      name: category.name,
      color: category.color,
      description: category.description || ''
    })
    setEditingCategory(category)
    setIsCreating(false)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreating(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return

    setIsLoading(true)
    try {
      if (isCreating) {
        await onCreateCategory({
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || undefined
        })
      } else if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || undefined
        })
      }
      resetForm()
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten?')) {
      return
    }

    setIsLoading(true)
    try {
      await onDeleteCategory(categoryId)
    } catch (error) {
      console.error('Error deleting category:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.name.trim().length > 0 && /^#[0-9A-F]{6}$/i.test(formData.color)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Palette className="h-4 w-4" />
            Kategorien verwalten
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Kategorie-Verwaltung
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Vorhandene Kategorien</h3>
              <Button
                onClick={handleCreate}
                size="sm"
                className="gap-2"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
                Neue Kategorie
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{category.name}</span>
                        {category.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Standard
                          </Badge>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-500 truncate">{category.description}</p>
                      )}
                      {'deviceCount' in category && (
                        <p className="text-xs text-gray-400">
                          {(category as any).deviceCount} Gerät{(category as any).deviceCount !== 1 ? 'e' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!category.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <h3 className="text-lg font-medium">
                {isCreating ? 'Neue Kategorie erstellen' : editingCategory ? 'Kategorie bearbeiten' : 'Kategorie auswählen'}
              </h3>
            </div>

            {(isCreating || editingCategory) ? (
              <div className="space-y-4">
                {/* Preview */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Vorschau:</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span className="font-medium">
                      {formData.name || 'Kategoriename'}
                    </span>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                  )}
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="z.B. Smart Home, Küchengeräte..."
                    maxLength={50}
                  />
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <Label>Farbe *</Label>
                  <ColorPicker
                    value={formData.color}
                    onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung (optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Beschreibung der Kategorie..."
                    maxLength={200}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isLoading}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? 'Speichere...' : 'Speichern'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={isLoading}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Palette className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Wählen Sie eine Kategorie zum Bearbeiten aus oder erstellen Sie eine neue.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 