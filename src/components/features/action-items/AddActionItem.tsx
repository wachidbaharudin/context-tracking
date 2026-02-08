import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { Priority } from '@/types';

interface AddActionItemProps {
  onAdd: (title: string, priority?: Priority, dueDate?: string) => void;
}

export function AddActionItem({ onAdd }: AddActionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd(title.trim(), priority || undefined, dueDate || undefined);

    setTitle('');
    setPriority('');
    setDueDate('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'w-full min-h-[52px] p-4 text-left text-base text-gray-500',
          'rounded-lg border-2 border-dashed border-gray-300',
          'active:border-gray-400 active:bg-gray-50 transition-colors',
          'md:min-h-0 md:p-3 md:text-sm md:rounded-md md:border',
          'md:hover:border-gray-400 md:hover:bg-gray-50'
        )}
      >
        + Add action item
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-4',
        'sticky bottom-0 z-10 shadow-lg',
        'md:relative md:p-3 md:rounded-md md:space-y-3 md:shadow-none'
      )}
    >
      <textarea
        placeholder="What needs to be done? (Shift+Enter for new line)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        rows={3}
        className={cn(
          'flex w-full rounded-lg border border-gray-300 bg-white px-4 py-3',
          'text-base placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none',
          'md:rounded-md md:px-3 md:py-2 md:text-sm md:rows-2'
        )}
      />

      <div className="flex flex-col gap-3 md:flex-row">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority | '')}
          className={cn(
            'flex min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3',
            'text-base focus:outline-none focus:ring-2 focus:ring-blue-500',
            'md:min-h-0 md:h-10 md:w-auto md:rounded-md md:px-3 md:py-2 md:text-sm'
          )}
        >
          <option value="">No priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={cn(
            'flex min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3',
            'text-base focus:outline-none focus:ring-2 focus:ring-blue-500',
            'md:min-h-0 md:h-10 md:w-auto md:rounded-md md:px-3 md:py-2 md:text-sm'
          )}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="min-h-[44px] text-base md:min-h-0 md:text-sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim()}
          className="min-h-[44px] text-base md:min-h-0 md:text-sm"
        >
          Add
        </Button>
      </div>
    </form>
  );
}
