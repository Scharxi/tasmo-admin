import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  icon: z.string().optional(),
  description: z.string().optional()
})

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { isDefault: 'desc' }, // Default categories first
        { createdAt: 'asc' }
      ],
      include: {
        _count: {
          select: { devices: true }
        }
      }
    })

    // Transform to match frontend interface
    const transformedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      description: category.description,
      isDefault: category.isDefault,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      deviceCount: category._count.devices
    }))

    return NextResponse.json(transformedCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createCategorySchema.parse(body)
    
    // Check if category name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: validatedData.name }
    })
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    }
    
    // Create category
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        isDefault: false // User-created categories are never default
      }
    })
    
    // Transform response
    const transformedCategory = {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      description: category.description,
      isDefault: category.isDefault,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    }
    
    return NextResponse.json(transformedCategory, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
} 