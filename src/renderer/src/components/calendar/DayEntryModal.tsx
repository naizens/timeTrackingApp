import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Modal } from '@renderer/components/ui/Modal'
import { Button } from '@renderer/components/ui/Button'
import { Input } from '@renderer/components/ui/Input'
import { Select } from '@renderer/components/ui/Select'
import { Textarea } from '@renderer/components/ui/Textarea'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { useVacationStore } from '@renderer/store/useVacationStore'
import {
  computeNetMinutes,
  computeOvertimeMinutes,
  formatMinutes,
  formatOvertime
} from '@renderer/utils/dateHelpers'
import type { WorkDay, DayType } from '@renderer/types/store'

interface DayEntryModalProps {
  date: Date | null
  onClose: () => void
}

const TYPE_OPTIONS = [
  { value: 'work', label: 'Arbeitstag' },
  { value: 'vacation', label: 'Urlaub (wird im Urlaubskonto gezählt)' },
  { value: 'sick', label: 'Krank' },
  { value: 'paid_absence', label: 'Bezahlter Fehltag' },
  { value: 'school_day', label: 'Berufsschultag (8h Arbeitszeit)' }
]

// Types that need start/end time inputs
const NEEDS_TIME = new Set<DayType>(['work'])

export function DayEntryModal({ date, onClose }: DayEntryModalProps) {
  const { workDays, setDay, deleteDay } = useCalendarStore()
  const settings = useSettingsStore((s) => s.settings)
  const { vacationEntries, addVacation, deleteVacation, sickEntries, addSick, deleteSick } =
    useVacationStore()

  const dateStr = date ? format(date, 'yyyy-MM-dd') : ''
  const existing = workDays[dateStr]

  const [type, setType] = useState<DayType>('work')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:30')
  const [breakMins, setBreakMins] = useState(30)
  const [notes, setNotes] = useState('')

  // Populate form with existing data when opened.
  // Calling setState synchronously here is intentional: the effect runs after render
  // and re-syncs form state whenever the selected date changes.
  // eslint-disable-next-line react-compiler/react-compiler
  useEffect(() => {
    if (existing) {
      setType(existing.type)
      setStartTime(existing.workStartTime || '09:00')
      setEndTime(existing.workEndTime || '17:30')
      setBreakMins(existing.breakMinutes)
      setNotes(existing.notes)
    } else {
      setType('work')
      setStartTime('09:00')
      setEndTime('17:30')
      setBreakMins(30)
      setNotes('')
    }
  }, [dateStr, existing])

  const showTimePicker = NEEDS_TIME.has(type)

  // Effective net work minutes:
  // work → computed from times, school_day → full workHoursPerDay, others → 0
  const netMins = (() => {
    if (type === 'work') return computeNetMinutes(startTime, endTime, breakMins)
    if (type === 'school_day') return settings.workHoursPerDay * 60
    return 0
  })()

  const overtimeMins =
    type === 'school_day'
      ? 0 // school day counts as exactly the target, never overtime
      : computeOvertimeMinutes(netMins, settings.workHoursPerDay)
  const overtimeLabel = netMins > 0 && type === 'work' ? formatOvertime(overtimeMins) : null

  // --- Vacation sync helpers ---
  const findCalendarVacEntry = () =>
    vacationEntries.find((e) => e.startDate === dateStr && e.endDate === dateStr)

  const syncVacation = async (newType: DayType, prevType: DayType | undefined) => {
    const wasVacation = prevType === 'vacation'
    const isVacation = newType === 'vacation'

    if (isVacation && !wasVacation) {
      if (!findCalendarVacEntry()) {
        await addVacation({ startDate: dateStr, endDate: dateStr, notes, type: 'vacation' })
      }
    } else if (!isVacation && wasVacation) {
      const entry = findCalendarVacEntry()
      if (entry) await deleteVacation(entry.id)
    }
  }

  // --- Sick sync helpers ---
  const findCalendarSickEntry = () =>
    sickEntries.find((e) => e.startDate === dateStr && e.endDate === dateStr)

  const syncSick = async (newType: DayType, prevType: DayType | undefined) => {
    const wasSick = prevType === 'sick'
    const isSick = newType === 'sick'

    if (isSick && !wasSick) {
      if (!findCalendarSickEntry()) {
        await addSick({ startDate: dateStr, endDate: dateStr, notes, type: 'sick' })
      }
    } else if (!isSick && wasSick) {
      const entry = findCalendarSickEntry()
      if (entry) await deleteSick(entry.id)
    }
  }

  const handleSave = async () => {
    if (!date) return

    const day: WorkDay = {
      date: dateStr,
      // school_day stores its hours implicitly via the type; no manual times needed
      workStartTime: type === 'work' ? startTime : '',
      workEndTime: type === 'work' ? endTime : '',
      breakMinutes: type === 'work' ? breakMins : 0,
      notes,
      type
    }

    await syncVacation(type, existing?.type)
    await syncSick(type, existing?.type)
    await setDay(day)
    onClose()
  }

  const handleDelete = async () => {
    if (!date) return
    // If deleting a vacation/sick day, also clean up the synced entry
    if (existing?.type === 'vacation') {
      const entry = findCalendarVacEntry()
      if (entry) await deleteVacation(entry.id)
    }
    if (existing?.type === 'sick') {
      const entry = findCalendarSickEntry()
      if (entry) await deleteSick(entry.id)
    }
    await deleteDay(dateStr)
    onClose()
  }

  if (!date) return null

  return (
    <Modal
      isOpen={!!date}
      onClose={onClose}
      title={format(date, 'EEEE, d. MMMM yyyy', { locale: undefined })}
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Typ"
          value={type}
          onChange={(e) => setType(e.target.value as DayType)}
          options={TYPE_OPTIONS}
        />

        {/* Time inputs only for regular work days */}
        {showTimePicker && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Arbeitsbeginn"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label="Arbeitsende"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <Input
              label="Pause (Minuten)"
              type="number"
              min={0}
              max={480}
              value={breakMins}
              onChange={(e) => setBreakMins(Number(e.target.value))}
            />
          </>
        )}

        {/* Work time summary (work days + school days) */}
        {netMins > 0 && (
          <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {type === 'school_day' ? 'Angerechnet: ' : 'Nettoarbeitszeit: '}
              <span className="font-bold">{formatMinutes(netMins)}</span>
            </span>
            {overtimeLabel && (
              <span
                className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                  overtimeMins > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {overtimeLabel}
              </span>
            )}
          </div>
        )}

        {/* Info hints for special types */}
        {type === 'vacation' && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-700">
            Dieser Tag wird automatisch in deinem Urlaubskonto erfasst.
          </div>
        )}
        {type === 'paid_absence' && (
          <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-2.5 text-xs text-purple-700">
            Bezahlter Fehltag – kein Urlaub, kein Überstundenausgleich.
          </div>
        )}

        <Textarea
          label="Notizen"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optionale Notizen..."
        />

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1">
            Speichern
          </Button>
          {existing && (
            <Button variant="danger" onClick={handleDelete}>
              Löschen
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
