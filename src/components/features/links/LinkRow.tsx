import { Button } from '@/components/ui/Button';
import type { Link } from '@/types';

interface LinkRowProps {
  link: Link;
  onDelete: () => void;
}

export function LinkRow({ link, onDelete }: LinkRowProps) {
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-gray-200 bg-white hover:border-gray-300 transition-colors group">
      <div className="flex-shrink-0 w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block"
        >
          {link.title}
        </a>
        {link.description && <p className="text-xs text-gray-500 truncate">{link.description}</p>}
        <p className="text-xs text-gray-400 truncate">{link.url}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyUrl}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Copy URL"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600"
          aria-label="Delete link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
