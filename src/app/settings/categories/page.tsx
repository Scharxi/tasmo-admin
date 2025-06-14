'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  Palette, 
  Tag, 
  Save, 
  X, 
  AlertTriangle,
  Settings,
  Grid3X3,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ColorPicker } from '@/components/ui/color-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useDevices'
import { DeviceCategory, CreateCategoryRequest, UpdateCategoryRequest } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCategory, setEditingCategory] = useState<DeviceCategory | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280',
    description: ''
  })

  // Hooks
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsLoading(true)
    try {
      if (isCreating) {
        await createCategoryMutation.mutateAsync({
          name: formData.name.trim(),
          color: formData.color,
          description: formData.description.trim() || undefined
        })
        setNotification({
          type: 'success',
          message: `Kategorie "${formData.name}" wurde erfolgreich erstellt.`
        })
      } else if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          categoryId: editingCategory.id,
          updates: {
            name: formData.name.trim(),
            color: formData.color,
            description: formData.description.trim() || undefined
          }
        })
        setNotification({
          type: 'success',
          message: `Kategorie "${formData.name}" wurde erfolgreich aktualisiert.`
        })
      }
      resetForm()
    } catch (error) {
      console.error('Error saving category:', error)
      setNotification({
        type: 'error',
        message: 'Fehler beim Speichern der Kategorie. Bitte versuchen Sie es erneut.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (category: DeviceCategory) => {
    const deviceCount = (category as any).deviceCount || 0
    const warningMessage = deviceCount > 0 
      ? `Achtung: Diese Kategorie ist ${deviceCount} Gerät${deviceCount !== 1 ? 'en' : ''} zugewiesen.\n\nSind Sie sicher, dass Sie die Kategorie "${category.name}" löschen möchten?\n\nDie Geräte werden auf "Ohne Kategorie" zurückgesetzt.`
      : `Sind Sie sicher, dass Sie die Kategorie "${category.name}" löschen möchten?`
    
    if (!confirm(warningMessage)) {
      return
    }

    setIsLoading(true)
    try {
      await deleteCategoryMutation.mutateAsync(category.id)
      setNotification({
        type: 'success',
        message: `🗑️ Kategorie "${category.name}" wurde erfolgreich gelöscht.`
      })
    } catch (error) {
      console.error('Error deleting category:', error)
      setNotification({
        type: 'error',
        message: 'Fehler beim Löschen der Kategorie. Bitte versuchen Sie es erneut.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.name.trim().length > 0 && /^#[0-9A-F]{6}$/i.test(formData.color)

  // Clear notification after 5 seconds
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="modern-spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-white/50">
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Kategorien-Verwaltung
              </h1>
              <p className="text-gray-600 mt-1">
                Erstellen und verwalten Sie Kategorien für Ihre Tasmota-Geräte
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreate}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              Neue Kategorie
            </Button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <Alert 
            variant={notification.type === 'error' ? 'destructive' : 'default'} 
            className={cn(
              "mb-6",
              notification.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            )}
          >
            {notification.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Tag className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={notification.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {notification.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">
                      Kategorien ({filteredCategories.length})
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Kategorien suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64 bg-white/50 border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className="group bg-white/80 rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className="w-6 h-6 rounded-lg border-2 border-white shadow-sm flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: category.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {category.name}
                              </h3>
                              {category.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  Standard
                                </Badge>
                              )}
                            </div>
                            {category.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {category.description}
                              </p>
                            )}
                            {'deviceCount' in category && (
                              <p className="text-xs text-gray-500">
                                {(category as any).deviceCount} Gerät{(category as any).deviceCount !== 1 ? 'e' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                                                 <div className="flex items-center gap-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleEdit(category)}
                             disabled={isLoading}
                             className="h-10 w-10 p-0 hover:bg-blue-50 hover:text-blue-600 text-gray-600 hover:scale-105 transition-all duration-200"
                             title="Kategorie bearbeiten"
                           >
                             <Edit3 className="h-5 w-5" />
                           </Button>
                           {/* Alle Kategorien können gelöscht werden, außer "Allgemein" */}
                           {category.name === 'Allgemein' ? (
                             <Button
                               variant="ghost"
                               size="sm"
                               disabled={true}
                               className="h-10 w-10 p-0 text-gray-400 cursor-not-allowed"
                               title="Die Allgemein-Kategorie kann nicht gelöscht werden"
                             >
                               <Trash2 className="h-5 w-5" />
                             </Button>
                           ) : (
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleDelete(category)}
                               disabled={isLoading}
                               className="h-10 w-10 p-0 hover:bg-red-100 hover:text-red-700 text-red-500 hover:scale-105 transition-all duration-200 border border-transparent hover:border-red-200"
                               title={category.isDefault ? "Standard-Kategorie löschen" : "Kategorie löschen"}
                             >
                               <Trash2 className="h-5 w-5" />
                             </Button>
                           )}
                         </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredCategories.length === 0 && (
                    <div className="col-span-2 text-center py-12">
                      <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-2">
                        {searchTerm ? 'Keine Kategorien gefunden' : 'Noch keine Kategorien vorhanden'}
                      </p>
                      <p className="text-sm text-gray-400 mb-4">
                        {searchTerm ? 'Versuchen Sie einen anderen Suchbegriff' : 'Erstellen Sie Ihre erste Kategorie'}
                      </p>
                      {!searchTerm && (
                        <Button
                          onClick={handleCreate}
                          variant="outline"
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Kategorie erstellen
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Panel */}
          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-blue-600" />
                    {isCreating ? 'Neue Kategorie' : editingCategory ? 'Kategorie bearbeiten' : 'Kategorie auswählen'}
                  </CardTitle>
                  {(isCreating || editingCategory) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {isCreating 
                    ? 'Erstellen Sie eine neue Kategorie für Ihre Geräte'
                    : editingCategory 
                    ? 'Bearbeiten Sie die ausgewählte Kategorie'
                    : 'Wählen Sie eine Kategorie zum Bearbeiten aus oder erstellen Sie eine neue'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(isCreating || editingCategory) ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Preview */}
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Vorschau:
                      </Label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-white shadow-md"
                          style={{ backgroundColor: formData.color }}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {formData.name || 'Kategoriename'}
                          </div>
                          {formData.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {formData.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="z.B. Smart Home, Küchengeräte..."
                        maxLength={50}
                        className="bg-white/50 border-gray-300 focus:border-blue-500"
                        required
                      />
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Farbe *
                      </Label>
                      <ColorPicker
                        value={formData.color}
                        onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Beschreibung (optional)
                      </Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Beschreibung der Kategorie..."
                        maxLength={200}
                        className="bg-white/50 border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={!isFormValid || isLoading}
                        className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4" />
                        {isLoading ? 'Speichere...' : 'Speichern'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isLoading}
                        className="px-6"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-4">
                      Wählen Sie eine Kategorie zum Bearbeiten aus oder erstellen Sie eine neue.
                    </p>
                    <Button
                      onClick={handleCreate}
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Neue Kategorie erstellen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 