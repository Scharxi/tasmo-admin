import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get category counts from database using the correct field name
    const categoryStats = await prisma.device.groupBy({
      by: ['categoryId'],
      _count: {
        categoryId: true,
      },
      where: {
        categoryId: {
          not: null
        }
      }
    })

    // Get category details for each categoryId
    const categoryIds = categoryStats.map(stat => stat.categoryId).filter(Boolean) as string[]
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds
        }
      }
    })

    // Format response with category details
    const stats = categoryStats.map(stat => {
      const category = categories.find(cat => cat.id === stat.categoryId)
      return {
        categoryId: stat.categoryId,
        categoryName: category?.name || 'Unknown',
        categoryColor: category?.color || '#6B7280',
        count: stat._count.categoryId || 0,
      }
    })

    // Also add count for uncategorized devices
    const uncategorizedCount = await prisma.device.count({
      where: {
        categoryId: null
      }
    })

    if (uncategorizedCount > 0) {
      stats.push({
        categoryId: null,
        categoryName: 'Ohne Kategorie',
        categoryColor: '#6B7280',
        count: uncategorizedCount
      })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch category stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category statistics' },
      { status: 500 }
    )
  }
} 