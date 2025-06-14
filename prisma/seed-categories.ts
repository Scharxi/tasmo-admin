import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCategories() {
  console.log('🌱 Seeding device categories...')

  try {
    // Get all devices
    const devices = await prisma.device.findMany()
    
    for (const device of devices) {
      let category = 'GENERAL'
      let room = null
      let description = null
      
      const name = device.deviceName.toLowerCase()
      
      // Assign categories based on device names
      if (name.includes('light') || name.includes('lamp') || name.includes('led') || name.includes('bulb')) {
        category = 'LIGHTING'
        if (name.includes('kitchen')) room = 'Küche'
        if (name.includes('living')) room = 'Wohnzimmer'
        if (name.includes('bedroom')) room = 'Schlafzimmer'
        if (name.includes('bathroom')) room = 'Badezimmer'
        description = 'Smart LED Beleuchtung'
      } 
      else if (name.includes('heater') || name.includes('heating') || name.includes('thermostat')) {
        category = 'HEATING'
        if (name.includes('kitchen')) room = 'Küche'
        if (name.includes('living')) room = 'Wohnzimmer'
        if (name.includes('bedroom')) room = 'Schlafzimmer'
        description = 'Intelligente Heizungssteuerung'
      }
      else if (name.includes('tv') || name.includes('stereo') || name.includes('speaker') || name.includes('sound')) {
        category = 'ENTERTAINMENT'
        if (name.includes('living')) room = 'Wohnzimmer'
        if (name.includes('kitchen')) room = 'Küche'
        description = 'Unterhaltungsgerät'
      }
      else if (name.includes('kitchen') || name.includes('coffee') || name.includes('kettle') || name.includes('microwave')) {
        category = 'APPLIANCE_SMALL'
        room = 'Küche'
        description = 'Küchengerät'
      }
      else if (name.includes('washing') || name.includes('dryer') || name.includes('dishwasher')) {
        category = 'APPLIANCE_LARGE'
        if (name.includes('kitchen')) room = 'Küche'
        else room = 'Hauswirtschaft'
        description = 'Haushaltsgroßgerät'
      }
      else if (name.includes('computer') || name.includes('router') || name.includes('modem') || name.includes('pc')) {
        category = 'ELECTRONICS'
        if (name.includes('office')) room = 'Büro'
        else room = 'Wohnzimmer'
        description = 'Elektronisches Gerät'
      }
      else if (name.includes('fan') || name.includes('ventilator') || name.includes('pump')) {
        category = 'MOTOR'
        description = 'Motor- oder Lüftergerät'
      }
      else if (name.includes('router') || name.includes('modem') || name.includes('server')) {
        category = 'ALWAYS_ON'
        description = 'Dauerhaft aktives Gerät'
      }
      else if (name.includes('camera') || name.includes('sensor') || name.includes('alarm')) {
        category = 'SECURITY'
        description = 'Sicherheitsgerät'
      }
      
      // Extract room from device name if not already set
      if (!room) {
        if (name.includes('kitchen')) room = 'Küche'
        else if (name.includes('living')) room = 'Wohnzimmer'
        else if (name.includes('bedroom')) room = 'Schlafzimmer'
        else if (name.includes('bathroom')) room = 'Badezimmer'
        else if (name.includes('office')) room = 'Büro'
        else if (name.includes('garage')) room = 'Garage'
        else if (name.includes('garden')) room = 'Garten'
      }
      
      // Update device with category information
      await prisma.device.update({
        where: { id: device.id },
        data: {
          category: category as any,
          room,
          description,
        },
      })
      
      console.log(`✅ Updated ${device.deviceName}: ${category}${room ? ` (${room})` : ''}`)
    }
    
    console.log('✨ Device categories seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  }
}

seedCategories()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 