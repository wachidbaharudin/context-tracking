# Context Tracking - Quick MVP Tasks

**Created:** February 5, 2026  
**Goal:** Minimal viable product for testing core functionality  
**Estimated Timeline:** 1-2 weeks

---

## High Priority (Core MVP)

| #   | Task                  | Description                                              | Status  |
| --- | --------------------- | -------------------------------------------------------- | ------- |
| 1   | Project Setup         | Initialize Vite + React + TypeScript + Tailwind CSS      | Pending |
| 2   | Automerge Integration | Set up Automerge with IndexedDB persistence              | Pending |
| 3   | Data Models           | Define TypeScript interfaces (Context, ActionItem, Link) | Pending |
| 4   | Context CRUD          | Create/Read/Update/Delete contexts with Automerge        | Pending |
| 5   | UI Layout             | Sidebar + Main content area (folder-like structure)      | Pending |
| 6   | Context List          | Display contexts grouped by status (ongoing/completed)   | Pending |
| 7   | Context Detail View   | Show selected context with sections for items & links    | Pending |
| 8   | Action Items CRUD     | Create/toggle status/edit/delete action items            | Pending |

---

## Medium Priority (Enhanced MVP)

| #   | Task              | Description                                             | Status  |
| --- | ----------------- | ------------------------------------------------------- | ------- |
| 9   | Links CRUD        | Add/edit/delete links with URL validation               | Pending |
| 10  | Context Status    | Toggle ongoing/completed, auto-detect stalled (7+ days) | Pending |
| 11  | Offline Detection | Show online/offline indicator in UI                     | Pending |
| 12  | Basic Styling     | Clean functional UI (light theme only)                  | Pending |

---

## Deferred (Post-MVP)

- Google Drive OAuth & integration
- Document/Spreadsheet management
- Embedded document viewer
- Dark theme / theme switching
- Drag-and-drop reordering
- Search functionality
- Multi-device sync
- Mobile responsiveness

---

## Tech Stack (MVP)

| Layer      | Technology                |
| ---------- | ------------------------- |
| Frontend   | React 18 + TypeScript     |
| Build Tool | Vite                      |
| State/Sync | Automerge (CRDT)          |
| Storage    | IndexedDB (via Automerge) |
| Styling    | Tailwind CSS              |

---

## Data Models (MVP)

```typescript
interface Context {
  id: string;
  name: string;
  description?: string;
  status: 'ongoing' | 'completed';
  color?: string;
  actionItems: ActionItem[];
  links: Link[];
  createdAt: string;
  updatedAt: string;
}

interface ActionItem {
  id: string;
  title: string;
  status: 'pending' | 'ongoing' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  addedAt: string;
}
```

---

## Success Criteria for MVP

- [ ] User can create, view, edit, and delete contexts
- [ ] User can add/toggle/delete action items within a context
- [ ] User can add/delete links within a context
- [ ] Data persists in browser (IndexedDB via Automerge)
- [ ] App works offline (local-first)
- [ ] Clean, usable UI

---

_Reference: PRD.md_
