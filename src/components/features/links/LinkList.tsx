import { LinkRow } from './LinkRow';
import { AddLink } from './AddLink';
import type { Link } from '@/types';

interface LinkListProps {
  links: Link[];
  onAdd: (url: string, title: string, description?: string) => void;
  onDelete: (linkId: string) => void;
}

export function LinkList({ links, onAdd, onDelete }: LinkListProps) {
  return (
    <div className="w-full space-y-3 px-2 py-3 md:space-y-4 md:px-4 md:py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 md:text-base">Links</h3>
        <span className="text-xs text-gray-500 md:text-sm">
          {links.length} link{links.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2 md:space-y-3">
        {links.map((link) => (
          <LinkRow key={link.id} link={link} onDelete={() => onDelete(link.id)} />
        ))}

        <AddLink onAdd={onAdd} />
      </div>
    </div>
  );
}
