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
    <div className="w-full space-y-4 px-2 py-3 md:space-y-4 md:px-0 md:py-0">
      {/* Section header - Level 2 hierarchy */}
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-lg font-semibold text-gray-900">Links</h3>
        {/* Counter - Level 6, subtle metadata */}
        <span className="text-[11px] text-gray-400">
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
