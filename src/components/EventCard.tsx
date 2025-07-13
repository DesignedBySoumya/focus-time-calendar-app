
import { CalendarEvent } from '@/types/calendar';
import { formatDate } from '@/lib/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, GripVertical } from 'lucide-react';

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
    <Card
      className={`
        relative cursor-pointer transition-all duration-200 border-0 shadow-lg
        hover:scale-[1.02] hover:shadow-xl group overflow-hidden
        ${className || ''}
      `}
      style={{ 
        backgroundColor: event.color ? `${event.color}15` : 'hsl(var(--primary) / 0.1)',
        borderLeft: `4px solid ${event.color || 'hsl(var(--primary))'}`,
        ...style
      }}
      onClick={onClick}
      onDragStart={onDragStart}
      draggable
    >
      <CardContent className="p-3 relative">
        {/* Drag handle */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-70 transition-opacity">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="pr-6">
          <h4 
            className="font-semibold text-sm mb-1 truncate"
            style={{ color: event.color || 'hsl(var(--primary))' }}
          >
            {event.title}
          </h4>
          
          {!event.isAllDay && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              <span>
                {formatDate(event.start, 'h:mm a')} - {formatDate(event.end, 'h:mm a')}
              </span>
            </div>
          )}
          
          {duration >= 60 && (
            <div className="text-xs text-muted-foreground/80">
              {hours > 0 && `${hours}h`} {minutes > 0 && `${minutes}m`}
            </div>
          )}
          
          {event.description && (
            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        
        {/* Resize handle */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-b-md"
          style={{ backgroundColor: `${event.color || 'hsl(var(--primary))'}40` }}
          onMouseDown={onResizeStart}
          onClick={(e) => e.stopPropagation()}
        />
      </CardContent>
    </Card>
  );
};
