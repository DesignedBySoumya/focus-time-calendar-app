
import { CalendarEvent } from '@/types/calendar';
import { formatDate } from '@/lib/dateUtils';

interface EventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
}

export const EventCard = ({ event, onClick, onDragStart, className }: EventCardProps) => {
  const duration = Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60));
  
  return (
    <div
      className={`
        p-2 rounded-md cursor-pointer transition-all duration-200
        hover:scale-105 hover:shadow-lg
        ${className || ''}
      `}
      style={{ 
        backgroundColor: event.color || '#3B82F6',
        opacity: 0.9
      }}
      onClick={onClick}
      onDragStart={onDragStart}
      draggable
    >
      <div className="text-white">
        <h4 className="font-medium text-sm truncate">{event.title}</h4>
        {!event.isAllDay && (
          <p className="text-xs opacity-90">
            {formatDate(event.start, 'h:mm a')} - {formatDate(event.end, 'h:mm a')}
          </p>
        )}
        {duration > 60 && (
          <p className="text-xs opacity-75">
            {Math.floor(duration / 60)}h {duration % 60}m
          </p>
        )}
      </div>
    </div>
  );
};
