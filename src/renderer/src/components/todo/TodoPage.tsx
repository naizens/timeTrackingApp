import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2, Check, Circle, Clock, ChevronUp } from 'lucide-react'
import { Button } from '@renderer/components/ui/Button'
import { Input } from '@renderer/components/ui/Input'
import { Select } from '@renderer/components/ui/Select'
import { Textarea } from '@renderer/components/ui/Textarea'
import { Modal } from '@renderer/components/ui/Modal'
import { Badge } from '@renderer/components/ui/Badge'
import { useTodoStore } from '@renderer/store/useTodoStore'
import type { Todo, TodoPriority, TodoStatus } from '@renderer/types/store'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' }
]

const PRIORITY_COLORS: Record<TodoPriority, 'gray' | 'yellow' | 'red'> = {
  low: 'gray',
  medium: 'yellow',
  high: 'red'
}

const PRIORITY_LABELS: Record<TodoPriority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch'
}

const STATUS_NEXT: Record<TodoStatus, TodoStatus> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending'
}

function StatusIcon({ status }: { status: TodoStatus }) {
  if (status === 'done') return <Check size={16} className="text-green-600" />
  if (status === 'in_progress') return <Clock size={16} className="text-blue-500" />
  return <Circle size={16} className="text-gray-400" />
}

function AddTodoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { add } = useTodoStore()
  const [title, setTitle] = useState('')
  const [description, setDesc] = useState('')
  const [priority, setPriority] = useState<TodoPriority>('medium')
  const [dueDate, setDueDate] = useState('')

  const handleSave = async () => {
    if (!title.trim()) return
    await add({
      title: title.trim(),
      description,
      priority,
      status: 'pending',
      dueDate: dueDate || null
    })
    setTitle('')
    setDesc('')
    setPriority('medium')
    setDueDate('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aufgabe hinzufügen">
      <div className="flex flex-col gap-4">
        <Input
          label="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Aufgabentitel..."
        />
        <Textarea
          label="Beschreibung"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Optional..."
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priorität"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoPriority)}
            options={PRIORITY_OPTIONS}
          />
          <Input
            label="Fälligkeitsdatum"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={handleSave} disabled={!title.trim()}>
            Speichern
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function TodoItem({ todo }: { todo: Todo }) {
  const { updateStatus, delete: deleteTodo } = useTodoStore()

  const isDone = todo.status === 'done'
  const isOverdue = todo.dueDate && !isDone && todo.dueDate < format(new Date(), 'yyyy-MM-dd')

  return (
    <li
      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors
      ${isDone ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-sm'}`}
    >
      {/* Status toggle */}
      <button
        onClick={() => updateStatus(todo.id, STATUS_NEXT[todo.status])}
        className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
        aria-label="Status wechseln"
      >
        <StatusIcon status={todo.status} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{todo.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge color={PRIORITY_COLORS[todo.priority]}>{PRIORITY_LABELS[todo.priority]}</Badge>
          {todo.dueDate && (
            <span
              className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}
            >
              Fällig: {format(parseISO(todo.dueDate), 'dd.MM.yyyy')}
              {isOverdue && ' (überfällig)'}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => deleteTodo(todo.id)}
        className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors shrink-0"
        aria-label="Löschen"
      >
        <Trash2 size={14} />
      </button>
    </li>
  )
}

export function TodoPage() {
  const { todos, isLoading } = useTodoStore()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | TodoStatus>('all')

  const filtered = todos.filter((t) => filter === 'all' || t.status === filter)
  const sorted = [...filtered].sort((a, b) => {
    // High priority first, then by creation date
    const pOrder = { high: 0, medium: 1, low: 2 }
    const pd = pOrder[a.priority] - pOrder[b.priority]
    if (pd !== 0) return pd
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const pendingCount = todos.filter((t) => t.status === 'pending').length
  const doneCount = todos.filter((t) => t.status === 'done').length

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aufgaben</h1>
          <p className="text-sm text-gray-500">
            {pendingCount} offen · {doneCount} erledigt
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} /> Neue Aufgabe
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg self-start">
        {(
          [
            ['all', 'Alle'],
            ['pending', 'Offen'],
            ['in_progress', 'In Bearbeitung'],
            ['done', 'Erledigt']
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${filter === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Todo list */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Lädt...</p>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ChevronUp size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Keine Aufgaben gefunden</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      )}

      <AddTodoModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
