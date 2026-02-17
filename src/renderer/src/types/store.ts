// ============================================================
// Single Source of Truth for all persisted data shapes.
// All dates stored as ISO strings "YYYY-MM-DD" for JSON safety.
// ============================================================

// --- German State Codes ---
export type GermanStateCode =
  | 'BW'
  | 'BY'
  | 'BE'
  | 'BB'
  | 'HB'
  | 'HH'
  | 'HE'
  | 'MV'
  | 'NI'
  | 'NW'
  | 'RP'
  | 'SL'
  | 'SN'
  | 'ST'
  | 'SH'
  | 'TH'

export const GERMAN_STATES: Record<GermanStateCode, string> = {
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  BE: 'Berlin',
  BB: 'Brandenburg',
  HB: 'Bremen',
  HH: 'Hamburg',
  HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein',
  TH: 'Thüringen'
}

// --- Calendar ---
export type DayType =
  | 'work'
  | 'vacation' // Urlaubstag – wird in vacation store synchronisiert
  | 'sick'
  | 'holiday'
  | 'weekend'
  | 'paid_absence' // Bezahlter Fehltag (kein Urlaub, kein Krank)
  | 'school_day' // Berufsschultag – wird als volle Arbeitszeit gewertet

export interface WorkDay {
  date: string // "2026-02-17"
  workStartTime: string // "09:00"
  workEndTime: string // "17:30"
  breakMinutes: number // 30
  notes: string
  type: DayType
}

// --- Vacation & Sick ---
export interface VacationEntry {
  id: string
  startDate: string // ISO date
  endDate: string // ISO date
  notes: string
  type: 'vacation'
}

export interface SickEntry {
  id: string
  startDate: string
  endDate: string
  notes: string
  type: 'sick'
}

export interface VacationBudget {
  year: number
  totalDays: number // e.g. 30
}

// --- Todos ---
export type TodoPriority = 'low' | 'medium' | 'high'
export type TodoStatus = 'pending' | 'in_progress' | 'done'

export interface Todo {
  id: string
  title: string
  description: string
  priority: TodoPriority
  status: TodoStatus
  dueDate: string | null // ISO date or null
  createdAt: string // ISO datetime
  updatedAt: string // ISO datetime
}

// --- Settings ---
export interface AppSettings {
  germanState: GermanStateCode
  workHoursPerDay: number
  theme: 'light' | 'dark'
}

// --- Holidays API ---
export interface HolidayApiEntry {
  datum: string // "2026-01-01"
  hinweis: string
}

// Key = holiday name, e.g. "Neujahrstag"
export type HolidaysForYear = Record<string, HolidayApiEntry>

export interface HolidayCacheEntry {
  year: number
  state: GermanStateCode
  data: HolidaysForYear
  fetchedAt: string // ISO datetime
}

// --- Persisted store root (electron-store schema) ---
export interface StoreSchema {
  workDays: Record<string, WorkDay> // keyed by ISO date
  vacationEntries: VacationEntry[]
  sickEntries: SickEntry[]
  vacationBudgets: VacationBudget[] // one per year
  todos: Todo[]
  settings: AppSettings
  holidayCache: HolidayCacheEntry[] // max 6 entries, LRU
}

// --- Derived / UI types ---
export interface HolidayEntry {
  name: string
  date: string
  hinweis: string
}
