import { useState, useRef, useEffect } from 'react';
import { CalendarEvent, Calendar, ViewType, DragState } from '@/types/calendar';
import { getMonthGrid, getWeekDays, formatDate, snapToGrid, isEventInDay } from '@/lib/dateUtils';
import { EventCard } from './EventCard';
import { isSameDay, format } from 'date-fns';

interface CalendarGridProps {
  currentDate: Date;
  view: ViewType;
  events: CalendarEvent[];
  calendars: Calendar[];
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (start: Date, end: Date) => void;
  onMoveEvent: (id: string, updates: Partial<CalendarEvent>) => void;
}

export const CalendarGrid = ({ 
  currentDate, 
  view, 
  events, 
  calendars, 
  onEventClick, 
  onCreateEvent,
  onMoveEvent
}: CalendarGridProps) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    dragStartTime: null,
    dragEndTime: null,
    eventId: null,
  });

  const [resizingEvent, setResizingEvent] = useState<{
    eventId: string;
    startY: number;
    originalEnd: Date;
  } | null>(null);

  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{
    date: Date;
    hour?: number;
    minutes?: number;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const visibleCalendars = calendars.filter(cal => cal.visible);
  const visibleEvents = events.filter(event => 
    visibleCalendars.some(cal => cal.id === event.calendarId)
  );

  // Calculate event position and height for week/day views with proper time alignment
  const getEventStyle = (event: CalendarEvent, containerHeight = 1440) => {
    if (view === 'month') return {};
    
    const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
    const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
    const durationMinutes = endMinutes - startMinutes;
    
    return {
      position: 'absolute' as const,
      top: `${(startMinutes / 1440) * 100}%`,
      height: `${Math.max((durationMinutes / 1440) * 100, 1)}%`,
      left: '4px',
      right: '4px',
      zIndex: 10,
    };
  };

  const getTimeFromPosition = (y: number, containerRect: DOMRect) => {
    const relativeY = y - containerRect.top;
    const totalMinutes = Math.max(0, Math.min(1440, (relativeY / containerRect.height) * 1440));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round((totalMinutes % 60) / 15) * 15; // Snap to 15-minute intervals
    return { hours, minutes };
  };

  const handleMouseDown = (e: React.MouseEvent, date: Date, hour?: number) => {
    if (view === 'month') {
      const start = new Date(date);
      start.setHours(9, 0, 0, 0);
      const end = new Date(date);
      end.setHours(10, 0, 0, 0);
      onCreateEvent(start, end);
      return;
    }
    
    const startTime = hour !== undefined 
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0)
      : date;
    
    setDragState({
      isDragging: true,
      isResizing: false,
      dragStartTime: startTime,
      dragEndTime: startTime,
      eventId: null,
    });
  };

  const handleMouseMove = (e: React.MouseEvent, date: Date, hour?: number) => {
    if (!dragState.isDragging || !dragState.dragStartTime) return;
    
    const currentTime = hour !== undefined 
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0)
      : date;
    
    setDragState(prev => ({
      ...prev,
      dragEndTime: currentTime,
    }));
  };

  const handleMouseUp = () => {
    if (dragState.isDragging && dragState.dragStartTime && dragState.dragEndTime) {
      const start = dragState.dragStartTime < dragState.dragEndTime 
        ? dragState.dragStartTime 
        : dragState.dragEndTime;
      const end = dragState.dragStartTime < dragState.dragEndTime 
        ? dragState.dragEndTime 
        : dragState.dragStartTime;
      
      const endTime = new Date(end.getTime() + (60 * 60 * 1000));
      onCreateEvent(snapToGrid(start), snapToGrid(endTime));
    }
    
    setDragState({
      isDragging: false,
      isResizing: false,
      dragStartTime: null,
      dragEndTime: null,
      eventId: null,
    });
  };

  const handleEventDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    console.log('Event drag started:', event.title);
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEvent(event);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('Drag ended');
    setDraggedEvent(null);
    setDragOverInfo(null);
    
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, date: Date, hour?: number, minutes?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Update drag over info for visual feedback
    setDragOverInfo({ date, hour, minutes });
  };

  const handleEventDrop = (e: React.DragEvent, date: Date, hour?: number, minutes?: number) => {
    e.preventDefault();
    console.log('Event dropped at:', date, hour, minutes);
    
    const eventId = e.dataTransfer.getData('text/plain');
    const event = events.find(ev => ev.id === eventId);
    
    if (!event) {
      console.log('Event not found:', eventId);
      return;
    }
    
    const duration = event.end.getTime() - event.start.getTime();
    let newStart: Date;
    
    if (hour !== undefined) {
      // Dropped on a specific hour slot
      const targetMinutes = minutes || 0;
      newStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, targetMinutes);
    } else {
      // Dropped on a day (month view or all-day)
      newStart = new Date(date);
      if (view === 'month') {
        newStart.setHours(event.start.getHours(), event.start.getMinutes());
      } else {
        newStart.setHours(9, 0); // Default to 9 AM
      }
    }
    
    const newEnd = new Date(newStart.getTime() + duration);
    
    console.log('Moving event from', event.start, 'to', newStart);
    onMoveEvent(eventId, {
      start: newStart,
      end: newEnd
    });
    
    setDragOverInfo(null);
  };

  const handleResizeStart = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setResizingEvent({
      eventId: event.id,
      startY: e.clientY,
      originalEnd: event.end,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingEvent) return;
      
      const deltaY = e.clientY - resizingEvent.startY;
      const hoursDelta = deltaY / 48; // Assuming 48px per hour
      const newEnd = new Date(resizingEvent.originalEnd.getTime() + hoursDelta * 60 * 60 * 1000);
      
      const event = events.find(ev => ev.id === resizingEvent.eventId);
      if (event && newEnd > event.start) {
        onMoveEvent(resizingEvent.eventId, { end: snapToGrid(newEnd) });
      }
    };

    const handleMouseUp = () => {
      setResizingEvent(null);
    };

    if (resizingEvent) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingEvent, events, onMoveEvent]);

  const renderMonthView = () => {
    const days = getMonthGrid(currentDate);
    const today = new Date();

    return (
      <div className="grid grid-cols-7 gap-0 h-full">
        {/* Header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-border">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map((day, index) => {
          const dayEvents = visibleEvents.filter(event => isEventInDay(event, day));
          const isToday = isSameDay(day, today);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isDragOver = dragOverInfo && isSameDay(dragOverInfo.date, day);
          
          return (
            <div
              key={index}
              className={`
                min-h-[120px] p-2 border-r border-b border-border relative transition-colors
                ${isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
                ${isToday ? 'bg-primary/10' : ''}
                ${isDragOver ? 'bg-primary/20' : ''}
                hover:bg-muted/30 cursor-pointer
              `}
              onClick={(e) => handleMouseDown(e, day)}
              onDragOver={(e) => handleDragOver(e, day)}
              onDrop={(e) => handleEventDrop(e, day)}
            >
              <div className={`
                text-sm font-medium mb-2
                ${isToday ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
              `}>
                {day.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick(event)}
                    onDragStart={(e) => handleEventDragStart(e, event)}
                    className="text-xs"
                    onDragEnd={handleDragEnd}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-border bg-background sticky top-0 z-20">
          <div className="p-2 text-center text-sm font-medium text-muted-foreground">Time</div>
          {weekDays.map(day => (
            <div key={day.toString()} className="p-2 text-center text-sm font-medium text-muted-foreground border-l border-border">
              <div>{formatDate(day, 'EEE')}</div>
              <div className="text-lg">{day.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-auto relative">
          <div className="grid grid-cols-8 min-h-[1440px]" style={{ height: '1440px' }}>
            {/* Time column */}
            <div className="border-r border-border bg-background/50">
              {hours.map(hour => (
                <div key={`time-${hour}`} className="h-[60px] p-2 text-xs text-muted-foreground text-right border-b border-border/50 flex items-start">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              ))}
            </div>
            
            {/* Day columns */}
            {weekDays.map((day, dayIndex) => (
              <div key={day.toString()} className="border-r border-border relative">
                {hours.map(hour => {
                  const isDragOver = dragOverInfo && 
                    isSameDay(dragOverInfo.date, day) && 
                    dragOverInfo.hour === hour;
                    
                  return (
                    <div
                      key={`${day.toString()}-${hour}`}
                      className={`
                        h-[60px] border-b border-border/50 relative transition-colors cursor-pointer
                        ${isDragOver ? 'bg-primary/20' : 'hover:bg-muted/30'}
                      `}
                      onDragOver={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY;
                        const timeInfo = getTimeFromPosition(y, rect);
                        handleDragOver(e, day, hour, timeInfo.minutes);
                      }}
                      onDrop={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY;
                        const timeInfo = getTimeFromPosition(y, rect);
                        handleEventDrop(e, day, hour, timeInfo.minutes);
                      }}
                    />
                  );
                })}
                
                {/* Events overlay for this day */}
                <div className="absolute inset-0 pointer-events-none">
                  {visibleEvents
                    .filter(event => isSameDay(event.start, day))
                    .map(event => (
                      <div key={event.id} className="pointer-events-auto">
                        <EventCard
                          event={event}
                          onClick={() => onEventClick(event)}
                          onDragStart={(e) => handleEventDragStart(e, event)}
                          onResizeStart={(e) => handleResizeStart(e, event)}
                          style={getEventStyle(event, 1440)}
                          className="text-xs"
                          onDragEnd={handleDragEnd}
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = visibleEvents.filter(event => isSameDay(event.start, currentDate));

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border bg-background">
          <h3 className="text-lg font-semibold text-foreground">
            {formatDate(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
        </div>

        <div className="flex-1 overflow-auto relative">
          <div className="flex min-h-[1440px]" style={{ height: '1440px' }}>
            {/* Time column */}
            <div className="w-20 border-r border-border bg-background/50">
              {hours.map(hour => (
                <div key={`time-${hour}`} className="h-[60px] p-2 text-xs text-muted-foreground text-right border-b border-border/50 flex items-start">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              ))}
            </div>
            
            {/* Main content area */}
            <div className="flex-1 relative">
              {/* Hour slots */}
              {hours.map(hour => {
                const isDragOver = dragOverInfo && 
                  isSameDay(dragOverInfo.date, currentDate) && 
                  dragOverInfo.hour === hour;
                  
                return (
                  <div
                    key={hour}
                    className={`
                      h-[60px] border-b border-border/50 relative transition-colors cursor-pointer
                      ${isDragOver ? 'bg-primary/20' : 'hover:bg-muted/30'}
                    `}
                    onDragOver={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY;
                      const timeInfo = getTimeFromPosition(y, rect);
                      handleDragOver(e, currentDate, hour, timeInfo.minutes);
                    }}
                    onDrop={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY;
                      const timeInfo = getTimeFromPosition(y, rect);
                      handleEventDrop(e, currentDate, hour, timeInfo.minutes);
                    }}
                  />
                );
              })}
              
              {/* Events overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {dayEvents.map(event => (
                  <div key={event.id} className="pointer-events-auto">
                    <EventCard
                      event={event}
                      onClick={() => onEventClick(event)}
                      onDragStart={(e) => handleEventDragStart(e, event)}
                      onResizeStart={(e) => handleResizeStart(e, event)}
                      style={getEventStyle(event, 1440)}
                      onDragEnd={handleDragEnd}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={gridRef}
      className="flex-1 bg-background overflow-hidden"
    >
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
};
