import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExams } from '../hooks/useExams';
import DashboardStats from '../components/DashboardStats';
import FilterBar from '../components/FilterBar';
import ExamCard from '../components/ExamCard';
import { SkeletonStats, SkeletonCard } from '../components/LoadingSkeleton';
import { requestNotificationPermission, checkAndTriggerLocalNotifications } from '../utils/localNotifications';
import { checkAndRollOverRecurringExams } from '../utils/recurrence';
import AnalyticsView from '../components/AnalyticsView';
import { FolderPlus, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const { exams, isLoading, hasMore, loadMore, deleteExam, addExam, updateExam } = useExams(user?.uid, user?.isDemo);
  const rolloverInProgressRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading && exams && exams.length > 0) {
      requestNotificationPermission().then(() => {
        checkAndTriggerLocalNotifications(exams);
      });
      
      // Auto rollover passed recurring exams with safety locks to prevent duplicate submissions
      const todayStr = new Date().toISOString().split('T')[0];
      const eligibleExams = exams.filter(exam => 
        exam.isRecurring && 
        exam.recurrenceRule && 
        exam.examDate && 
        exam.examDate < todayStr && 
        !rolloverInProgressRef.current.has(exam.id!)
      );

      if (eligibleExams.length > 0) {
        eligibleExams.forEach(exam => {
          if (exam.id) {
            rolloverInProgressRef.current.add(exam.id);
          }
        });
        checkAndRollOverRecurringExams(eligibleExams, addExam, updateExam).catch((err) => {
          console.error("Rollover failure:", err);
        });
      }
    }
  }, [isLoading, exams, addExam, updateExam]);

  // Filter and Sort states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('examDate-asc');
  const [activeTab, setActiveTab] = useState('cards');

  // Filter logic
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = 
      exam.name.toLowerCase().includes(search.toLowerCase()) ||
      (exam.notes && exam.notes.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = typeFilter === 'All' || exam.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Sorting logic
  const sortedExams = [...filteredExams].sort((a: any, b: any) => {
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    
    if (sortBy === 'createdAt-desc') {
      const aTime = a.createdAt ? (a.createdAt.seconds || new Date(a.createdAt).getTime()) : 0;
      const bTime = b.createdAt ? (b.createdAt.seconds || new Date(b.createdAt).getTime()) : 0;
      return bTime - aTime;
    }

    const dateField = sortBy.split('-')[0];
    const dateA = a[dateField];
    const dateB = b[dateField];

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  const handleDelete = async (examId: string) => {
    try {
      if (user?.isDemo) {
        toast.error('Guest Session: Local mutations will not sync to remote servers. Sign in to save permanently.');
      }
      await deleteExam(examId);
      toast.success('Exam schedule deleted successfully.');
    } catch (err: any) {
      console.error("Failed to delete exam:", err);
      toast.error(err.message || 'Failed to delete exam. Please try again.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Keep track of your exam applications and dates.
            {user?.isDemo && <span className="text-indigo-500 font-bold ml-1.5">(Guest Demo Active)</span>}
          </p>
        </div>

        <Link
          to="/exam/new"
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md hover:shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <FolderPlus size={16} />
          <span>Add Exam Date</span>
        </Link>
      </div>

      {isLoading && exams.length === 0 ? (
        <>
          <SkeletonStats />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm mb-6">
            <button
              onClick={() => setActiveTab('cards')}
              className={`pb-3 font-extrabold transition-all duration-200 border-b-2 cursor-pointer ${
                activeTab === 'cards'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              📋 Exam Cards
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 font-extrabold transition-all duration-200 border-b-2 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              📊 Analytics Insights
            </button>
          </div>

          {activeTab === 'cards' ? (
            <>
              <DashboardStats exams={exams} />

              <FilterBar
                search={search}
                setSearch={setSearch}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />

              {sortedExams.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedExams.map((exam) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={loadMore}
                        className="inline-flex items-center justify-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold py-2.5 px-6 rounded-xl text-sm transition-all duration-150 cursor-pointer shadow-sm"
                      >
                        <span>Load More Exams</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm space-y-5">
                  <div className="p-4 bg-indigo-550/10 text-indigo-500 dark:text-indigo-400 rounded-full w-fit mx-auto">
                    <BookOpen size={36} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                      No exams found
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                      {exams.length === 0
                        ? "Start tracking your academic progress by creating your first exam schedule."
                        : "No exams match your search criteria. Try adjusting your query."}
                    </p>
                  </div>

                  {exams.length === 0 && (
                    <Link
                      to="/exam/new"
                      className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md cursor-pointer"
                    >
                      <FolderPlus size={16} />
                      <span>Create First Exam</span>
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <AnalyticsView exams={exams} />
          )}
        </>
      )}
    </div>
  );
}
