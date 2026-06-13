import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExams } from '../hooks/useExams';
import { formatDate, getDaysCountdown } from '../utils/dateHelpers';
import { getGoogleCalendarLink, downloadIcalFile, downloadFullExamIcalFile } from '../utils/calendarExport';
import { SkeletonDetail } from '../components/LoadingSkeleton';
import { 
  ArrowLeft, 
  Calendar, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Landmark, 
  Briefcase, 
  FileText, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, deleteExam, isLoading } = useExams(user?.uid, user?.isDemo);

  const exam = exams.find((e) => e.id === id);

  const handleDelete = async () => {
    if (!exam || !id) return;
    if (window.confirm(`Are you sure you want to delete "${exam.name}"?`)) {
      try {
        if (user?.isDemo) {
          toast.error('Guest Session: Local changes will not sync to database. Sign in to save permanently.');
        }
        await deleteExam(id);
        toast.success('Exam schedule deleted successfully.');
        navigate('/');
      } catch (err: any) {
        console.error("Delete failed:", err);
        toast.error(err.message || 'Failed to delete exam.');
      }
    }
  };

  if (isLoading) {
    return <SkeletonDetail />;
  }

  if (!exam) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <AlertCircle size={48} className="mx-auto text-red-500" />
        <h2 className="text-xl font-bold">Exam Schedule Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          The exam record you are looking for does not exist or has been deleted.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const { name, type, formStart, formEnd, admitDate, examDate, adUrl, notes, isRecurring, recurrenceRule } = exam;

  const milestones = [
    { label: 'Application Process Starts', date: formStart, icon: Calendar },
    { label: 'Application Deadline', date: formEnd, icon: Calendar },
    { label: 'Admit Card Available', date: admitDate, icon: Calendar },
    { label: 'Exam Date', date: examDate, icon: Calendar }
  ];

  const upcomingMilestones = milestones
    .filter((m): m is { label: string; date: string; icon: any } => !!m.date && new Date(m.date).getTime() >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const primaryMilestone = upcomingMilestones[0] || null;
  const primaryCountdown = primaryMilestone ? getDaysCountdown(primaryMilestone.date) : null;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex space-x-2">
          <Link
            to={`/exam/edit/${id}`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors duration-150 cursor-pointer"
          >
            <Edit size={14} />
            <span>Edit Details</span>
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center space-x-1.5 px-4 py-2 border border-red-200 dark:border-red-950/20 hover:border-red-300 dark:hover:border-red-800/80 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors duration-150 cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        <div className="md:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase ${
                  type === 'Government'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                }`}>
                  {type === 'Government' ? <Landmark size={12} /> : <Briefcase size={12} />}
                  <span>{type} Sector</span>
                </span>
                
                {isRecurring && (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/30">
                    <RefreshCw size={12} className="animate-spin-slow" />
                    <span>Repeats: {recurrenceRule?.split('=')[1]?.toLowerCase() || 'monthly'}</span>
                  </span>
                )}
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
                {name}
              </h2>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Exam Milestones
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                {milestones.map((milestone, idx) => {
                  const mCountdown = getDaysCountdown(milestone.date);
                  const isScheduled = !!milestone.date;
                  return (
                    <div key={idx} className="relative group">
                      <div className={`absolute left-[-21px] top-1.5 w-[12px] h-[12px] rounded-full border-2 bg-white dark:bg-slate-900 ${
                        isScheduled 
                          ? mCountdown?.isExpired 
                            ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                            : 'border-indigo-500 dark:border-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
                      }`} />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {milestone.label}
                          </p>
                          <p className={`text-sm font-bold ${isScheduled ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-700'}`}>
                            {formatDate(milestone.date)}
                          </p>
                        </div>

                        {isScheduled && mCountdown && (
                          <div className="flex items-center space-x-2 sm:text-right mt-1 sm:mt-0">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${mCountdown.colorClass}`}>
                              {mCountdown.label}
                            </span>
                            <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                              <a
                                href={getGoogleCalendarLink(exam, { label: milestone.label, date: milestone.date! })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-indigo-500 transition-colors"
                                title="Add to Google Calendar"
                              >
                                <Calendar size={13} />
                              </a>
                              <button
                                onClick={() => downloadIcalFile(exam, { label: milestone.label, date: milestone.date! })}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                                title="Download iCal (.ics)"
                              >
                                <ExternalLink size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {adUrl && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
                <a
                  href={adUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-250 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors duration-150 w-full justify-center"
                >
                  <ExternalLink size={14} />
                  <span>Go to Official Notification Website</span>
                </a>
              </div>
            )}

            {primaryMilestone && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
                  <Calendar size={14} />
                  <span>Calendar Synchronization</span>
                </h4>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={getGoogleCalendarLink(exam, { label: primaryMilestone.label, date: primaryMilestone.date })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-850 text-indigo-650 dark:text-indigo-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors duration-150 justify-center"
                    >
                      <span>Sync Next Milestone to Google Calendar</span>
                    </a>
                    <button
                      onClick={() => downloadIcalFile(exam, { label: primaryMilestone.label, date: primaryMilestone.date })}
                      className="flex-1 inline-flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors duration-150 justify-center cursor-pointer"
                    >
                      <span>Download Next Milestone (.ics)</span>
                    </button>
                  </div>
                  <button
                    onClick={() => downloadFullExamIcalFile(exam)}
                    className="w-full inline-flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors duration-150 justify-center cursor-pointer"
                  >
                    <span>Download Full Exam Schedule (.ics)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {notes && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
                <FileText size={14} />
                <span>Notes & Study Plan</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {notes}
              </p>
            </div>
          )}
        </div>

        {primaryMilestone && primaryCountdown && (
          <div className="md:col-span-4">
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg border border-indigo-400/20 text-center space-y-4">
              <span className="inline-flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                <Calendar size={12} />
                <span>Next Milestone</span>
              </span>

              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white/90">
                  {primaryMilestone.label}
                </h4>
                <p className="text-xs text-white/75">
                  Scheduled for {formatDate(primaryMilestone.date)}
                </p>
              </div>

              <div className="py-2">
                <div className="text-4xl font-extrabold tracking-tight">
                  {primaryCountdown.days === 0 ? (
                    <span>TODAY!</span>
                  ) : primaryCountdown.days === 1 ? (
                    <span>TOMORROW</span>
                  ) : primaryCountdown.days < 0 ? (
                    <span>EXPIRED</span>
                  ) : (
                    <span>
                      {primaryCountdown.days} <span className="text-base font-medium text-white/80">days</span>
                    </span>
                  )}
                </div>
                {primaryCountdown.days > 1 && (
                  <p className="text-[10px] text-white/70 mt-1 uppercase tracking-widest font-semibold">
                    Remaining
                  </p>
                )}
              </div>

              <p className="text-xs text-indigo-100 bg-black/10 p-2.5 rounded-lg">
                Notification reminders are triggered 2 days prior to this event.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
