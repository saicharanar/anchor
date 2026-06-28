# Anchor

Anchor is a local-first React PWA for private life planning. It helps organize goals, routines, checklists, expenses, progress, notes, and personal responsibilities without a backend or login.

## Highlights

- Offline-first PWA with installable manifest and service worker
- IndexedDB storage through Dexie
- Default personal areas including Health, Finance, Career, and Personal
- Goal and checklist tracking with task-based progress
- Finance dashboard with spent and credited totals
- JSON export, import, and local data reset
- Responsive mobile-focused UI

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Dexie
- React Hook Form
- Zod
- Recharts
- vite-plugin-pwa

## Run Locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run lint
npm run build
```

## Privacy Model

Anchor stores workspace data locally in the browser. The MVP does not include login, cloud sync, collaboration, or backend services.
