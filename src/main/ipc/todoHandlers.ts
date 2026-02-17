import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { IPC_CHANNELS } from '../../renderer/src/types/ipc'
import { getStore } from '../store'
import type { Todo } from '../../renderer/src/types/store'

type NewTodoPayload = Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>

export function registerTodoHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.TODO_GET_ALL, () => getStore().get('todos'))

  ipcMain.handle(IPC_CHANNELS.TODO_ADD, (_event, payload: NewTodoPayload) => {
    const store = getStore()
    const now = new Date().toISOString()
    const newTodo: Todo = {
      ...payload,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now
    }
    store.set('todos', [...store.get('todos'), newTodo])
    return newTodo
  })

  ipcMain.handle(IPC_CHANNELS.TODO_UPDATE, (_event, todo: Todo) => {
    const store = getStore()
    const updated: Todo = { ...todo, updatedAt: new Date().toISOString() }
    store.set(
      'todos',
      store.get('todos').map((t) => (t.id === todo.id ? updated : t))
    )
    return updated
  })

  ipcMain.handle(IPC_CHANNELS.TODO_DELETE, (_event, id: string) => {
    const store = getStore()
    store.set(
      'todos',
      store.get('todos').filter((t) => t.id !== id)
    )
    return { success: true }
  })
}
