# Replit Clone

## Overview
A React-based Replit clone web application built with TypeScript, Vite, and Tailwind CSS. It provides an IDE-like interface with features like a file explorer, terminal, code editor, and agent-based workflows.

## Architecture
- **Frontend only** — pure client-side SPA (no backend server)
- **Framework**: React 18 with TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS + Radix UI primitives
- **Routing**: Wouter
- **State/Data**: TanStack React Query

## Project Structure
- `client/` — Main frontend React application
  - `src/components/` — UI components (Editor, Terminal, FileExplorer, panels, etc.)
  - `src/pages/` — Route components (workspace, dashboard, import)
  - `src/hooks/` — Custom React hooks
  - `src/lib/` — Utilities and API clients
  - `src/context/` — React Context providers
  - `src/services/` — Service layer for external API interactions
- `shared/` — Shared TypeScript schemas and types
- `attached_assets/` — Static reference assets

## Running the App
- **Dev server**: `npm run dev` (Vite on port 5000)
- **Build**: `npm run build` (tsc + vite build → `dist/`)
- **Preview**: `npm run preview`

## Workspace Features
- **File Explorer** — Right-side toggle panel (FolderOpen icon in top bar) showing full project tree with colored file icons; clicking a file opens a Monaco editor tab
- **Monaco Editor** — Full VS Code-style editor rendered when a file tab is active; language is auto-detected from file extension
- **VS Code-style tabs** — Tab bar supports Preview, Console, Database, Publishing, Auth tool tabs + file tabs; files open from the explorer
- **Library panel** — Right-side toggle panel (Library icon in top bar) showing component/template library
- **Tools grid** — Default center view when no tab is active (Preview, Console, Database, Publishing, Auth cards)
- **Agent chat** — Left panel AI assistant with markdown, checkpoints, action feed
- **LogoIntro** — 2-second animated loading screen on every workspace visit (intentional)

## Key Components
- `workspace.tsx` — Main IDE layout (top bar, 3-panel PanelGroup, tab system, all state)
- `FileTreePanel.tsx` — File explorer panel with tree of FileNode objects and `onFileOpen` callback
- `LibraryPanel.tsx` — Template/component library side panel
- `ConsolePanel.tsx` — Mock terminal panel
- `DatabasePanel.tsx` — Database browser panel
- `PublishingPanel.tsx` / `AuthPanel.tsx` — Publish and auth panels

## Key Dependencies
- `@monaco-editor/react` — Code editor (used for file tabs in workspace)
- `react-resizable-panels` — Resizable layout panels
- `react-diff-viewer-continued` — Diff display
- `@radix-ui/*` — Accessible UI primitives
- `lucide-react`, `react-icons` — Icons
- `recharts` — Charts
- `wouter` — Client-side routing
- `vaul` — Drawer component
