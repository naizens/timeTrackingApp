# work-tracker

A modern time tracking and vacation management desktop application built with Electron, React, and TypeScript.

## Features

- **📅 Calendar Management** – Track work days with start/end times, breaks, and notes
- **🏖️ Vacation & Sick Days** – Manage vacation entries and sick days with automatic calendar integration
- **📊 Dashboard** – Real-time overview of monthly work hours, overtime, and vacation balance
- **✅ Todo Management** – Organize tasks with priority levels, due dates, and status tracking
- **🇩🇪 German Holidays** – Automatic integration of German state-specific holidays via [feiertage-api.de](https://feiertage-api.de/)
- **⚙️ Customizable Settings** – Configure work hours per day and select your German state for holidays
- **💾 Persistent Storage** – All data is stored locally using electron-store

## Project Setup

### Prerequisites

- Node.js 16+ and npm/yarn
- Windows, macOS, or Linux

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the development server with hot module reloading (HMR).

### Build

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

The built executables will be in the `dist/` directory.

## Architecture

### Main Process (`src/main/`)
- **`index.ts`** – Application lifecycle management
- **`store.ts`** – Electron Store configuration for persistent data
- **`windowManager.ts`** – Window creation and management with native title bar
- **`ipc/`** – IPC handlers for calendar, vacation, todos, settings, holidays, and window control

### Preload Bridge (`src/preload/`)
- **`index.ts`** – Secure IPC bridge exposing API methods to renderer process
- **`index.d.ts`** – TypeScript definitions for the exposed API

### Renderer / UI (`src/renderer/`)
- **`components/`** – React components organized by feature (calendar, dashboard, vacation, todos)
- **`store/`** – Zustand stores for state management (calendar, vacation, todos, settings, holidays)
- **`types/`** – TypeScript type definitions for IPC channels and data structures
- **`utils/`** – Date helpers for business day calculations, overtime, etc.

## Configuration

### Settings
Configure through the **Settings page** in the app:
- **Work Hours Per Day** – Default working hours (e.g., 8 hours)
- **German State** – Select your state for holiday integration (e.g., Bavaria, Berlin)
- **Theme** – Light/dark mode preference

### Vacation Budget
Set your annual vacation days on the **Vacation page** for accurate balance tracking.

## Data Storage

All data is persisted locally in your user data directory:
- **Windows:** `%APPDATA%\work-tracker`
- **macOS:** `~/Library/Application Support/work-tracker`
- **Linux:** `~/.config/work-tracker`

Data includes:
- Work days with time entries
- Vacation and sick day entries
- Vacation budgets by year
- Todo items
- User settings
- Holiday cache (auto-refreshed)

## Technology Stack

- **Framework:** Electron + React 18 + TypeScript
- **Styling:** Tailwind CSS + Vite for module bundling
- **State Management:** Zustand
- **Date Handling:** date-fns
- **Icons:** lucide-react
- **Build Tool:** electron-vite

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/)
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## APIs Used

- [feiertage-api.de](https://feiertage-api.de/) – German holidays by state
- [ferien-api.de](https://ferien-api.de/) - German school holidays by state

## License

MIT

