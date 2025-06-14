import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format').optional(),
  icon: z.string().optional(),
  description: z.string().optional()
}).strict()

// PUT /api/categories/[categoryId] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const body = await request.json()
    const { categoryId } = await params
    
    // Validate input
    const validatedData = updateCategorySchema.parse(body)
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    })
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Check if trying to update name and it already exists
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameExists = await prisma.category.findUnique({
        where: { name: validatedData.name }
      })
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 409 }
        )
      }
    }
    
    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: validatedData
    })
    
    // Transform response
    const transformedCategory = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      color: updatedCategory.color,
      icon: updatedCategory.icon,
      description: updatedCategory.description,
      isDefault: updatedCategory.isDefault,
      createdAt: updatedCategory.createdAt.toISOString(),
      updatedAt: updatedCategory.updatedAt.toISOString()
    }
    
    return NextResponse.json(transformedCategory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[categoryId] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { devices: true }
        }
      }
    })
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Prevent deletion of default categories
    if (existingCategory.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default categories' },
        { status: 403 }
      )
    }
    
    // Check if category has devices
    if (existingCategory._count.devices > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${existingCategory._count.devices} assigned devices` },
        { status: 409 }
      )
    }
    
    // Delete category
    await prisma.category.delete({
      where: { id: categoryId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
} 