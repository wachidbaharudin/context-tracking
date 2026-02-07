/**
 * POC Document type definitions for demonstrating Automerge data types
 */

/** Nested map item for MapPOC */
export interface NestedMapItem {
  name: string;
  count: number;
  tags: string[];
}

/** Todo item for ListPOC */
export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

/** Conflict demo values */
export interface ConflictDemoValues {
  title: string;
  priority: number;
}

/**
 * POC Document structure containing all Automerge data types
 * Each section is used by its respective POC component
 */
export interface POCDocument {
  // Map POC - demonstrates key-value operations
  simpleMap: Record<string, string>;
  nestedMap: Record<string, NestedMapItem>;

  // List POC - demonstrates array operations
  todoList: TodoItem[];

  // Text POC - demonstrates collaborative text
  // Note: Using string for now, will use Automerge.Text in the component
  plainText: string;

  // Rich Text POC - demonstrates formatted text with marks
  richText: string;

  // Conflicts POC - demonstrates conflict detection
  conflictDemo: ConflictDemoValues;
}

/**
 * Initial POC document state
 */
export function createInitialPOCDocument(): POCDocument {
  return {
    simpleMap: {},
    nestedMap: {},
    todoList: [],
    plainText: '',
    richText: '',
    conflictDemo: {
      title: 'Default Title',
      priority: 1,
    },
  };
}
