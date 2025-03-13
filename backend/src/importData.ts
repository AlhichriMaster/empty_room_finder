import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

interface CSVRow {
  crn: string
  status: string
  course_code: string
  section: string
  building: string
  room: string
  start_date: string
  end_date: string
  days: string
  start_time: string
  end_time: string
}

async function importData() {
  try {
    // Clear existing data
    await prisma.course.deleteMany()

    const dataDir = path.join(__dirname, '../../class_schedules')
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'))

    for (const file of files) {
      const results: CSVRow[] = []

      await new Promise((resolve, reject) => {
        fs.createReadStream(path.join(dataDir, file))
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject)
      })

      for (const row of results) {
        await prisma.course.create({
          data: {
            crn: row.crn,
            status: row.status,
            courseCode: row.course_code,
            section: row.section,
            building: row.building || null,
            room: row.room || null,
            startDate: new Date(row.start_date),
            endDate: new Date(row.end_date),
            days: row.days || null,
            startTime: row.start_time || null,
            endTime: row.end_time || null,
          },
        })
      }

      console.log(`Imported ${results.length} rows from ${file}`)
    }

    console.log('Data import completed successfully')
  } catch (error) {
    console.error('Error importing data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importData() 