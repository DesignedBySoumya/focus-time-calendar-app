
import { CalendarEvent } from '@/types/calendar';
import { formatDate } from '@/lib/dateUtils';

interface EventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onResizeStart?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const EventCard = ({ 
  event, 
  onClick, 
  onDragStart, 
  onResizeStart, 
  className, 
  style 
}: EventCardProps) => {
  const duration = Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60));
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  return (
    <div
      className={`
        relative p-2 rounded-md cursor-pointer transition-all duration-200
        hover:scale-105 hover:shadow-lg border-l-4 group
        ${className || ''}
      `}
      style={{ 
        backgroundColor: event.color || '#3B82F6',
        opacity: 0.9,
        borderLeftColor: event.color || '#3B82F6',
        ...style
      }}
      onClick={onClick}
      onDragStart={onDragStart}
      draggable
    >
      <div className="text-white">
        <h4 className="font-medium text-sm truncate pr-4">{event.title}</h4>
        {!event.isAllDay && (
          <p className="text-xs opacity-90">
            {formatDate(event.start, 'h:mm a')} - {formatDate(event.end, 'h:mm a')}
          </p>
        )}
        {duration >= 60 && (
          <p className="text-xs opacity-75">
            {hours > 0 && `${hours}h`} {minutes > 0 && `${minutes}m`}
          </p>
        )}
      </div>
      
      {/* Resize handle */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 rounded-b-md"
        onMouseDown={onResizeStart}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Drag handle */}
      <div className="absolute top-1 right-1 w-4 h-4 cursor-move opacity-0 group-hover:opacity-70 transition-opacity">
        <div className="w-full h-full bg-white/30 rounded-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-white/60 rounded-full" />
        </div>
      </div>
    </div>
  );
};
