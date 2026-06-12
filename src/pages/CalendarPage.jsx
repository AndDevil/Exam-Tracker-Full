import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../hooks/useAuth';
import { useExams } from '../hooks/useExams';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Landmark, Briefcase, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function CalendarPage() {
  const { user } = useAuth();
  const { exams, isLoading } = useExams(user?.uid);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Helper to get events for a specific Date object
  const getEventsForDate = (date) => {
    if (!date) return [];
    
    // Normalize date to YYYY-MM-DD
    const dateStr = format(date, 'yyyy-MM-dd');
    const events = [];

    exams.forEach((exam) => {
      if (exam.formStart === dateStr) {
        events.push({ exam, type: 'Form Start', label: 'Application Process Starts', color: 'bg-indigo-500' });
      }
      if (exam.formEnd === dateStr) {
        events.push({ exam, type: 'Form End', label: 'Application Deadline', color: 'bg-amber-500' });
      }
      if (exam.admitDate === dateStr) {
        events.push({ exam, type: 'Admit Card', label: 'Admit Card Available', color: 'bg-purple-500' });
      }
      if (exam.examDate === dateStr) {
        events.push({ exam, type: 'Exam Date', label: 'Exam Day', color: 'bg-red-500' });
      }
    });

    return events;
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  // Custom tile renderer to inject colored dots for events
  const renderTileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const events = getEventsForDate(date);
    if (events.length === 0) return null;

    return (
      <div className="flex justify-center space-x-0.5 mt-1.5 w-full">
        {events.slice(0, 3).map((event, idx) => (
          <span
            key={idx}
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${event.color}`}
            title={`${event.exam.name} - ${event.type}`}
          />
        ))}
        {events.length > 3 && (
          <span className="text-[8px] leading-none text-slate-500 font-bold shrink-0">
            +{events.length - 3}
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center space-x-2.5">
          <CalendarIcon className="text-indigo-600 dark:text-indigo-400" />
          <span>Interactive Calendar</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Visualize form openings, closures, admit card releases, and test days.
        </p>
      </div>

      {/* Main Grid: Left Calendar, Right Date Detail */}
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Calendar Card (Left) */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={renderTileContent}
            className="w-full border-0 shadow-none dark:bg-transparent"
          />

          {/* Color Code Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-850 justify-center">
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Application Open</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Form Deadline</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Admit Card</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Exam Date</span>
            </div>
          </div>
        </div>

        {/* Date Events sidebar (Right) */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight">
              Schedule for {format(selectedDate, 'MMM dd, yyyy')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing milestones falling on this date.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((evt, index) => (
                <div
                  key={index}
                  className="group bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-3 hover:border-indigo-500/20 dark:hover:border-indigo-550/20 transition-all duration-150"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide border ${
                      evt.exam.type === 'Government'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                        : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/15'
                    }`}>
                      {evt.exam.type === 'Government' ? <Landmark size={9} /> : <Briefcase size={9} />}
                      <span>{evt.exam.type}</span>
                    </span>

                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-150 truncate">
                      {evt.exam.name}
                    </h4>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${evt.color}`} />
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{evt.label}</span>
                    </div>
                  </div>

                  <Link
                    to={`/exam/${evt.exam.id}`}
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all duration-150 shadow-sm shrink-0"
                    title="View details"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-slate-600">
                <CalendarIcon size={32} className="mx-auto opacity-40 mb-3" />
                <p className="text-sm font-semibold">No milestones scheduled</p>
                <p className="text-xs max-w-xs mx-auto mt-1 leading-relaxed">
                  Select a different date or click "Add Exam" on the dashboard to register events.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
