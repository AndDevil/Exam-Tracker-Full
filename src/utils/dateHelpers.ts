import { differenceInCalendarDays, parseISO, format, startOfDay } from 'date-fns';

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Not scheduled';
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch {
    return 'Invalid Date';
  }
};

export interface CountdownDetails {
  label: string;
  isUrgent: boolean;
  isExpired: boolean;
  days: number;
  colorClass: string;
}

export const getDaysCountdown = (dateString: string | null | undefined): CountdownDetails | null => {
  if (!dateString) return null;
  try {
    const targetDate = startOfDay(parseISO(dateString));
    const today = startOfDay(new Date());
    const diffDays = differenceInCalendarDays(targetDate, today);

    if (diffDays < 0) {
      return { 
        label: 'Expired', 
        isUrgent: false, 
        isExpired: true, 
        days: diffDays,
        colorClass: 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400'
      };
    } else if (diffDays === 0) {
      return { 
        label: 'Today', 
        isUrgent: true, 
        isExpired: false, 
        days: 0,
        colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse'
      };
    } else if (diffDays === 1) {
      return { 
        label: 'Tomorrow', 
        isUrgent: true, 
        isExpired: false, 
        days: 1,
        colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
      };
    } else {
      const isUrgent = diffDays <= 3;
      return { 
        label: `In ${diffDays} days`, 
        isUrgent, 
        isExpired: false, 
        days: diffDays,
        colorClass: isUrgent 
          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
          : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400'
      };
    }
  } catch {
    return null;
  }
};
