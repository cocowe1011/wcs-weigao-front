# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Vue 2 + Electron desktop application** for a WCS (Warehouse Control System) that connects to Siemens S7 PLCs and provides 3D visualization for warehouse monitoring and control. The UI is in Chinese.

## Development Commands

```bash
# Development (Electron with hot reload)
npm run electron:serve

# Development (web only, no Electron)
npm run serve

# Production build (Electron installer)
npm run electron:build

# Production build (web only)
npm run build

# Linting
npm run lint

# Generate app icons from public/icon.png
npm run electron:generate-icons
```

**Prerequisites:** npm version 8.2+ with Node 14

## Architecture

### Electron Process Model
- **Main Process** (`src/background.js`): Handles PLC communication via `nodes7` library, window management, logging, and IPC
- **Renderer Process**: Vue application with UI components
- **Preload** (`src/preload.js`): Exposes safe IPC bridges between processes

### Key IPC Channels
- `logStatus` - Login/logout state changes
- `close-window`, `min-window`, `max-window`, `full_screen` - Window controls
- `writeValuesToPLC`, `writeSingleValueToPLC`, `cancelWriteToPLC` - PLC write operations
- `getPlcVariables`, `getWriteData` - Retrieve PLC data
- `conPLC` - PLC connection management
- `receivedMsg` - Real-time PLC data updates pushed to renderer

### Cross-Process State
User session info stored in `global.sharedObject.userInfo` (Electron main process global)

### HTTP Clients
Two Axios instances with different base URLs:
- `src/utils/HttpUtil.js` → `VUE_APP_BASE_URL` (main backend API)
- `src/utils/HttpUtilwms.js` → `VUE_APP_BASE_URL_WMS` (WMS API)

### Routing Structure
```
/login                    → Login page
/homePage                 → Main layout (HomePage.vue with navigation)
  /homePage/welcomPage    → Welcome/landing
  /homePage/MainPage      → Business processing with 3D floor plan
  /homePage/sterilizationMonitor → Monitoring interface
  /homePage/aboutPage     → About page
```

## Key Files

| File | Purpose |
|------|---------|
| `src/background.js` | Electron main process (~98KB), PLC communication logic |
| `src/views/home/MainPage.vue` | Primary business page with 3D visualization (~123KB) |
| `src/views/home/css/MainPage.less` | Large stylesheet for MainPage (~50KB) |
| `src/views/home/HomePage.vue` | Authenticated layout with navigation and StatusMonitoring |
| `src/components/StatusMonitoring.vue` | Floating PLC connection status indicator |

## Code Conventions

- Vue 2 Options API
- Less for CSS preprocessing
- Element UI component library
- Semicolons required, single quotes for strings
- Vuex store exists but is empty; state managed via component state and Electron globals

## Logging

Application logs written to `D://wcs_temp_data/log/` with 10MB rotation via `electron-log`
