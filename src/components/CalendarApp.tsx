
import { useState } from 'react';
import { CalendarHeader } from './CalendarHeader';
import { Sidebar } from './Sidebar';
import { CalendarGrid } from './CalendarGrid';
import { EventModal } from './EventModal';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { ViewType, CalendarEvent } from '@/types/calendar';

export const CalendarApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartTime, setModalStartTime] = useState<Date | null>(null);
  const [modalEndTime, setModalEndTime] = useState<Date | null>(null);

  const {
    events,
    calendars,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleCalendarVisibility,
  } = useCalendarEvents();

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCreateEvent = (start: Date, end: Date) => {
    setSelectedEvent(undefined);
    setModalStartTime(start);
    setModalEndTime(end);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(undefined);
    setModalStartTime(null);
    setModalEndTime(null);
  };

  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    addEvent(eventData);
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onDateChange={setCurrentDate}
        onViewChange={setView}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          calendars={calendars}
          onToggleCalendar={toggleCalendarVisibility}
        />
        
        <CalendarGrid
          currentDate={currentDate}
          view={view}
          events={events}
          calendars={calendars}
          onEventClick={handleEventClick}
          onCreateEvent={handleCreateEvent}
        />
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        calendars={calendars}
        onSave={handleSaveEvent}
        onUpdate={updateEvent}
        onDelete={deleteEvent}
      />
    </div>
  );
};
