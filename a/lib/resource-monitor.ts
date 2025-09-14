// Resource monitoring for Railway free tier
import { performance } from 'perf_hooks'

export interface ResourceStats {
  memoryUsage: NodeJS.MemoryUsage
  uptime: number
  timestamp: Date
}

export function getResourceStats(): ResourceStats {
  const memUsage = process.memoryUsage()
  
  return {
    memoryUsage: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024), // MB
    },
    uptime: Math.round(process.uptime()),
    timestamp: new Date()
  }
}

export function logResourceUsage(context: string) {
  const stats = getResourceStats()
  const memUsage = stats.memoryUsage
  
  console.log(`[RESOURCE] ${context}:`, {
    memory: `${memUsage.heapUsed}MB / ${memUsage.heapTotal}MB`,
    rss: `${memUsage.rss}MB`,
    uptime: `${stats.uptime}s`
  })
  
  // Warn if memory usage is high
  if (memUsage.heapUsed > 400) { // 400MB warning threshold
    console.warn(`[RESOURCE WARNING] High memory usage: ${memUsage.heapUsed}MB`)
  }
  
  if (memUsage.rss > 800) { // 800MB RSS warning threshold
    console.warn(`[RESOURCE WARNING] High RSS memory: ${memUsage.rss}MB`)
  }
}

// Memory cleanup function
export function forceGarbageCollection() {
  if (global.gc) {
    global.gc()
    console.log('[RESOURCE] Forced garbage collection')
  } else {
    console.log('[RESOURCE] Garbage collection not available')
  }
}


