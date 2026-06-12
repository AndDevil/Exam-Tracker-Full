import React from 'react';

export const SkeletonStats = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-2/3">
          <div className="h-5 bg-slate-300 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
      </div>
      
      <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-850">
        <div className="flex justify-between">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        </div>
      </div>

      <div className="flex space-x-2 pt-2">
        <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div>
        <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-10"></div>
      </div>
    </div>
  );
};

export const SkeletonDetail = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center space-x-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-3 w-1/2">
            <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          </div>
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-855">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-5 bg-slate-300 dark:bg-slate-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
