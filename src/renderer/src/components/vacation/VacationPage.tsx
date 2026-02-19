import { useState } from 'react'
import { getYear as dfGetYear, eachDayOfInterval, parseISO, isWeekend, format } from 'date-fns'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/Button'
import { Input } from '@renderer/components/ui/Input'
import { Textarea } from '@renderer/components/ui/Textarea'
import { Modal } from '@renderer/components/ui/Modal'
import { Card } from '@renderer/components/ui/Card'
import { Badge } from '@renderer/components/ui/Badge'
import { useVacationStore } from '@renderer/store/useVacationStore'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { countBusinessDays } from '@renderer/utils/dateHelpers'
import type { VacationEntry, SickEntry, DayType } from '@renderer/types/store'

const currentYear = dfGetYear(new Date())

// ---- Generic entry form (used for both vacation and sick) ----
interface EntryFormData {
  startDate: string
  endDate: string
  notes: string
}

interface EntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: EntryFormData) => void
  initial?: EntryFormData
  title: string
}

function EntryModal({ isOpen, onClose, onSave, initial, title }: EntryModalProps) {
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const days = startDate && endDate ? countBusinessDays(startDate, endDate) : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="From"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {days > 0 && (
          <div className="bg-blue-50 text-blue-800 rounded-lg px-4 py-2 text-sm font-medium">
            {days} business day{days !== 1 ? 's' : ''}
          </div>
        )}
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional..."
        />
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            onClick={() => {
              onSave({ startDate, endDate, notes })
              onClose()
            }}
            disabled={!startDate || !endDate || endDate < startDate}
          >
            Save
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ---- Main VacationPage ----
export function VacationPage() {
  const {
    vacationEntries,
    sickEntries,
    addVacation,
    updateVacation,
    deleteVacation,
    addSick,
    updateSick,
    deleteSick,
    setBudget,
    getBudgetForYear
  } = useVacationStore()
  const { setDay, deleteDay } = useCalendarStore()

  const [showVacModal, setShowVacModal] = useState(false)
  const [showSickModal, setShowSickModal] = useState(false)
  const [editingVac, setEditingVac] = useState<VacationEntry | null>(null)
  const [editingSick, setEditingSick] = useState<SickEntry | null>(null)
  const [budgetInput, setBudgetInput] = useState(String(getBudgetForYear(currentYear) || ''))

  const budget = getBudgetForYear(currentYear)
  const usedVacDays = vacationEntries
    .filter((e) => e.startDate.startsWith(String(currentYear)))
    .reduce((s, e) => s + countBusinessDays(e.startDate, e.endDate), 0)

  const handleSaveBudget = () => {
    const days = parseInt(budgetInput)
    if (!isNaN(days) && days > 0) setBudget({ year: currentYear, totalDays: days })
  }

  // Returns all weekday ISO date strings (Mon–Fri) in the inclusive range
  const weekdaysInRange = (startDate: string, endDate: string): string[] => {
    if (!startDate || !endDate || endDate < startDate) return []
    return eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
      .filter((d) => !isWeekend(d))
      .map((d) => format(d, 'yyyy-MM-dd'))
  }

  // Writes WorkDay entries for all weekdays in range with the given type
  const syncRangeToCalendar = async (
    startDate: string,
    endDate: string,
    type: DayType,
    notes: string
  ) => {
    for (const date of weekdaysInRange(startDate, endDate)) {
      await setDay({ date, workStartTime: '', workEndTime: '', breakMinutes: 0, notes, type })
    }
  }

  // Deletes WorkDay entries for all weekdays in range
  const clearRangeFromCalendar = async (startDate: string, endDate: string) => {
    for (const date of weekdaysInRange(startDate, endDate)) {
      await deleteDay(date)
    }
  }

  const handleSaveVac = async (data: EntryFormData) => {
    if (editingVac) {
      // Clear old range, write new range, then update store entry
      await clearRangeFromCalendar(editingVac.startDate, editingVac.endDate)
      await syncRangeToCalendar(data.startDate, data.endDate, 'vacation', data.notes)
      await updateVacation({ ...editingVac, ...data })
      setEditingVac(null)
    } else {
      await syncRangeToCalendar(data.startDate, data.endDate, 'vacation', data.notes)
      await addVacation({ ...data, type: 'vacation' })
    }
  }

  const handleDeleteVac = async (entry: VacationEntry) => {
    await clearRangeFromCalendar(entry.startDate, entry.endDate)
    await deleteVacation(entry.id)
  }

  const handleSaveSick = async (data: EntryFormData) => {
    if (editingSick) {
      await clearRangeFromCalendar(editingSick.startDate, editingSick.endDate)
      await syncRangeToCalendar(data.startDate, data.endDate, 'sick', data.notes)
      await updateSick({ ...editingSick, ...data })
      setEditingSick(null)
    } else {
      await syncRangeToCalendar(data.startDate, data.endDate, 'sick', data.notes)
      await addSick({ ...data, type: 'sick' })
    }
  }

  const handleDeleteSick = async (entry: SickEntry) => {
    await clearRangeFromCalendar(entry.startDate, entry.endDate)
    await deleteSick(entry.id)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Vacation & Sick Days</h1>

      {/* Budget */}
      <Card title={`Vacation Budget ${currentYear}`}>
        <div className="flex items-end gap-3">
          <div className="w-40">
            <Input
              label="Total vacation days"
              type="number"
              min={1}
              max={365}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveBudget} variant="secondary">
            Save
          </Button>
          {budget > 0 && (
            <div className="text-sm text-gray-600 ml-2">
              <span className="font-semibold text-blue-700">
                {Math.max(0, budget - usedVacDays)}
              </span>{' '}
              of {budget} days remaining
            </div>
          )}
        </div>
      </Card>

      {/* Vacation entries */}
      <Card title="Vacation Entries">
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={() => {
              setEditingVac(null)
              setShowVacModal(true)
            }}
            className="self-start"
          >
            <Plus size={14} /> Add entry
          </Button>
          {vacationEntries.length === 0 ? (
            <p className="text-sm text-gray-400 mt-2">No vacation entries yet</p>
          ) : (
            <ul className="flex flex-col gap-2 mt-2">
              {[...vacationEntries].reverse().map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {e.startDate} – {e.endDate}
                    </span>
                    <Badge color="blue" className="ml-2">
                      {countBusinessDays(e.startDate, e.endDate)} days
                    </Badge>
                    {e.notes && <p className="text-xs text-gray-500 mt-0.5">{e.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingVac(e)
                        setShowVacModal(true)
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteVac(e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Sick entries */}
      <Card title="Sick Days">
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingSick(null)
              setShowSickModal(true)
            }}
            className="self-start"
          >
            <Plus size={14} /> Add entry
          </Button>
          {sickEntries.length === 0 ? (
            <p className="text-sm text-gray-400 mt-2">No sick day entries yet</p>
          ) : (
            <ul className="flex flex-col gap-2 mt-2">
              {[...sickEntries].reverse().map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between bg-yellow-50 rounded-lg px-4 py-3"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {e.startDate} – {e.endDate}
                    </span>
                    <Badge color="yellow" className="ml-2">
                      {countBusinessDays(e.startDate, e.endDate)} days
                    </Badge>
                    {e.notes && <p className="text-xs text-gray-500 mt-0.5">{e.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingSick(e)
                        setShowSickModal(true)
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSick(e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Modals */}
      <EntryModal
        isOpen={showVacModal}
        onClose={() => {
          setShowVacModal(false)
          setEditingVac(null)
        }}
        onSave={handleSaveVac}
        initial={editingVac ?? undefined}
        title={editingVac ? 'Edit vacation' : 'Add vacation'}
      />
      <EntryModal
        isOpen={showSickModal}
        onClose={() => {
          setShowSickModal(false)
          setEditingSick(null)
        }}
        onSave={handleSaveSick}
        initial={editingSick ?? undefined}
        title={editingSick ? 'Edit sick day' : 'Add sick day'}
      />
    </div>
  )
}
