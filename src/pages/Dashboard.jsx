import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExams } from '../hooks/useExams';
import DashboardStats from '../components/DashboardStats';
import FilterBar from '../components/FilterBar';
import ExamCard from '../components/ExamCard';
import { SkeletonStats, SkeletonCard } from '../components/LoadingSkeleton';
import { FolderPlus, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { exams, isLoading, deleteExam } = useExams(user?.uid);

  // Filter and Sort states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('examDate-asc');

  // Filter logic
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = 
      exam.name.toLowerCase().includes(search.toLowerCase()) ||
      (exam.notes && exam.notes.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = typeFilter === 'All' || exam.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Sorting logic
  const sortedExams = [...filteredExams].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    
    if (sortBy === 'createdAt-desc') {
      // Compare firestore timestamps or timestamps in strings
      const aTime = a.createdAt ? (a.createdAt.seconds || new Date(a.createdAt).getTime()) : 0;
      const bTime = b.createdAt ? (b.createdAt.seconds || new Date(b.createdAt).getTime()) : 0;
      return bTime - aTime;
    }

    // Sort by dates
    const dateField = sortBy.split('-')[0]; // 'examDate' or 'formEnd'
    const dateA = a[dateField];
    const dateB = b[dateField];

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1; // Put records with no date at the bottom
    if (!dateB) return -1;

    return new Date(dateA) - new Date(dateB);
  });

  const handleDelete = async (examId) => {
    try {
      await deleteExam(examId);
    } catch (err) {
      console.error("Failed to delete exam:", err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Keep track of your exam applications and dates.
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

      {isLoading ? (
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
          {/* Stats Summary */}
          <DashboardStats exams={exams} />

          {/* Filtering and Search Controls */}
          <FilterBar
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          {/* Main Grid List */}
          {sortedExams.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedExams.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  onDelete={handleDelete}
                />
              ))}
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
      )}
    </div>
  );
}
