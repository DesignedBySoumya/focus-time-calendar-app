
import { Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/types/calendar';

interface SidebarProps {
  calendars: Calendar[];
  onToggleCalendar: (calendarId: string) => void;
  onNewEvent: () => void;
}

export const Sidebar = ({ calendars, onToggleCalendar, onNewEvent }: SidebarProps) => {
  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 p-4">
      <div className="mb-6">
        <Button 
          onClick={onNewEvent}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          My Calendars
        </h3>
        
        <div className="space-y-2">
          {calendars.map((calendar) => (
            <div
              key={calendar.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: calendar.color }}
                />
                <span className="text-sm text-slate-200">{calendar.name}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleCalendar(calendar.id)}
                className="h-6 w-6 p-0 hover:bg-slate-700"
              >
                {calendar.visible ? (
                  <Eye className="h-3 w-3 text-slate-400" />
                ) : (
                  <EyeOff className="h-3 w-3 text-slate-500" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
