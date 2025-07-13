
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
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const visibleCalendars = calendars.filter(cal => cal.visible);
  const visibleEvents = events.filter(event => 
    visibleCalendars.some(cal => cal.id === event.calendarId)
  );

  // Calculate event position and height for week/day views
  const getEventStyle = (event: CalendarEvent, containerHeight = 48) => {
    if (view === 'month') return {};
    
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    const duration = endHour - startHour;
    
    return {
      position: 'absolute' as const,
      top: `${(startHour / 24) * 100}%`,
      height: `${Math.max(duration / 24 * 100, 2)}%`,
      left: '2px',
      right: '2px',
      zIndex: 10,
    };
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

  const handleDragOver = (e: React.DragEvent, date: Date, hour?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Update drag over info for visual feedback
    setDragOverInfo({ date, hour });
  };

  const handleEventDrop = (e: React.DragEvent, date: Date, hour?: number) => {
    e.preventDefault();
    console.log('Event dropped at:', date, hour);
    
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
      newStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0);
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
        <div className="grid grid-cols-8 border-b border-border">
          <div className="p-2 text-center text-sm font-medium text-muted-foreground">Time</div>
          {weekDays.map(day => (
            <div key={day.toString()} className="p-2 text-center text-sm font-medium text-muted-foreground border-l border-border">
              <div>{formatDate(day, 'EEE')}</div>
              <div className="text-lg">{day.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-auto">
          <div className="relative">
            <div className="grid grid-cols-8">
              {hours.map(hour => (
                <div key={`hour-${hour}`} className="contents">
                  <div className="p-2 text-xs text-muted-foreground border-b border-border text-right">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  
                  {weekDays.map(day => {
                    const isDragOver = dragOverInfo && 
                      isSameDay(dragOverInfo.date, day) && 
                      dragOverInfo.hour === hour;
                      
                    return (
                      <div
                        key={`${day.toString()}-${hour}`}
                        className={`
                          h-12 border-b border-l border-border relative transition-colors cursor-pointer
                          ${isDragOver ? 'bg-primary/20' : 'hover:bg-muted/30'}
                        `}
                        onMouseDown={(e) => handleMouseDown(e, day, hour)}
                        onMouseMove={(e) => handleMouseMove(e, day, hour)}
                        onMouseUp={handleMouseUp}
                        onDragOver={(e) => handleDragOver(e, day, hour)}
                        onDrop={(e) => handleEventDrop(e, day, hour)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            
            {/* Render events as overlays */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-8">
              <div></div> {/* Time column spacer */}
              {weekDays.map(day => {
                const dayEvents = visibleEvents.filter(event => isSameDay(event.start, day));
                return (
                  <div key={day.toString()} className="relative pointer-events-auto">
                    {dayEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick(event)}
                        onDragStart={(e) => handleEventDragStart(e, event)}
                        onResizeStart={(e) => handleResizeStart(e, event)}
                        style={getEventStyle(event, 24 * 48)}
                        className="text-xs"
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
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
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            {formatDate(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
        </div>

        <div className="flex-1 overflow-auto relative">
          {hours.map(hour => {
            const isDragOver = dragOverInfo && 
              isSameDay(dragOverInfo.date, currentDate) && 
              dragOverInfo.hour === hour;
              
            return (
              <div
                key={hour}
                className={`
                  flex border-b border-border min-h-[60px] transition-colors cursor-pointer
                  ${isDragOver ? 'bg-primary/20' : 'hover:bg-muted/30'}
                `}
                onMouseDown={(e) => handleMouseDown(e, currentDate, hour)}
                onMouseMove={(e) => handleMouseMove(e, currentDate, hour)}
                onMouseUp={handleMouseUp}
                onDragOver={(e) => handleDragOver(e, currentDate, hour)}
                onDrop={(e) => handleEventDrop(e, currentDate, hour)}
              >
                <div className="w-20 p-2 text-xs text-muted-foreground text-right border-r border-border">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="flex-1 relative" />
              </div>
            );
          })}
          
          {/* Events overlay */}
          <div className="absolute inset-0 flex">
            <div className="w-20" /> {/* Time column spacer */}
            <div className="flex-1 relative">
              {dayEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick(event)}
                  onDragStart={(e) => handleEventDragStart(e, event)}
                  onResizeStart={(e) => handleResizeStart(e, event)}
                  style={getEventStyle(event, 24 * 60)}
                  onDragEnd={handleDragEnd}
                />
              ))}
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
      onMouseLeave={() => {
        if (dragState.isDragging) {
          handleMouseUp();
        }
      }}
    >
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
};
