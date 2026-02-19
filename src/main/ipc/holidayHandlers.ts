import { ipcMain, net } from 'electron'
import { IPC_CHANNELS } from '../../renderer/src/types/ipc'
import { getStore } from '../store'
import type {
  GermanStateCode,
  HolidayCacheEntry,
  HolidaysForYear
} from '../../renderer/src/types/store'

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_CACHE_ENTRIES = 6

interface HolidayRequest {
  year: number
  state: GermanStateCode
}

export function registerHolidayHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.HOLIDAYS_GET, async (_event, req: HolidayRequest) => {
    return fetchHolidays(req.year, req.state)
  })
}

async function fetchHolidays(year: number, state: GermanStateCode): Promise<HolidaysForYear> {
  const store = getStore()
  const cache: HolidayCacheEntry[] = store.get('holidayCache')

  // Layer 2: Check disk cache (7-day TTL)
  const cached = cache.find((e) => e.year === year && e.state === state)
  if (cached) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime()
    if (age < CACHE_TTL_MS) {
      return cached.data
    }
  }

  // Fetch from feiertage-api.de
  const url = `https://feiertage-api.de/api/?jahr=${year}&nur_land=${state}`
  try {
    const data = (await fetchJson(url)) as HolidaysForYear
    const entry: HolidayCacheEntry = {
      year,
      state,
      data,
      fetchedAt: new Date().toISOString()
    }

    // Update disk cache (LRU eviction)
    const updated = cache.filter((e) => !(e.year === year && e.state === state))
    updated.push(entry)
    if (updated.length > MAX_CACHE_ENTRIES) updated.shift()
    store.set('holidayCache', updated)

    return data
  } catch (error) {
    // Graceful degradation: return stale cache on network failure
    if (cached) {
      console.warn(`Holiday API unreachable, serving stale cache for ${state}/${year}`)
      return cached.data
    }
    throw new Error(`Failed to load public holidays: ${(error as Error).message}`)
  }
}

// Uses Electron's built-in net module (works in main process, respects proxy settings)
function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    let body = ''

    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }
      response.on('data', (chunk) => {
        body += chunk.toString()
      })
      response.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch {
          reject(new Error('Invalid API response (not JSON)'))
        }
      })
      response.on('error', reject)
    })

    request.on('error', reject)
    request.end()
  })
}
