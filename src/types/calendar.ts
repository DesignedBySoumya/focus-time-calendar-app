
export type ViewType = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  calendarId: string;
  description?: string;
  start: Date;
  end: Date;
  color?: string;
  isAllDay?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  type: 'study' | 'birthday' | 'tasks' | 'work' | 'reminders';
}

export interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  dragStartTime: Date | null;
  dragEndTime: Date | null;
  eventId: string | null;
}
