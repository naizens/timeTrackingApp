import { create } from 'zustand'
import type { Todo, TodoStatus, TodoPriority } from '@renderer/types/store'

interface TodoState {
  todos: Todo[]
  isLoading: boolean
  error: string | null

  loadAll: () => Promise<void>
  add: (payload: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  update: (todo: Todo) => Promise<void>
  updateStatus: (id: string, status: TodoStatus) => Promise<void>
  delete: (id: string) => Promise<void>

  // Derived selectors
  getByStatus: (status: TodoStatus) => Todo[]
  getByPriority: (priority: TodoPriority) => Todo[]
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  isLoading: false,
  error: null,

  loadAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const todos = await window.api.todo.getAll()
      set({ todos, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  add: async (payload) => {
    const newTodo = await window.api.todo.add(payload)
    set((s) => ({ todos: [newTodo, ...s.todos] }))
  },

  update: async (todo) => {
    const updated = await window.api.todo.update(todo)
    set((s) => ({ todos: s.todos.map((t) => (t.id === todo.id ? updated : t)) }))
  },

  updateStatus: async (id, status) => {
    const todo = get().todos.find((t) => t.id === id)
    if (!todo) return
    await get().update({ ...todo, status })
  },

  delete: async (id) => {
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }))
    await window.api.todo.delete(id)
  },

  getByStatus: (status) => get().todos.filter((t) => t.status === status),
  getByPriority: (priority) => get().todos.filter((t) => t.priority === priority)
}))
