import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
        className="w-full p-3 text-left text-sm text-gray-500 rounded-md border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        + Add action item
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 rounded-md border border-gray-200 bg-gray-50 space-y-3"
    >
      <Input
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />

      <div className="flex gap-3">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority | '')}
          className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Add
        </Button>
      </div>
    </form>
  );
}
