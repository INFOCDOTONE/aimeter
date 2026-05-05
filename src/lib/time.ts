import { format } from 'date-fns';

export function monthKey(isoDate: string): string {
  return format(new Date(isoDate), 'yyyy-MM');
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
