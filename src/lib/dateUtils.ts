
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addMinutes, startOfDay, endOfDay } from 'date-fns';

export const formatDate = (date: Date, formatStr: string) => format(date, formatStr);

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
};

export const getMonthGrid = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDate = startOfWeek(firstDay, { weekStartsOn: 0 });
  const endDate = endOfWeek(lastDay, { weekStartsOn: 0 });
  
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const snapToGrid = (date: Date, snapMinutes: number = 15) => {
  const minutes = date.getMinutes();
  const snappedMinutes = Math.round(minutes / snapMinutes) * snapMinutes;
  const newDate = new Date(date);
  newDate.setMinutes(snappedMinutes, 0, 0);
  return newDate;
};

export const getTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(new Date(2024, 0, 1, hour, minute));
    }
  }
  return slots;
};

export const isEventInDay = (event: CalendarEvent, day: Date) => {
  return isSameDay(event.start, day) || 
         (event.start <= startOfDay(day) && event.end >= endOfDay(day)) ||
         (event.start <= day && event.end >= day);
};
