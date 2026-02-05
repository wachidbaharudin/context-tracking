# Code Style Guidelines

**Context Tracking Application**  
**Version:** 1.0  
**Last Updated:** February 5, 2026

---

## 1. Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI primitives (Button, Input, Modal, etc.)
│   └── features/        # Feature-specific components
│       ├── contexts/    # Context-related components
│       ├── action-items/# Action item components
│       └── links/       # Link components
├── hooks/               # Custom React hooks
├── lib/                 # Core utilities and configurations
│   ├── automerge/       # Automerge setup and helpers
│   └── utils/           # General utility functions
├── types/               # TypeScript type definitions
├── stores/              # State management (Automerge documents)
├── constants/           # App-wide constants
└── styles/              # Global styles (if needed beyond Tailwind)
```

### File Naming Conventions

| Type       | Convention                                  | Example                                     |
| ---------- | ------------------------------------------- | ------------------------------------------- |
| Components | PascalCase                                  | `ContextList.tsx`                           |
| Hooks      | camelCase with `use` prefix                 | `useAutomerge.ts`                           |
| Utilities  | camelCase                                   | `formatDate.ts`                             |
| Types      | PascalCase                                  | `Context.ts`                                |
| Constants  | camelCase (file), SCREAMING_SNAKE (exports) | `status.ts` → `export const STATUS_ONGOING` |
| Test files | Same as source + `.test`                    | `ContextList.test.tsx`                      |

---

## 2. TypeScript Guidelines

### 2.1 Strict Mode

Always use strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2.2 Type Definitions

```typescript
// GOOD: Use interfaces for object shapes
interface Context {
  id: string;
  name: string;
  status: ContextStatus;
}

// GOOD: Use type aliases for unions, primitives, utilities
type ContextStatus = 'ongoing' | 'completed';
type ContextId = string;

// GOOD: Export types from dedicated files
// types/context.ts
export interface Context { ... }
export type ContextStatus = 'ongoing' | 'completed';

// BAD: Inline complex types
function getContext(ctx: { id: string; name: string; status: 'ongoing' | 'completed' }) { }
```

### 2.3 Avoid `any`

```typescript
// BAD
function process(data: any) {}

// GOOD: Use unknown and narrow
function process(data: unknown) {
  if (isContext(data)) {
    // data is now typed as Context
  }
}

// GOOD: Use generics when type varies
function process<T>(data: T): T {}
```

### 2.4 Prefer `const` Assertions

```typescript
// GOOD: For literal types
const STATUS = {
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS]; // 'ongoing' | 'completed'
```

---

## 3. React Guidelines

### 3.1 Component Structure

```typescript
// ComponentName.tsx

// 1. Imports (external, then internal, then types)
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import type { Context } from '@/types';

// 2. Types/Interfaces for this component
interface ContextCardProps {
  context: Context;
  onSelect: (id: string) => void;
  isActive?: boolean;
}

// 3. Component definition (prefer function declaration)
export function ContextCard({ context, onSelect, isActive = false }: ContextCardProps) {
  // 3a. Hooks first
  const [isHovered, setIsHovered] = useState(false);

  // 3b. Derived state / computations
  const statusColor = context.status === 'ongoing' ? 'green' : 'gray';

  // 3c. Callbacks
  const handleClick = useCallback(() => {
    onSelect(context.id);
  }, [context.id, onSelect]);

  // 3d. Effects (if any)

  // 3e. Render
  return (
    <div onClick={handleClick}>
      {/* ... */}
    </div>
  );
}
```

### 3.2 Component Guidelines

```typescript
// GOOD: Single responsibility
export function ContextList({ contexts }: Props) { }
export function ContextCard({ context }: Props) { }

// BAD: Component doing too much
export function ContextListWithCardsAndFiltersAndSorting() { }

// GOOD: Explicit prop types
interface Props {
  contexts: Context[];
  onSelect: (id: string) => void;
}

// BAD: Spreading unknown props
function Component(props: any) {
  return <div {...props} />;
}

// GOOD: Use children prop for composition
interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}
```

### 3.3 Hooks

```typescript
// Custom hooks go in src/hooks/
// Prefix with 'use'

// useContexts.ts
export function useContexts() {
  const [contexts, setContexts] = useState<Context[]>([]);

  // Return object for multiple values
  return {
    contexts,
    isLoading,
    createContext,
    updateContext,
    deleteContext,
  };
}

// GOOD: Single-purpose hooks
export function useOnlineStatus() {}
export function useAutomergeDoc<T>() {}

// BAD: God hooks
export function useEverything() {}
```

### 3.4 Event Handlers

```typescript
// GOOD: Prefix with 'handle' in components
const handleClick = () => {};
const handleSubmit = () => {};

// GOOD: Prefix with 'on' in props
interface Props {
  onClick: () => void;
  onSubmit: (data: FormData) => void;
}
```

---

## 4. Automerge Guidelines

### 4.1 Document Structure

```typescript
// Keep Automerge document structure flat where possible
interface AppDocument {
  contexts: Record<string, Context>;
  settings: UserSettings;
}

// GOOD: Use Record for collections (enables efficient updates)
contexts: Record<string, Context>;

// BAD: Arrays for frequently-updated collections
contexts: Context[];
```

### 4.2 Updates

```typescript
// GOOD: Use Automerge.change with descriptive messages
import { change } from '@automerge/automerge';

const newDoc = change(doc, 'Add new context', (d) => {
  d.contexts[id] = newContext;
});

// GOOD: Batch related changes
const newDoc = change(doc, 'Update context status and timestamp', (d) => {
  d.contexts[id].status = 'completed';
  d.contexts[id].updatedAt = new Date().toISOString();
});

// BAD: Multiple separate changes for related updates
const doc1 = change(doc, 'Update status', (d) => {
  d.contexts[id].status = 'completed';
});
const doc2 = change(doc1, 'Update timestamp', (d) => {
  d.contexts[id].updatedAt = now;
});
```

### 4.3 Persistence

```typescript
// Centralize IndexedDB operations in lib/automerge/
// src/lib/automerge/persistence.ts

export async function saveDocument(doc: AppDocument): Promise<void> {}
export async function loadDocument(): Promise<AppDocument | null> {}

// Use debouncing for saves to avoid excessive writes
const debouncedSave = debounce(saveDocument, 1000);
```

---

## 5. Styling Guidelines (Tailwind CSS)

### 5.1 Class Organization

```tsx
// Order: layout → sizing → spacing → typography → colors → effects → states

// GOOD
<div className="flex items-center w-full p-4 text-sm text-gray-700 bg-white rounded-lg shadow hover:bg-gray-50">

// For long class lists, use template literals or cn() utility
import { cn } from '@/lib/utils';

<div className={cn(
  // Layout
  'flex items-center justify-between',
  // Sizing & Spacing
  'w-full p-4 gap-2',
  // Typography
  'text-sm font-medium',
  // Colors
  'text-gray-700 bg-white',
  // Effects
  'rounded-lg shadow',
  // States
  'hover:bg-gray-50',
  // Conditional
  isActive && 'border-2 border-blue-500',
)}>
```

### 5.2 Component Variants

```typescript
// Use cva (class-variance-authority) for component variants
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

export function Button({ variant, size, children }: ButtonProps) {
  return <button className={buttonVariants({ variant, size })}>{children}</button>;
}
```

### 5.3 Design Tokens

```typescript
// Define semantic color tokens in tailwind.config.js
// Use semantic names, not color names

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Semantic tokens
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: 'var(--color-primary)',
        muted: 'var(--color-muted)',
        // Status colors
        'status-ongoing': '#22c55e',
        'status-stalled': '#f59e0b',
        'status-completed': '#6b7280',
      },
    },
  },
};
```

---

## 6. Error Handling

### 6.1 Error Boundaries

```typescript
// Wrap major sections with error boundaries
<ErrorBoundary fallback={<ContextErrorFallback />}>
  <ContextList />
</ErrorBoundary>
```

### 6.2 Async Operations

```typescript
// GOOD: Handle all states
interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

// GOOD: Use try-catch with specific error handling
async function saveContext(context: Context) {
  try {
    await persistContext(context);
  } catch (error) {
    if (error instanceof StorageError) {
      // Handle storage-specific error
    }
    throw error; // Re-throw unknown errors
  }
}
```

### 6.3 User Feedback

```typescript
// Always provide user feedback for:
// - Successful operations (toast/notification)
// - Failed operations (error message with action)
// - Loading states (skeleton/spinner)

// GOOD
const handleDelete = async () => {
  try {
    await deleteContext(id);
    toast.success('Context deleted');
  } catch (error) {
    toast.error('Failed to delete context. Please try again.');
  }
};
```

---

## 7. Testing Guidelines

### 7.1 File Structure

```
src/
├── components/
│   └── ContextCard/
│       ├── ContextCard.tsx
│       └── ContextCard.test.tsx  # Co-located tests
└── lib/
    └── utils/
        ├── formatDate.ts
        └── formatDate.test.ts
```

### 7.2 Test Naming

```typescript
// Describe the component/function, then the behavior
describe('ContextCard', () => {
  it('renders context name and status', () => {});
  it('calls onSelect when clicked', () => {});
  it('shows stalled indicator for inactive contexts', () => {});
});

describe('formatDate', () => {
  it('formats ISO date to readable string', () => {});
  it('returns "Today" for current date', () => {});
});
```

### 7.3 What to Test

```typescript
// DO test:
// - User interactions
// - Conditional rendering
// - Data transformations
// - Error states
// - Accessibility (keyboard nav, ARIA)

// DON'T test:
// - Implementation details
// - Third-party libraries
// - Styles (unless critical)
```

---

## 8. Git Conventions

### 8.1 Commit Messages

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `style`: Formatting, no code change
- `docs`: Documentation
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(contexts): add create context modal
fix(action-items): prevent duplicate items on rapid clicks
refactor(automerge): extract persistence logic to separate module
docs: update README with setup instructions
```

### 8.2 Branch Naming

```
<type>/<short-description>

Examples:
feat/context-crud
fix/offline-sync-issue
refactor/automerge-hooks
```

---

## 9. Import Order

```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. External libraries
import { change } from '@automerge/automerge';

// 3. Internal aliases (@/)
import { Button } from '@/components/ui/Button';
import { useContexts } from '@/hooks/useContexts';
import { cn } from '@/lib/utils';

// 4. Relative imports
import { ContextCardMenu } from './ContextCardMenu';

// 5. Types (always last, with 'type' keyword)
import type { Context } from '@/types';
```

---

## 10. Performance Guidelines

### 10.1 React Optimization

```typescript
// Use React.memo for expensive pure components
export const ContextCard = React.memo(function ContextCard({ context }: Props) {
  // ...
});

// Use useCallback for callbacks passed to children
const handleSelect = useCallback((id: string) => {
  setSelectedId(id);
}, []);

// Use useMemo for expensive computations
const sortedContexts = useMemo(
  () => contexts.sort((a, b) => a.name.localeCompare(b.name)),
  [contexts]
);
```

### 10.2 Bundle Size

```typescript
// Use dynamic imports for large components/features
const DocumentViewer = lazy(() => import('./DocumentViewer'));

// Import only what you need
import { format } from 'date-fns'; // GOOD
import * as dateFns from 'date-fns'; // BAD
```

---

## 11. Accessibility

```typescript
// Always include:
// - Semantic HTML elements
// - ARIA labels for icons/buttons without text
// - Keyboard navigation support
// - Focus management for modals

// GOOD
<button
  aria-label="Delete context"
  onClick={handleDelete}
>
  <TrashIcon />
</button>

// GOOD: Semantic structure
<nav aria-label="Contexts">
  <ul>
    <li><a href="#">Context 1</a></li>
  </ul>
</nav>

// GOOD: Focus trap in modals
<Modal onClose={handleClose} initialFocus={inputRef}>
  <input ref={inputRef} />
</Modal>
```

---

## Quick Reference Checklist

- [ ] TypeScript strict mode enabled
- [ ] No `any` types (use `unknown` + type guards)
- [ ] Components have explicit prop interfaces
- [ ] Custom hooks prefixed with `use`
- [ ] Event handlers prefixed with `handle` (internal) / `on` (props)
- [ ] Automerge changes have descriptive messages
- [ ] Tailwind classes organized consistently
- [ ] Errors handled with user feedback
- [ ] Commits follow conventional format
- [ ] Imports ordered correctly

---

_This guide is a living document. Update as patterns evolve._
