import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
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
    <div
      className={cn(
        'flex flex-col gap-2 p-3 rounded-md border border-gray-100 bg-white transition-colors group',
        'min-h-[44px]',
        'md:flex-row md:items-center md:gap-3 md:p-3',
        'hover:border-gray-200'
      )}
    >
      <div className="flex items-start gap-3 md:flex-1 md:items-center md:min-w-0">
        {/* Link icon - subtle */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded bg-gray-50 flex items-center justify-center text-gray-300',
            'md:w-8 md:h-8'
          )}
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
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {/* Link title - primary focus */}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'text-base font-medium text-blue-600 hover:text-blue-700 hover:underline truncate block',
              'min-h-[44px] flex items-center',
              'md:text-sm md:min-h-0'
            )}
          >
            {link.title}
          </a>
          {/* Description - Level 5, secondary */}
          {link.description && (
            <p className="text-[11px] text-gray-400 truncate">{link.description}</p>
          )}
          {/* URL - Level 6, tertiary */}
          <p className="text-[11px] text-gray-300 truncate max-w-[200px] md:max-w-none">
            {link.url}
          </p>
        </div>
      </div>

      {/* Action buttons - de-emphasized */}
      <div
        className={cn(
          'flex items-center gap-2 self-end',
          'opacity-100',
          'md:gap-1 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyUrl}
          className={cn(
            'text-gray-300 hover:text-gray-500',
            'min-w-[44px] min-h-[44px]',
            'md:min-w-0 md:min-h-0'
          )}
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
          className={cn(
            'text-gray-300 hover:text-red-500',
            'min-w-[44px] min-h-[44px]',
            'md:min-w-0 md:min-h-0'
          )}
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
