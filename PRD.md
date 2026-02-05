# Product Requirements Document (PRD)

# Context Tracking Application

**Version:** 1.0  
**Date:** February 5, 2026  
**Status:** Draft

---

## 1. Overview

### 1.1 Problem Statement

Professionals juggling multiple responsibilities—freelance projects, organizational duties, and full-time employment—struggle to track progress across different contexts in a unified manner. Information gets scattered across tools, leading to missed action items, lost documents, and fragmented workflows.

### 1.2 Solution

Context Tracking is a local-first application that enables users to organize and track multiple work contexts (projects, responsibilities, roles) in a folder-like interface. Each context can sync with Google Drive for document storage while maintaining offline functionality through Automerge CRDT technology.

### 1.3 Target Users

- Freelancers managing multiple clients
- Professionals with side projects alongside full-time jobs
- Individuals with organizational/volunteer responsibilities
- Anyone managing parallel workstreams requiring separate tracking

---

## 2. Goals & Success Metrics

### 2.1 Goals

1. **Unified Tracking:** Single interface to manage all contexts without context-switching between tools
2. **Offline-First:** Full functionality without internet; seamless sync when online
3. **Google Integration:** Leverage Google Drive/Docs/Sheets for document management while keeping the app as the control center
4. **Zero Data Loss:** All progress, action items, and references captured and persisted

### 2.2 Success Metrics

| Metric                      | Target                                  |
| --------------------------- | --------------------------------------- |
| Contexts created per user   | ≥ 3 active contexts                     |
| Action item completion rate | ≥ 70%                                   |
| Offline usage sessions      | ≥ 30% of total sessions                 |
| Document access within app  | ≥ 50% of linked documents viewed in-app |

---

## 3. Core Features

### 3.1 Context Management

#### 3.1.1 Folder-Like Interface

- **Hierarchical Structure:** Contexts displayed as folders in a tree/list view
- **Context Properties:**
  - Name (required)
  - Description (optional)
  - Status: `ongoing` | `completed`
  - Color/Icon (optional, for visual distinction)
  - Created date (auto-generated)
  - Last modified date (auto-updated)

#### 3.1.2 Context Operations

| Operation | Description                                    |
| --------- | ---------------------------------------------- |
| Create    | New context with name and optional description |
| Edit      | Modify name, description, color/icon           |
| Archive   | Mark as completed (moves to archived section)  |
| Reopen    | Change completed context back to ongoing       |
| Delete    | Soft delete with 30-day recovery period        |

#### 3.1.3 Context Status Indicators

```
[●] Ongoing    - Active context with pending items
[◐] Stalled    - Ongoing but no activity in 7+ days (auto-detected)
[✓] Completed  - Manually marked as done
```

---

### 3.2 Google Drive Integration

#### 3.2.1 Account Linking

- Connect one Google account per context (different contexts can use different accounts)
- OAuth 2.0 flow with Drive, Docs, and Sheets scopes
- Token stored locally (encrypted)

#### 3.2.2 Folder Initialization

When a context is linked to Google Drive:

1. Create a root folder in Drive: `ContextTracker/{Context Name}`
2. Create subfolders:
   ```
   ContextTracker/
   └── {Context Name}/
       ├── Documents/
       ├── Spreadsheets/
       └── Attachments/
   ```
3. Store a manifest file (`.context-meta.json`) for sync metadata

#### 3.2.3 Sync Behavior

| Scenario | Behavior                                                   |
| -------- | ---------------------------------------------------------- |
| Online   | Real-time sync of metadata; documents accessed via API     |
| Offline  | Local cache of document metadata; queue changes for sync   |
| Conflict | Last-write-wins for metadata; documents are Google-managed |

---

### 3.3 Action Items

#### 3.3.1 Properties

| Field       | Type     | Required | Description                           |
| ----------- | -------- | -------- | ------------------------------------- |
| `id`        | UUID     | Auto     | Unique identifier                     |
| `title`     | String   | Yes      | Action item description               |
| `status`    | Enum     | Yes      | `pending` \| `ongoing` \| `completed` |
| `priority`  | Enum     | No       | `low` \| `medium` \| `high`           |
| `dueDate`   | Date     | No       | Target completion date                |
| `notes`     | String   | No       | Additional details                    |
| `createdAt` | DateTime | Auto     | Creation timestamp                    |
| `updatedAt` | DateTime | Auto     | Last modification                     |

#### 3.3.2 Operations

- Create action item within a context
- Edit action item properties
- Toggle status: `pending` ↔ `ongoing` ↔ `completed`
- Reorder items (drag-and-drop)
- Filter by status
- Delete (soft delete)

#### 3.3.3 Display

```
Context: Freelance Project Alpha
├── [●] Review client feedback         (ongoing, high)
├── [ ] Update wireframes              (pending, medium)
├── [ ] Send invoice                   (pending, due: Feb 10)
└── [✓] Initial mockups                (completed)
```

---

### 3.4 Document Management

#### 3.4.1 Google Documents

| Feature | Description                                              |
| ------- | -------------------------------------------------------- |
| Add     | Link existing or create new Google Doc in context folder |
| View    | Embedded read-only preview within the app                |
| Edit    | Opens Google Docs in browser/app (external)              |
| Sync    | Metadata (title, last modified) synced automatically     |

#### 3.4.2 Google Spreadsheets

| Feature | Description                                                |
| ------- | ---------------------------------------------------------- |
| Add     | Link existing or create new Google Sheet in context folder |
| View    | Embedded read-only preview within the app                  |
| Edit    | Opens Google Sheets in browser/app (external)              |
| Sync    | Metadata synced automatically                              |

#### 3.4.3 Implementation Notes

- Use Google Drive Embed API for previews
- Offline: Show cached thumbnail + "Available when online" message
- Store document references (ID, title, type, lastModified) in Automerge doc

---

### 3.5 Link Storage

#### 3.5.1 Properties

| Field         | Type     | Required                           |
| ------------- | -------- | ---------------------------------- |
| `id`          | UUID     | Auto                               |
| `url`         | String   | Yes                                |
| `title`       | String   | Yes (auto-fetched if not provided) |
| `description` | String   | No                                 |
| `favicon`     | String   | Auto-fetched                       |
| `addedAt`     | DateTime | Auto                               |

#### 3.5.2 Features

- Add links with auto-fetch of title and favicon
- Organize links within context
- Quick-copy URL
- Open in browser
- Offline: Links stored locally, accessible but not fetchable

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Layer           | Technology                        |
| --------------- | --------------------------------- |
| Frontend        | React 18+ with TypeScript         |
| Build Tool      | Vite                              |
| State/Sync      | Automerge (CRDT)                  |
| Storage         | IndexedDB (via Automerge)         |
| API Integration | Google APIs (Drive, Docs, Sheets) |
| Styling         | TBD (Tailwind CSS recommended)    |

### 4.2 Data Architecture

#### 4.2.1 Automerge Document Structure

```typescript
interface AppState {
  contexts: {
    [contextId: string]: Context;
  };
  settings: UserSettings;
}

interface Context {
  id: string;
  name: string;
  description?: string;
  status: 'ongoing' | 'completed';
  color?: string;
  icon?: string;
  googleDrive?: {
    accountEmail: string;
    folderId: string;
    connected: boolean;
    lastSynced: string; // ISO timestamp
  };
  actionItems: ActionItem[];
  documents: DocumentRef[];
  spreadsheets: SpreadsheetRef[];
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

interface DocumentRef {
  id: string;
  googleId: string;
  title: string;
  type: 'document' | 'spreadsheet';
  thumbnailUrl?: string;
  lastModified: string;
  addedAt: string;
}

interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  addedAt: string;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'list' | 'grid';
}
```

### 4.3 Offline-First Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
├─────────────────────────────────────────────────────────┤
│                   Automerge Document                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Contexts   │  │   Action    │  │  Document   │     │
│  │             │  │   Items     │  │    Refs     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                     IndexedDB                            │
│              (Automerge persistence)                     │
├─────────────────────────────────────────────────────────┤
│                   Sync Layer                             │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │   Automerge Sync    │  │  Google Drive API   │       │
│  │   (future: P2P)     │  │  (documents only)   │       │
│  └─────────────────────┘  └─────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Google API Scopes Required

```
https://www.googleapis.com/auth/drive.file      # Create/access app-created files
https://www.googleapis.com/auth/drive.readonly  # Read file metadata
https://www.googleapis.com/auth/documents       # Google Docs access
https://www.googleapis.com/auth/spreadsheets    # Google Sheets access
```

---

## 5. User Interface

### 5.1 Main Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Context Tracker                              [Settings] [?]   │
├──────────────────┬─────────────────────────────────────────────┤
│                  │                                             │
│  CONTEXTS        │  Freelance Project Alpha           [●]      │
│  ───────────     │  ─────────────────────────────────────      │
│  [+] New Context │                                             │
│                  │  Action Items                    [+ Add]    │
│  ● Freelance     │  ┌─────────────────────────────────────┐   │
│    Project Alpha │  │ [●] Review client feedback    HIGH  │   │
│  ● Org Work      │  │ [ ] Update wireframes         MED   │   │
│  ● Company XYZ   │  │ [ ] Send invoice         Due: Feb 10│   │
│                  │  └─────────────────────────────────────┘   │
│  COMPLETED       │                                             │
│  ───────────     │  Documents                       [+ Add]    │
│  ✓ Old Project   │  ┌──────┐ ┌──────┐ ┌──────┐               │
│                  │  │ Doc  │ │ Doc  │ │Sheet │               │
│                  │  │  1   │ │  2   │ │  1   │               │
│                  │  └──────┘ └──────┘ └──────┘               │
│                  │                                             │
│                  │  Links                           [+ Add]    │
│                  │  🔗 Project Brief - notion.so              │
│                  │  🔗 Client Portal - client.com             │
│                  │                                             │
└──────────────────┴─────────────────────────────────────────────┘
```

### 5.2 Key Screens

| Screen          | Purpose                                        |
| --------------- | ---------------------------------------------- |
| Context List    | Sidebar showing all contexts grouped by status |
| Context Detail  | Main view with action items, documents, links  |
| Document Viewer | Modal/panel showing embedded Google Doc/Sheet  |
| Settings        | Account connections, theme, preferences        |
| Google Auth     | OAuth flow for connecting Google accounts      |

---

## 6. User Flows

### 6.1 Creating a New Context

```
1. User clicks [+ New Context]
2. Modal appears with:
   - Name input (required)
   - Description textarea (optional)
   - Color picker (optional)
3. User fills details, clicks [Create]
4. Context created locally (Automerge)
5. Context appears in sidebar as "ongoing"
6. Optional: Prompt to connect Google Drive
```

### 6.2 Connecting Google Drive to Context

```
1. User opens context settings or clicks [Connect Google Drive]
2. OAuth popup opens for Google account selection
3. User grants permissions
4. App creates folder structure in Drive:
   └── ContextTracker/{Context Name}/
5. Folder ID stored in context metadata
6. Success notification shown
7. Context now shows "Drive connected" indicator
```

### 6.3 Adding a Document

```
1. User clicks [+ Add] in Documents section
2. Options presented:
   a. Create new Google Doc
   b. Create new Google Sheet
   c. Link existing document
3a. If creating new:
    - Prompt for document name
    - Create via Google API in context folder
    - Add reference to Automerge
3b. If linking existing:
    - Google Picker UI to select document
    - Move/copy to context folder (optional)
    - Add reference to Automerge
4. Document appears in context with thumbnail
```

### 6.4 Working Offline

```
1. App detects offline status
2. Indicator shows "Working offline"
3. All local operations work normally:
   - Create/edit contexts
   - Manage action items
   - View cached document metadata
4. Google document previews show "Available online"
5. Changes queued in Automerge
6. When online:
   - Sync indicator activates
   - Changes merged
   - Google metadata refreshed
```

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric             | Target      |
| ------------------ | ----------- |
| Initial load       | < 2 seconds |
| Context switch     | < 100ms     |
| Action item toggle | < 50ms      |
| Offline detection  | < 1 second  |

### 7.2 Security

- OAuth tokens encrypted at rest
- No sensitive data transmitted to third-party servers
- Local-first: data stays on device by default
- Google API calls use HTTPS

### 7.3 Compatibility

- Modern browsers: Chrome, Firefox, Safari, Edge (last 2 versions)
- Desktop-first design
- Responsive for tablet (mobile as stretch goal)

---

## 8. Future Considerations (Out of Scope for V1)

| Feature              | Description                               |
| -------------------- | ----------------------------------------- |
| Multi-device Sync    | Sync Automerge docs across devices        |
| Collaboration        | Share contexts with other users           |
| Mobile App           | Native iOS/Android apps                   |
| Calendar Integration | Sync due dates with Google Calendar       |
| Notifications        | Reminders for due dates and stalled items |
| Templates            | Pre-built context templates               |
| Search               | Full-text search across all contexts      |
| Import/Export        | Backup and restore functionality          |

---

## 9. Open Questions

1. **Multi-account handling:** Should users be able to connect multiple Google accounts globally, or strictly one per context?

2. **Conflict resolution:** When Google Doc metadata conflicts with local cache, which takes precedence?

3. **Storage limits:** Should we implement quotas for linked documents per context?

4. **Archival:** Should completed contexts be auto-archived after a period?

5. **Sharing:** Is read-only sharing of contexts a V1 requirement?

---

## 10. Milestones

### Phase 1: Foundation (Weeks 1-2)

- [ ] Project setup (Vite + React + TypeScript)
- [ ] Automerge integration with IndexedDB
- [ ] Basic context CRUD operations
- [ ] Folder-like UI structure

### Phase 2: Core Features (Weeks 3-4)

- [ ] Action items management
- [ ] Links storage
- [ ] Context status management
- [ ] Offline detection and handling

### Phase 3: Google Integration (Weeks 5-6)

- [ ] OAuth implementation
- [ ] Drive folder creation
- [ ] Document/Spreadsheet linking
- [ ] Embedded document viewer

### Phase 4: Polish (Weeks 7-8)

- [ ] UI/UX refinements
- [ ] Error handling
- [ ] Performance optimization
- [ ] Testing and bug fixes

---

## 11. Appendix

### A. Glossary

| Term        | Definition                                                   |
| ----------- | ------------------------------------------------------------ |
| Context     | A distinct area of responsibility or project being tracked   |
| Action Item | A task or to-do within a context                             |
| CRDT        | Conflict-free Replicated Data Type (Automerge's foundation)  |
| Local-first | Architecture where data is stored locally, optionally synced |

### B. References

- [Automerge Documentation](https://automerge.org/)
- [Google Drive API](https://developers.google.com/drive/api)
- [Google Docs API](https://developers.google.com/docs/api)
- [Vite Documentation](https://vitejs.dev/)

---

_Document maintained by: [Product Team]_  
_Last updated: February 5, 2026_
