import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface TimesheetTimerProps {
  activeTimerStart: string | null;
  onStart: () => void;
  onStop: () => void;
}

export function TimesheetTimer({ activeTimerStart, onStart, onStop }: TimesheetTimerProps) {
  // Calculate initial elapsed value without using state in effect
  const calculateElapsed = (startTimeString: string | null): string => {
    if (!startTimeString) return '0:00:00';

    const startTime = new Date(startTimeString).getTime();
    const now = Date.now();
    const diff = now - startTime;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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
  }, [activeTimerStart]);

  const formatStartTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Idle state: Show Start button
  if (!activeTimerStart) {
    return (
      <button
        onClick={onStart}
        className={cn(
          'w-full p-4 text-left text-base text-gray-500 rounded-md border border-dashed border-gray-300',
          'min-h-[44px] active:bg-gray-100',
          'hover:border-gray-400 hover:bg-gray-50 transition-colors',
          'md:p-3 md:text-sm'
        )}
      >
        ▶ Start timer
      </button>
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
          </div>
        </div>
        <Button
          onClick={onStop}
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
