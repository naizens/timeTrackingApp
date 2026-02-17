// electron-store v8+ is ESM-only, so we use dynamic import.
// initStore() MUST be awaited before any IPC handlers are registered.

import type { StoreSchema } from '../renderer/src/types/store'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _store: any = null

const DEFAULT_SETTINGS: StoreSchema['settings'] = {
  germanState: 'BY',
  workHoursPerDay: 8,
  theme: 'light'
}

export async function initStore(): Promise<void> {
  const { default: Store } = await import('electron-store')
  _store = new Store<StoreSchema>({
    name: 'work-tracker-data',
    defaults: {
      workDays: {},
      vacationEntries: [],
      sickEntries: [],
      vacationBudgets: [],
      todos: [],
      settings: DEFAULT_SETTINGS,
      holidayCache: []
    }
  })
}

type TypedStore = {
  get<K extends keyof StoreSchema>(key: K): StoreSchema[K]
  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void
}

export function getStore(): TypedStore {
  if (!_store) throw new Error('Store not initialized – call initStore() first')
  return _store as TypedStore
}
