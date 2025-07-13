
import { ChevronLeft, ChevronRight, Calendar, Clock, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewType } from '@/types/calendar';
import { formatDate } from '@/lib/dateUtils';

interface CalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
}

export const CalendarHeader = ({ currentDate, view, onDateChange, onViewChange }: CalendarHeaderProps) => {
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    onDateChange(newDate);
  };

  const getDateDisplay = () => {
    switch (view) {
      case 'month':
        return formatDate(currentDate, 'MMMM yyyy');
      case 'week':
        return `Week of ${formatDate(currentDate, 'MMM d, yyyy')}`;
      case 'day':
        return formatDate(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-white">FocusTime</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-white min-w-[200px] text-center">
            {getDateDisplay()}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('next')}
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant={view === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('month')}
          className={view === 'month' 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }
        >
          <Calendar className="h-4 w-4 mr-1" />
          Month
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('week')}
          className={view === 'week' 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }
        >
          <Grid3X3 className="h-4 w-4 mr-1" />
          Week
        </Button>
        <Button
          variant={view === 'day' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('day')}
          className={view === 'day' 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }
        >
          <Clock className="h-4 w-4 mr-1" />
          Day
        </Button>
      </div>
    </div>
  );
};
