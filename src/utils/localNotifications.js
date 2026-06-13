import { formatDate } from './dateHelpers';

/**
 * Requests browser permission to show desktop notifications.
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return 'unsupported';
  }

  if (Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  return Notification.permission;
};

/**
 * Scans exams for milestones occurring within the next 48 hours and displays browser alerts.
 * Saves alert history to localStorage to prevent duplicate popups.
 */
export const checkAndTriggerLocalNotifications = async (exams = []) => {
  if (!('Notification' in window)) return;
  
  // Only proceed if permission has been granted
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const shown = JSON.parse(localStorage.getItem('shown_local_notifications') || '{}');
  let updated = false;

  exams.forEach((exam) => {
    const milestones = [
      { label: 'Application Process Starts', date: exam.formStart },
      { label: 'Application Deadline', date: exam.formEnd },
      { label: 'Admit Card Available', date: exam.admitDate },
      { label: 'Exam Date', date: exam.examDate }
    ];

    milestones.forEach((m) => {
      if (!m.date) return;
      
      const milestoneDate = new Date(m.date);
      // Diff in hours
      const diffTime = milestoneDate.getTime() - now.getTime();
      const diffHours = diffTime / (1000 * 60 * 60);

      // Trigger if milestone is within the next 48 hours and is in the future
      if (diffHours > 0 && diffHours <= 48) {
        const key = `${exam.id}-${m.label.replace(/\s+/g, '_')}-${m.date}`;
        
        if (!shown[key]) {
          const title = `Upcoming Milestone: ${exam.name}`;
          const daysLeft = Math.ceil(diffHours / 24);
          const timeText = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
          
          const options = {
            body: `${m.label} is ${timeText} (${formatDate(m.date)})!`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: key,
            requireInteraction: true
          };

          try {
            new Notification(title, options);
            shown[key] = true;
            updated = true;
          } catch (err) {
            console.error('Failed to dispatch native browser notification:', err);
          }
        }
      }
    });
  });

  if (updated) {
    localStorage.setItem('shown_local_notifications', JSON.stringify(shown));
  }
};
