import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface TimesheetTimerProps {
  activeTimerStart: string | null;
  activeTimerDescription?: string | null;
  onStart: (description?: string) => void;
  onStop: () => void;
}

export function TimesheetTimer({
  activeTimerStart,
  activeTimerDescription,
  onStart,
  onStop,
}: TimesheetTimerProps) {
  const [description, setDescription] = useState('');

  // Calculate initial elapsed value without using state in effect
  const calculateElapsed = useCallback((startTimeString: string | null): string => {
    if (!startTimeString) return '0:00:00';

    const startTime = new Date(startTimeString).getTime();
    const now = Date.now();
    const diff = now - startTime;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const [elapsed, setElapsed] = useState(() => calculateElapsed(activeTimerStart));

  useEffect(() => {
    if (!activeTimerStart) {
      return;
    }

    const updateElapsed = () => {
      setElapsed(calculateElapsed(activeTimerStart));
    };

    // Update immediately
    updateElapsed();

    // Then update every second
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeTimerStart, calculateElapsed]);

  const formatStartTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onStart(description);
      setDescription('');
    }
  };

  const handleStartClick = () => {
    onStart(description);
    setDescription('');
  };

  const handleStopClick = () => {
    onStop();
  };

  // Idle state: Show Start button with description input
  if (!activeTimerStart) {
    return (
      <div className="flex items-start gap-2">
        <textarea
          placeholder="What are you working on? (Shift+Enter for new line)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className={cn(
            'flex flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3',
            'text-base placeholder:text-gray-400 resize-none min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'md:rounded-md md:px-3 md:py-2 md:text-sm md:min-h-[36px]'
          )}
        />
        <Button
          type="button"
          onClick={handleStartClick}
          variant="primary"
          size="sm"
          className="h-[44px] shrink-0 text-base px-6 md:h-[36px] md:text-sm md:px-4"
        >
          ▶ Start
        </Button>
      </div>
    );
  }

  // Running state: Show timer card
  return (
    <div className={cn('p-4 rounded-md border border-blue-200 bg-blue-50 space-y-3', 'md:p-3')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <div>
            <div className="text-2xl font-mono font-semibold text-gray-900 md:text-xl">
              {elapsed}
            </div>
            <div className="text-sm text-gray-600 md:text-xs">
              Started at {formatStartTime(activeTimerStart)}
            </div>
            {activeTimerDescription && (
              <div className="text-sm text-gray-600 md:text-xs mt-1">{activeTimerDescription}</div>
            )}
          </div>
        </div>
        <Button
          type="button"
          onClick={handleStopClick}
          variant="danger"
          size="sm"
          className="min-h-[44px] text-base md:min-h-0 md:text-sm bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
        >
          ■ Stop
        </Button>
      </div>
    </div>
  );
}
