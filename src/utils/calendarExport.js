/**
 * Utility functions for exporting exam milestones to external calendars.
 */

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateYYYYMMDD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

/**
 * Generates a template URL to add the milestone to Google Calendar as an all-day event.
 */
export const getGoogleCalendarLink = (exam, milestone) => {
  const start = parseDate(milestone.date);
  if (!start) return '#';

  // Google Calendar all-day event end date is exclusive, so we add 1 day
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const dateRange = `${formatDateYYYYMMDD(start)}/${formatDateYYYYMMDD(end)}`;
  const title = `${exam.name} - ${milestone.label}`;
  const details = `Milestone: ${milestone.label}\nOfficial Notification Website: ${exam.adUrl || 'N/A'}\nNotes: ${exam.notes || 'No notes added.'}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateRange}&details=${encodeURIComponent(details)}`;
};

/**
 * Generates and triggers the download of an iCal (.ics) file for the milestone.
 */
export const downloadIcalFile = (exam, milestone) => {
  const start = parseDate(milestone.date);
  if (!start) return;

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const uid = `milestone-${exam.id || 'new'}-${milestone.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  const dtstamp = formatDateYYYYMMDD(new Date()) + 'T000000Z';
  const summary = `${exam.name} - ${milestone.label}`;
  const description = `Milestone: ${milestone.label}\\nOfficial Website: ${exam.adUrl || 'N/A'}\\nNotes: ${exam.notes || ''}`.replace(/\r?\n/g, '\\n');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Exam Tracker Pro//Calendar Export//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${formatDateYYYYMMDD(start)}`,
    `DTEND;VALUE=DATE:${formatDateYYYYMMDD(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  // Format filename safely
  const safeExamName = exam.name.replace(/[^a-zA-Z0-9]/g, '_');
  const safeMilestoneName = milestone.label.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `${safeExamName}_${safeMilestoneName}.ics`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
