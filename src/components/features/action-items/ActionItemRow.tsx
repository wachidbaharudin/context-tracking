import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { ActionItem, Priority } from '@/types';

interface ActionItemRowProps {
  item: ActionItem;
  onToggleStatus: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Omit<ActionItem, 'id' | 'createdAt'>>) => void;
  onAddChecklistItem: (text: string) => void;
  onToggleChecklistItem: (checklistItemId: string) => void;
  onDeleteChecklistItem: (checklistItemId: string) => void;
  onUpdateChecklistItem: (checklistItemId: string, text: string) => void;
}

const statusIcons: Record<string, string> = {
  pending: '○',
  ongoing: '◐',
  completed: '●',
};

const priorityColors: Record<string, string> = {
  high: 'text-red-500 bg-red-50/50',
  medium: 'text-amber-500 bg-amber-50/50',
  low: 'text-gray-400 bg-gray-50',
};

export function ActionItemRow({
  item,
  onToggleStatus,
  onDelete,
  onUpdate,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  onUpdateChecklistItem,
}: ActionItemRowProps) {
  // Add checklist state
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);

  // Edit action item state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<Priority | ''>('');
  const [editDueDate, setEditDueDate] = useState('');
  const [titleError, setTitleError] = useState('');
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  // Edit checklist item state
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editChecklistText, setEditChecklistText] = useState('');
  const [checklistError, setChecklistError] = useState('');
  const checklistInputRef = useRef<HTMLInputElement>(null);

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  // Focus checklist input when editing starts
  useEffect(() => {
    if (editingChecklistId && checklistInputRef.current) {
      checklistInputRef.current.focus();
      checklistInputRef.current.select();
    }
  }, [editingChecklistId]);

  // --- Action Item Edit Handlers ---
  const handleStartEdit = () => {
    setEditTitle(item.title);
    setEditPriority(item.priority || '');
    setEditDueDate(item.dueDate || '');
    setTitleError('');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      setTitleError('Title is required');
      return;
    }
    onUpdate({
      title: editTitle.trim(),
      priority: editPriority || undefined,
      dueDate: editDueDate || undefined,
    });
    setIsEditing(false);
    setTitleError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTitleError('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // --- Checklist Item Edit Handlers ---
  const handleStartChecklistEdit = (checklistItemId: string, text: string) => {
    setEditingChecklistId(checklistItemId);
    setEditChecklistText(text);
    setChecklistError('');
  };

  const handleSaveChecklistEdit = () => {
    if (!editChecklistText.trim()) {
      setChecklistError('Text is required');
      return;
    }
    if (editingChecklistId) {
      onUpdateChecklistItem(editingChecklistId, editChecklistText.trim());
    }
    setEditingChecklistId(null);
    setChecklistError('');
  };

  const handleCancelChecklistEdit = () => {
    setEditingChecklistId(null);
    setChecklistError('');
  };

  const handleChecklistEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveChecklistEdit();
    }
    if (e.key === 'Escape') {
      handleCancelChecklistEdit();
    }
  };

  const handleChecklistEditBlur = () => {
    // Small delay to allow clicking cancel button
    setTimeout(() => {
      if (editingChecklistId) {
        handleSaveChecklistEdit();
      }
    }, 150);
  };

  // --- Add Checklist Handlers ---
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    onAddChecklistItem(newChecklistText.trim());
    setNewChecklistText('');
  };

  const handleAddChecklistKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChecklistItem();
    }
    if (e.key === 'Escape') {
      setIsAddingChecklist(false);
      setNewChecklistText('');
    }
  };

  const checklist = item.checklist ?? [];

  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-gray-100 bg-white md:p-3 md:rounded-md',
        'transition-colors',
        !isEditing && 'active:bg-gray-50 md:hover:border-gray-200',
        item.status === 'completed' && 'opacity-50'
      )}
    >
      {/* Main action item header */}
      <div className="flex items-start gap-3">
        {/* Status toggle - slightly smaller, de-emphasized */}
        <button
          onClick={onToggleStatus}
          className={cn(
            'text-lg flex-shrink-0 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-lg',
            'active:bg-gray-100 md:hover:bg-gray-100 transition-colors',
            'md:text-base md:w-5 md:h-5 md:min-w-0 md:min-h-0 md:rounded md:mt-0.5',
            item.status === 'completed' && 'text-green-500',
            item.status === 'ongoing' && 'text-blue-500',
            item.status === 'pending' && 'text-gray-300'
          )}
          aria-label={`Status: ${item.status}. Click to change.`}
        >
          {statusIcons[item.status]}
        </button>

        <div className="flex-1 min-w-0 py-2 md:py-0">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-3 md:space-y-2">
              <div>
                <textarea
                  ref={titleInputRef}
                  value={editTitle}
                  onChange={(e) => {
                    setEditTitle(e.target.value);
                    setTitleError('');
                  }}
                  onKeyDown={handleTitleKeyDown}
                  rows={2}
                  placeholder="What needs to be done?"
                  className={cn(
                    'w-full rounded-lg border bg-white px-3 py-2',
                    'text-base placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none',
                    'md:rounded-md md:px-2 md:py-1.5 md:text-sm',
                    titleError ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {titleError && <p className="mt-1 text-sm text-red-600 md:text-xs">{titleError}</p>}
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:gap-2">
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as Priority | '')}
                  className={cn(
                    'min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2',
                    'text-base focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'md:min-h-0 md:h-9 md:w-auto md:rounded-md md:px-2 md:py-1 md:text-sm'
                  )}
                >
                  <option value="">No priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className={cn(
                    'min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2',
                    'text-base focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'md:min-h-0 md:h-9 md:w-auto md:rounded-md md:px-2 md:py-1 md:text-sm'
                  )}
                />

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="min-h-[44px] text-base md:min-h-0 md:h-9 md:text-sm"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="min-h-[44px] text-base md:min-h-0 md:h-9 md:text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <>
              <div className="flex flex-col gap-1 md:flex-row md:items-start md:gap-2">
                {/* Title - Level 3, primary focus */}
                <button
                  onClick={handleStartEdit}
                  className={cn(
                    'text-left text-base font-medium text-gray-900 whitespace-pre-wrap md:text-sm',
                    'hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors',
                    item.status === 'completed' && 'line-through text-gray-400 hover:text-gray-500'
                  )}
                >
                  {item.title}
                </button>
                {/* Priority badge - subtle, de-emphasized */}
                {item.priority && (
                  <span
                    className={cn(
                      'self-start text-[11px] font-medium px-1.5 py-0.5 rounded md:py-0',
                      priorityColors[item.priority]
                    )}
                  >
                    {item.priority}
                  </span>
                )}
              </div>
              {/* Due date - Level 5, tertiary */}
              {item.dueDate && (
                <div className="flex flex-col gap-1 mt-1 md:flex-row md:items-center md:gap-2 md:mt-0.5">
                  <span className="text-[11px] text-gray-400">
                    Due {new Date(item.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons - de-emphasized, appear on interaction */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Edit button */}
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStartEdit}
              className="min-w-[44px] min-h-[44px] w-11 h-11 text-gray-300 active:text-blue-500 md:hover:text-blue-500 md:w-auto md:h-auto md:min-w-0 md:min-h-0"
              aria-label="Edit action item"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="md:w-4 md:h-4"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </Button>
          )}

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="min-w-[44px] min-h-[44px] w-11 h-11 text-gray-300 active:text-red-500 md:hover:text-red-500 md:w-auto md:h-auto md:min-w-0 md:min-h-0"
            aria-label="Delete action item"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="md:w-4 md:h-4"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Checklist section - visually subordinate */}
      <div className="ml-14 mt-3 md:ml-8 md:mt-2">
        {checklist.length > 0 && (
          <div className="space-y-2 md:space-y-1">
            {checklist.map((checklistItem) => (
              <div
                key={checklistItem.id}
                className="flex items-center gap-3 group py-1 md:gap-2 md:py-0.5"
              >
                {/* Checklist toggle - subtle */}
                <button
                  onClick={() => onToggleChecklistItem(checklistItem.id)}
                  className={cn(
                    'min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg border-2 flex items-center justify-center flex-shrink-0',
                    'transition-colors active:scale-95',
                    'md:w-3.5 md:h-3.5 md:min-w-0 md:min-h-0 md:rounded md:border',
                    checklistItem.done
                      ? 'bg-green-400 border-green-400 text-white'
                      : 'border-gray-200 active:border-gray-300 md:hover:border-gray-300'
                  )}
                  aria-label={checklistItem.done ? 'Mark as not done' : 'Mark as done'}
                >
                  {checklistItem.done && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="md:w-[10px] md:h-[10px]"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {editingChecklistId === checklistItem.id ? (
                  // Edit Mode for Checklist Item
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <input
                        ref={checklistInputRef}
                        type="text"
                        value={editChecklistText}
                        onChange={(e) => {
                          setEditChecklistText(e.target.value);
                          setChecklistError('');
                        }}
                        onKeyDown={handleChecklistEditKeyDown}
                        onBlur={handleChecklistEditBlur}
                        className={cn(
                          'flex-1 text-base min-h-[44px] px-3 py-2 rounded-lg border bg-white',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500',
                          'md:text-sm md:min-h-0 md:px-2 md:py-1 md:rounded',
                          checklistError ? 'border-red-500' : 'border-gray-300'
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelChecklistEdit}
                        className="min-h-[44px] text-base px-3 md:min-h-0 md:text-xs md:px-2 md:h-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                    {checklistError && (
                      <p className="text-sm text-red-600 md:text-xs">{checklistError}</p>
                    )}
                  </div>
                ) : (
                  // View Mode for Checklist Item
                  <>
                    {/* Checklist text - Level 4/5, subordinate to main item */}
                    <button
                      onClick={() => handleStartChecklistEdit(checklistItem.id, checklistItem.text)}
                      className={cn(
                        'text-left text-sm flex-1 text-gray-600 md:text-sm',
                        'hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors',
                        checklistItem.done && 'line-through text-gray-300 hover:text-gray-400'
                      )}
                    >
                      {checklistItem.text}
                    </button>

                    {/* Edit checklist item button - very subtle */}
                    <button
                      onClick={() => handleStartChecklistEdit(checklistItem.id, checklistItem.text)}
                      className={cn(
                        'min-w-[44px] min-h-[44px] flex items-center justify-center',
                        'text-gray-200 active:text-blue-400 transition-colors',
                        'md:min-w-0 md:min-h-0 md:opacity-0 md:group-hover:opacity-100 md:p-0.5 md:hover:text-blue-500'
                      )}
                      aria-label="Edit checklist item"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="md:w-3 md:h-3"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>

                    {/* Delete checklist item button - very subtle */}
                    <button
                      onClick={() => onDeleteChecklistItem(checklistItem.id)}
                      className={cn(
                        'min-w-[44px] min-h-[44px] flex items-center justify-center',
                        'text-gray-200 active:text-red-400 transition-colors',
                        'md:min-w-0 md:min-h-0 md:opacity-0 md:group-hover:opacity-100 md:p-0.5 md:hover:text-red-500'
                      )}
                      aria-label="Delete checklist item"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="md:w-3 md:h-3"
                      >
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add checklist item */}
        {isAddingChecklist ? (
          <div className="flex flex-col gap-2 mt-2 md:flex-row md:items-center md:mt-1">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={handleAddChecklistKeyDown}
              onBlur={() => {
                if (!newChecklistText.trim()) {
                  setIsAddingChecklist(false);
                }
              }}
              placeholder="Add checklist item..."
              autoFocus
              className="flex-1 text-base min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 md:text-sm md:min-h-0 md:px-2 md:py-1 md:rounded md:focus:ring-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddChecklistItem}
              disabled={!newChecklistText.trim()}
              className="min-h-[44px] text-base px-4 py-2 md:min-h-0 md:text-xs md:px-2 md:py-1 md:h-auto"
            >
              Add
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingChecklist(true)}
            className="min-h-[44px] text-[11px] text-gray-300 active:text-gray-500 mt-2 flex items-center gap-2 md:min-h-0 md:gap-1 md:mt-1 md:hover:text-gray-500"
          >
            <span className="text-base md:text-sm">+</span>
            <span>Add subtask</span>
          </button>
        )}
      </div>
    </div>
  );
}
