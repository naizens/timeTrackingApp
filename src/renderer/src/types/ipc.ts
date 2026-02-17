// ============================================================
// IPC channel name constants.
// Used in both main-process handlers AND preload to guarantee
// type-safe string matching (no runtime typos possible).
// ============================================================

export const IPC_CHANNELS = {
  // Calendar
  CALENDAR_GET_MONTH: 'calendar:getMonth',
  CALENDAR_SET_DAY: 'calendar:setDay',
  CALENDAR_DELETE_DAY: 'calendar:deleteDay',

  // Vacation
  VACATION_GET_ALL: 'vacation:getAll',
  VACATION_ADD: 'vacation:add',
  VACATION_UPDATE: 'vacation:update',
  VACATION_DELETE: 'vacation:delete',

  // Sick days
  SICK_GET_ALL: 'sick:getAll',
  SICK_ADD: 'sick:add',
  SICK_UPDATE: 'sick:update',
  SICK_DELETE: 'sick:delete',

  // Vacation budget
  BUDGET_GET_ALL: 'budget:getAll',
  BUDGET_SET: 'budget:set',

  // Todos
  TODO_GET_ALL: 'todo:getAll',
  TODO_ADD: 'todo:add',
  TODO_UPDATE: 'todo:update',
  TODO_DELETE: 'todo:delete',

  // Holidays
  HOLIDAYS_GET: 'holidays:get',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Window controls
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE_TOGGLE: 'window:maximizeToggle',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:isMaximized',

  // Push: main → renderer
  WINDOW_MAXIMIZED_CHANGE: 'window:maximizedChange'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
