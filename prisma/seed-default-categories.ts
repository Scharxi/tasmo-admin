import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultCategories = [
  {
    name: 'Allgemein',
    color: '#6B7280',
    icon: 'Settings',
    description: 'Allgemeine Geräte ohne spezielle Kategorie',
    isDefault: true
  },
  {
    name: 'Beleuchtung',
    color: '#F59E0B',
    icon: 'Lightbulb',
    description: 'Smart Lights, LED Strips, Lampen',
    isDefault: true
  },
  {
    name: 'Heizung',
    color: '#EF4444',
    icon: 'Flame',
    description: 'Heizungen, Thermostate, Klimaanlagen',
    isDefault: true
  },
  {
    name: 'Kleine Geräte',
    color: '#3B82F6',
    icon: 'Coffee',
    description: 'Küchengeräte, kleine Haushaltsgeräte',
    isDefault: true
  },
  {
    name: 'Große Geräte',
    color: '#8B5CF6',
    icon: 'Tv',
    description: 'Waschmaschine, Kühlschrank, große Elektronik',
    isDefault: true
  },
  {
    name: 'Elektronik',
    color: '#10B981',
    icon: 'Monitor',
    description: 'Computer, Router, Smart Home Hubs',
    isDefault: true
  },
  {
    name: 'Motoren',
    color: '#F97316',
    icon: 'Fan',
    description: 'Ventilatoren, Pumpen, Motorgeräte',
    isDefault: true
  },
  {
    name: 'Sicherheit',
    color: '#DC2626',
    icon: 'Shield',
    description: 'Kameras, Sensoren, Alarmanlagen',
    isDefault: true
  },
  {
    name: 'Unterhaltung',
    color: '#EC4899',
    icon: 'Music',
    description: 'TV, Stereo, Gaming-Geräte',
    isDefault: true
  }
]

async function seedDefaultCategories() {
  console.log('🌱 Creating default categories...')

  try {
    for (const category of defaultCategories) {
      // Check if category already exists
      const existing = await prisma.category.findUnique({
        where: { name: category.name }
      })

      if (!existing) {
        await prisma.category.create({
          data: category
        })
        console.log(`✅ Created category: ${category.name}`)
      } else {
        console.log(`⏭️  Category already exists: ${category.name}`)
      }
    }

    console.log('✨ Default categories seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding default categories:', error)
    throw error
  }
}

seedDefaultCategories()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 