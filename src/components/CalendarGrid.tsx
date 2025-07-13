
import { useState, useRef } from 'react';
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

  const gridRef = useRef<HTMLDivElement>(null);

  const visibleCalendars = calendars.filter(cal => cal.visible);
  const visibleEvents = events.filter(event => 
    visibleCalendars.some(cal => cal.id === event.calendarId)
  );

  const handleMouseDown = (e: React.MouseEvent, date: Date, hour?: number) => {
    if (view === 'month') {
      // For month view, create all-day events
      const start = new Date(date);
      start.setHours(9, 0, 0, 0); // Default to 9 AM
      const end = new Date(date);
      end.setHours(10, 0, 0, 0); // Default to 10 AM
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
      
      // Add at least 1 hour duration
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
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleEventDrop = (e: React.DragEvent, date: Date, hour?: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    const event = events.find(ev => ev.id === eventId);
    
    if (!event) return;
    
    const duration = event.end.getTime() - event.start.getTime();
    let newStart: Date;
    
    if (hour !== undefined) {
      newStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0);
    } else {
      newStart = new Date(date);
      newStart.setHours(event.start.getHours(), event.start.getMinutes());
    }
    
    const newEnd = new Date(newStart.getTime() + duration);
    
    onMoveEvent(eventId, {
      start: newStart,
      end: newEnd
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const renderMonthView = () => {
    const days = getMonthGrid(currentDate);
    const today = new Date();

    return (
      <div className="grid grid-cols-7 gap-0 h-full">
        {/* Header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-400 border-b border-slate-700">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map((day, index) => {
          const dayEvents = visibleEvents.filter(event => isEventInDay(event, day));
          const isToday = isSameDay(day, today);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          
          return (
            <div
              key={index}
              className={`
                min-h-[120px] p-2 border-r border-b border-slate-700
                ${isCurrentMonth ? 'bg-slate-900' : 'bg-slate-800'}
                ${isToday ? 'bg-blue-900/20' : ''}
                hover:bg-slate-800 transition-colors cursor-pointer
              `}
              onClick={(e) => handleMouseDown(e, day)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleEventDrop(e, day)}
            >
              <div className={`
                text-sm font-medium mb-2
                ${isToday ? 'text-blue-400' : isCurrentMonth ? 'text-slate-200' : 'text-slate-500'}
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
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-slate-400">
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
        <div className="grid grid-cols-8 border-b border-slate-700">
          <div className="p-2 text-center text-sm font-medium text-slate-400">Time</div>
          {weekDays.map(day => (
            <div key={day.toString()} className="p-2 text-center text-sm font-medium text-slate-400 border-l border-slate-700">
              <div>{formatDate(day, 'EEE')}</div>
              <div className="text-lg">{day.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8">
            {hours.map(hour => (
              <div key={`hour-${hour}`} className="contents">
                {/* Time label */}
                <div className="p-2 text-xs text-slate-400 border-b border-slate-700 text-right">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                
                {/* Day slots */}
                {weekDays.map(day => {
                  const slotEvents = visibleEvents.filter(event => 
                    isSameDay(event.start, day) && 
                    event.start.getHours() === hour
                  );
                  
                  return (
                    <div
                      key={`${day.toString()}-${hour}`}
                      className="h-12 border-b border-l border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer relative"
                      onMouseDown={(e) => handleMouseDown(e, day, hour)}
                      onMouseMove={(e) => handleMouseMove(e, day, hour)}
                      onMouseUp={handleMouseUp}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleEventDrop(e, day, hour)}
                    >
                      {slotEvents.map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onClick={() => onEventClick(event)}
                          onDragStart={(e) => handleEventDragStart(e, event)}
                          className="absolute inset-1 text-xs"
                        />
                      ))}
                    </div>
                  );
                })}
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
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {formatDate(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-auto">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => event.start.getHours() === hour);
            
            return (
              <div
                key={hour}
                className="flex border-b border-slate-700 min-h-[60px] hover:bg-slate-800 transition-colors cursor-pointer"
                onMouseDown={(e) => handleMouseDown(e, currentDate, hour)}
                onMouseMove={(e) => handleMouseMove(e, currentDate, hour)}
                onMouseUp={handleMouseUp}
                onDragOver={handleDragOver}
                onDrop={(e) => handleEventDrop(e, currentDate, hour)}
              >
                <div className="w-20 p-2 text-xs text-slate-400 text-right border-r border-slate-700">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="flex-1 p-2 relative">
                  {hourEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => onEventClick(event)}
                      onDragStart={(e) => handleEventDragStart(e, event)}
                      className="mb-1"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={gridRef}
      className="flex-1 bg-slate-900 overflow-hidden"
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
