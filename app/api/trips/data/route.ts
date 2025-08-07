import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const q1Path = join(process.cwd(), 'data', 'indego-trips-2025-q1.csv')
    const q2Path = join(process.cwd(), 'data', 'indego-trips-2025-q2.csv')
    
    const [q1Data, q2Data] = await Promise.all([
      readFile(q1Path, 'utf-8'),
      readFile(q2Path, 'utf-8')
    ])
    
    // Get headers from Q1 file (first line)
    const q1Lines = q1Data.split('\n')
    const q2Lines = q2Data.split('\n')
    
    // Combine: Q1 headers + Q1 data + Q2 data (skip Q2 headers)
    const combinedData = [
      q1Lines[0], // headers
      ...q1Lines.slice(1), // Q1 data
      ...q2Lines.slice(1)  // Q2 data (skip headers)
    ].join('\n')
    
    return new NextResponse(combinedData, {
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error reading CSV files:', error)
    return NextResponse.json(
      { error: 'Failed to load trip data' },
      { status: 500 }
    )
  }
}