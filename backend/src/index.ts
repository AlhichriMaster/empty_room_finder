import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { parseTime, isTimeInRange, getDayOfWeek } from './utils'

const prisma = new PrismaClient()
const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/empty-rooms', async (req, res) => {
  const { 
    date, 
    time, 
    building,
    minCapacity,
    hasProjector 
  } = req.query
  
  try {
    // Base query conditions
    const whereConditions: any = {
      NOT: {
        OR: [
          { room: null },
          { room: 'LINE' },
          { building: null },
          { building: 'ON' },
        ]
      }
    }

    // Add building filter if provided
    if (building) {
      whereConditions.building = {
        contains: String(building)
      }
    }

    // Add capacity filter if provided
    if (minCapacity) {
      whereConditions.capacity = {
        gte: parseInt(String(minCapacity))
      }
    }

    // Add projector filter if provided
    if (hasProjector === 'true') {
      whereConditions.hasProjector = true
    }

    // Get busy rooms for the specified time
    const busyRooms = await prisma.course.findMany({
      where: {
        ...whereConditions,
        startDate: { lte: new Date(String(date)) },
        endDate: { gte: new Date(String(date)) },
        days: { contains: getDayOfWeek(new Date(String(date))) },
      },
      select: {
        building: true,
        room: true,
        startTime: true,
        endTime: true,
      }
    })

    // Get all rooms matching the filters
    const allRooms = await prisma.course.findMany({
      where: whereConditions,
      select: {
        building: true,
        room: true,
      },
      distinct: ['building', 'room']
    })

    // Filter out busy rooms
    const emptyRooms = allRooms.filter(room => {
      const roomIsBusy = busyRooms.some(busyRoom => 
        busyRoom.building === room.building &&
        busyRoom.room === room.room &&
        isTimeInRange(time as string, busyRoom.startTime!, busyRoom.endTime!)
      )
      return !roomIsBusy
    })

    res.json(emptyRooms)
  } catch (error) {
    console.error('Error finding empty rooms:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 