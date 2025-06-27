'use client'

import * as React from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Palette, Check, RotateCcw, Pipette } from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange  
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#6B7280', // Gray
  '#374151', // Dark Gray
]

// Recent colors storage key
const RECENT_COLORS_KEY = 'colorPicker_recentColors'

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempColor, setTempColor] = React.useState(value)
  const [recentColors, setRecentColors] = React.useState<string[]>([])

  // Load recent colors from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_COLORS_KEY)
      if (stored) {
        setRecentColors(JSON.parse(stored))
      }
    } catch (error) {
      console.warn('Failed to load recent colors:', error)
    }
  }, [])

  // Update temp color when value changes
  React.useEffect(() => {
    setTempColor(value)
  }, [value])

  const saveToRecentColors = (color: string) => {
    const newRecentColors = [color, ...recentColors.filter(c => c !== color)].slice(0, 8)
    setRecentColors(newRecentColors)
    try {
      localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(newRecentColors))
    } catch (error) {
      console.warn('Failed to save recent colors:', error)
    }
  }

  const handleColorChange = (color: string) => {
    setTempColor(color)
  }

  const handleApply = () => {
    onChange(tempColor)
    saveToRecentColors(tempColor)
    setIsOpen(false)
  }

  const handlePresetClick = (color: string) => {
    setTempColor(color)
    onChange(color)
    saveToRecentColors(color)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempColor(value)
    setIsOpen(false)
  }

  const handleReset = () => {
    const defaultColor = '#6B7280'
    setTempColor(defaultColor)
    onChange(defaultColor)
    saveToRecentColors(defaultColor)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Color Display Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-3 h-10 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="w-6 h-6 rounded-md border-2 border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <div className="flex flex-col items-start flex-1">
          <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{value.toUpperCase()}</span>
        </div>
        <Palette className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      </Button>

      {/* Color Picker Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 w-80 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Pipette className="h-4 w-4" />
              Farbwähler
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-6 w-6 p-0"
              title="Standardfarbe"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>

          {/* Main Color Picker */}
          <div className="space-y-4">
            {/* Color Wheel/Picker */}
            <div className="flex flex-col items-center">
              <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <HexColorPicker
                  color={tempColor}
                  onChange={handleColorChange}
                  style={{
                    width: '180px',
                    height: '120px'
                  }}
                />
              </div>
              
              {/* Color Preview and Input */}
              <div className="flex items-center gap-2 w-full">
                <div
                  className="w-8 h-8 rounded-md border-2 border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: tempColor }}
                />
                <div className="flex-1">
                  <HexColorInput
                    color={tempColor}
                    onChange={handleColorChange}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    prefixed
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            {/* Preset Colors */}
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">Vordefinierte Farben</h5>
              <div className="grid grid-cols-9 gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'w-6 h-6 rounded border-2 transition-all duration-200 hover:scale-110 hover:shadow-md relative',
                      tempColor.toLowerCase() === color.toLowerCase()
                        ? 'border-gray-900 dark:border-gray-300 shadow-lg' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handlePresetClick(color)}
                    title={color}
                  >
                    {tempColor.toLowerCase() === color.toLowerCase() && (
                      <Check className="h-3 w-3 text-white absolute inset-0 m-auto drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Colors */}
            {recentColors.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">Zuletzt verwendet</h5>
                <div className="flex gap-1 flex-wrap">
                  {recentColors.map((color, index) => (
                    <button
                      key={`${color}-${index}`}
                      type="button"
                      className={cn(
                        'w-5 h-5 rounded border-2 transition-all duration-200 hover:scale-110 hover:shadow-md relative',
                        tempColor.toLowerCase() === color.toLowerCase()
                          ? 'border-gray-900 dark:border-gray-300 shadow-lg' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => handlePresetClick(color)}
                      title={color}
                    >
                      {tempColor.toLowerCase() === color.toLowerCase() && (
                        <Check className="h-2 w-2 text-white absolute inset-0 m-auto drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleApply}
                size="sm"
                className="flex-1 gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <Check className="h-3 w-3" />
                Übernehmen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="px-3"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleCancel}
        />
      )}
    </div>
  )
} 