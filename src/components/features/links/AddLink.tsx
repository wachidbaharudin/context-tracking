import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface AddLinkProps {
  onAdd: (url: string, title: string, description?: string) => void;
}

export function AddLink({ onAdd }: AddLinkProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    if (!validateUrl(url.trim())) {
      setError('Please enter a valid URL');
      return;
    }

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    onAdd(url.trim(), title.trim(), description.trim() || undefined);

    setUrl('');
    setTitle('');
    setDescription('');
    setError('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'w-full p-4 text-left text-base text-gray-500 rounded-md border border-dashed border-gray-300',
          'min-h-[44px] active:bg-gray-100',
          'hover:border-gray-400 hover:bg-gray-50 transition-colors',
          'md:p-3 md:text-sm'
        )}
      >
        + Add link
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'p-4 rounded-md border border-gray-200 bg-gray-50 space-y-4',
        'md:p-3 md:space-y-3'
      )}
    >
      <Input
        placeholder="https://example.com"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setError('');
        }}
        error={error}
        autoFocus
        className="min-h-[44px] text-base md:min-h-0 md:text-sm"
      />

      <Input
        placeholder="Link title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError('');
        }}
        className="min-h-[44px] text-base md:min-h-0 md:text-sm"
      />

      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[44px] text-base md:min-h-0 md:text-sm"
      />

      <div className="flex flex-col gap-2 md:flex-row md:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="min-h-[44px] text-base md:min-h-0 md:text-sm"
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" className="min-h-[44px] text-base md:min-h-0 md:text-sm">
          Add Link
        </Button>
      </div>
    </form>
  );
}
