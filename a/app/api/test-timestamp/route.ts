import { NextResponse } from "next/server"

export async function GET() {
  try {
    const now = new Date()
    
    return NextResponse.json({
      serverTime: {
        iso: now.toISOString(),
        ist: now.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        }),
        utc: now.toUTCString(),
        timestamp: now.getTime()
      },
      timezone: {
        offset: now.getTimezoneOffset(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        istOffset: '+05:30'
      },
      database: {
        nowQuery: 'SELECT NOW() AT TIME ZONE \'Asia/Kolkata\' as ist_time'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to get time" }, { status: 500 })
  }
}
