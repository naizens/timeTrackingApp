import { Card } from '@renderer/components/ui/Card'
import { Select } from '@renderer/components/ui/Select'
import { Input } from '@renderer/components/ui/Input'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { GERMAN_STATES, type GermanStateCode } from '@renderer/types/store'

const STATE_OPTIONS = Object.entries(GERMAN_STATES).map(([value, label]) => ({ value, label }))

export function SettingsPage() {
  const { settings, update } = useSettingsStore()

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card title="Work Hours">
        <div className="flex flex-col gap-4">
          <div className="w-40">
            <Input
              label="Work hours per day"
              type="number"
              min={1}
              max={24}
              step={0.5}
              value={settings.workHoursPerDay}
              onChange={(e) => update({ workHoursPerDay: parseFloat(e.target.value) || 8 })}
            />
          </div>
        </div>
      </Card>

      <Card title="Public Holidays">
        <div className="max-w-xs">
          <Select
            label="Federal State"
            value={settings.germanState}
            onChange={(e) => update({ germanState: e.target.value as GermanStateCode })}
            options={STATE_OPTIONS}
          />
          <p className="text-xs text-gray-500 mt-2">
            Public holidays are fetched from feiertage-api.de and cached locally for 7 days.
          </p>
        </div>
      </Card>
    </div>
  )
}
