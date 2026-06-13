import ical from 'ical-generator';
import { Exam } from '../types';

const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

export const getGoogleCalendarLink = (exam: Exam, milestone: { label: string; date: string }) => {
  const start = parseDate(milestone.date);
  if (!start) return '#';

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const formatDateYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  };

  const dateRange = `${formatDateYYYYMMDD(start)}/${formatDateYYYYMMDD(end)}`;
  const title = `${exam.name} - ${milestone.label}`;
  const details = `Milestone: ${milestone.label}\nOfficial Notification Website: ${exam.adUrl || 'N/A'}\nNotes: ${exam.notes || 'No notes added.'}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateRange}&details=${encodeURIComponent(details)}`;
};

export const downloadIcalFile = (exam: Exam, milestone: { label: string; date: string }) => {
  const start = parseDate(milestone.date);
  if (!start) return;

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const cal = ical({ name: `${exam.name} - ${milestone.label}` });
  cal.createEvent({
    id: `milestone-${exam.id || 'new'}-${milestone.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
    start,
    end,
    allDay: true,
    summary: `${exam.name} - ${milestone.label}`,
    description: `Milestone: ${milestone.label}\nOfficial Website: ${exam.adUrl || 'N/A'}\nNotes: ${exam.notes || ''}`,
    url: exam.adUrl || undefined
  });

  const blob = new Blob([cal.toString()], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  const safeExamName = exam.name.replace(/[^a-zA-Z0-9]/g, '_');
  const safeMilestoneName = milestone.label.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `${safeExamName}_${safeMilestoneName}.ics`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadFullExamIcalFile = (exam: Exam) => {
  const cal = ical({ name: `${exam.name} Schedule` });
  let addedEvents = 0;

  const milestones = [
    { label: 'Application Process Starts', date: exam.formStart },
    { label: 'Application Deadline', date: exam.formEnd },
    { label: 'Admit Card Available', date: exam.admitDate },
    { label: 'Exam Date', date: exam.examDate }
  ];

  milestones.forEach(m => {
    const start = parseDate(m.date);
    if (!start) return;

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    cal.createEvent({
      id: `milestone-${exam.id || 'new'}-${m.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
      start,
      end,
      allDay: true,
      summary: `${exam.name} - ${m.label}`,
      description: `Milestone: ${m.label}\nOfficial Website: ${exam.adUrl || 'N/A'}\nNotes: ${exam.notes || ''}`,
      url: exam.adUrl || undefined
    });
    addedEvents++;
  });

  if (addedEvents === 0) return;

  const blob = new Blob([cal.toString()], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  const safeExamName = exam.name.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `${safeExamName}_Full_Schedule.ics`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
