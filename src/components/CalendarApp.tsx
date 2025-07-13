
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
    setModalStartTime(null);
    setModalEndTime(null);
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
    handleCloseModal();
  };

  const handleUpdateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    updateEvent(id, updates);
    handleCloseModal();
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    handleCloseModal();
  };

  const handleNewEventClick = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    handleCreateEvent(now, oneHourLater);
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
          onNewEvent={handleNewEventClick}
        />
        
        <CalendarGrid
          currentDate={currentDate}
          view={view}
          events={events}
          calendars={calendars}
          onEventClick={handleEventClick}
          onCreateEvent={handleCreateEvent}
          onMoveEvent={updateEvent}
        />
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        calendars={calendars}
        onSave={handleSaveEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        startTime={modalStartTime}
        endTime={modalEndTime}
      />
    </div>
  );
};
