import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CreateContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateContext: (name: string, description?: string, color?: string) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
];

export function CreateContextModal({ isOpen, onClose, onCreateContext }: CreateContextModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Context name is required');
      return;
    }

    onCreateContext(name.trim(), description.trim() || undefined, selectedColor);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColor(undefined);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Context">
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-4">
        <Input
          label="Name"
          placeholder="e.g., Freelance Project"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={error}
          autoFocus
          className="min-h-[44px]"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-3 md:py-2 text-base md:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-transparent resize-none min-h-[44px]"
            rows={3}
            placeholder="Optional description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 md:gap-1.5">
          <label className="text-sm font-medium text-gray-700">Color (optional)</label>
          <div className="flex gap-3 md:gap-2 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color === selectedColor ? undefined : color)}
                className={`w-11 h-11 md:w-8 md:h-8 rounded-full transition-transform ${
                  color === selectedColor ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="w-full md:w-auto min-h-[44px] md:min-h-0"
          >
            Cancel
          </Button>
          <Button type="submit" className="w-full md:w-auto min-h-[44px] md:min-h-0">
            Create Context
          </Button>
        </div>
      </form>
    </Modal>
  );
}
