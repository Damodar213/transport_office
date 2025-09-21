import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"

export async function GET() {
  try {
    const now = new Date()
    
    const response = NextResponse.json({
      serverTime: {
        iso: now.toISOString()    
    ,
        ist: now.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'



          }

          }

          }

        }),
        utc: now.toUTCString(),
        timestamp: now.getTime()
      },
      timezone: {



      }

      }

      }

        offset: now.getTimezoneOffset(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        istOffset: '+05:30'



        }

        }

        }

      },
      database: {
        nowQuery: 'SELECT NOW() AT TIME ZONE \'Asia/Kolkata\' as ist_time'
      }

  } catch (error) {
  }

}
