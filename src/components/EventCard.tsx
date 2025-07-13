
import { CalendarEvent } from '@/types/calendar';
import { formatDate } from '@/lib/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, GripVertical, Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onResizeStart?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const EventCard = ({ 
  event, 
  onClick, 
  onDragStart, 
  onDragEnd,
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
        hover:scale-[1.02] hover:shadow-xl group overflow-hidden backdrop-blur-sm
        ${className || ''}
      `}
      style={{ 
        backgroundColor: event.color ? `${event.color}20` : 'hsl(var(--primary) / 0.1)',
        borderLeft: `4px solid ${event.color || 'hsl(var(--primary))'}`,
        ...style
      }}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      draggable
    >
      <CardContent className="p-3 relative">
        {/* Drag handle */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-70 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="pr-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3 h-3" style={{ color: event.color || 'hsl(var(--primary))' }} />
            <h4 
              className="font-semibold text-sm truncate flex-1"
              style={{ color: event.color || 'hsl(var(--primary))' }}
            >
              {event.title}
            </h4>
          </div>
          
          {!event.isAllDay && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Clock className="w-3 h-3" />
              <span>
                {formatDate(event.start, 'h:mm a')} - {formatDate(event.end, 'h:mm a')}
              </span>
              {duration >= 60 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {hours > 0 && `${hours}h`} {minutes > 0 && `${minutes}m`}
                </Badge>
              )}
            </div>
          )}
          
          {event.description && (
            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        
        {/* Resize handle */}
        {onResizeStart && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-b-md flex items-center justify-center"
            style={{ backgroundColor: `${event.color || 'hsl(var(--primary))'}40` }}
            onMouseDown={onResizeStart}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-6 h-1 bg-white/60 rounded-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
