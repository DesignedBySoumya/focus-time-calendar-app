
import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarEvent, Calendar } from '@/types/calendar';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  calendars: Calendar[];
  onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<CalendarEvent>) => void;
  onDelete: (id: string) => void;
}

export const EventModal = ({ isOpen, onClose, event, calendars, onSave, onUpdate, onDelete }: EventModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setCalendarId(event.calendarId);
      setStartDate(event.start.toISOString().split('T')[0]);
      setStartTime(event.start.toTimeString().slice(0, 5));
      setEndDate(event.end.toISOString().split('T')[0]);
      setEndTime(event.end.toTimeString().slice(0, 5));
      setIsAllDay(event.isAllDay || false);
    } else {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setTitle('');
      setDescription('');
      setCalendarId(calendars[0]?.id || '');
      setStartDate(now.toISOString().split('T')[0]);
      setStartTime(now.toTimeString().slice(0, 5));
      setEndDate(oneHourLater.toISOString().split('T')[0]);
      setEndTime(oneHourLater.toTimeString().slice(0, 5));
      setIsAllDay(false);
    }
  }, [event, calendars]);

  const handleSave = () => {
    if (!title.trim()) return;

    const selectedCalendar = calendars.find(cal => cal.id === calendarId);
    
    const eventData = {
      title: title.trim(),
      description: description.trim(),
      calendarId,
      start: isAllDay 
        ? new Date(startDate + 'T00:00:00')
        : new Date(startDate + 'T' + startTime + ':00'),
      end: isAllDay 
        ? new Date(endDate + 'T23:59:59')
        : new Date(endDate + 'T' + endTime + ':00'),
      color: selectedCalendar?.color || '#3B82F6',
      isAllDay,
    };

    if (event) {
      onUpdate(event.id, eventData);
    } else {
      onSave(eventData);
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (event) {
      onDelete(event.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {event ? 'Edit Event' : 'New Event'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <Input
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              {calendars.map(calendar => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="allDay" className="text-sm text-slate-300">
              All day
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
            {!isAllDay && (
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
            {!isAllDay && (
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            )}
          </div>

          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <div>
            {event && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="space-x-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {event ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
