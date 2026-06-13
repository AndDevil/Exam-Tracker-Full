import { Landmark, Briefcase, CalendarClock, FolderHeart } from 'lucide-react';
import { Exam } from '../types';

interface DashboardStatsProps {
  exams?: Exam[];
}

export default function DashboardStats({ exams = [] }: DashboardStatsProps) {
  const total = exams.length;
  
  const govt = exams.filter(e => e.type === 'Government').length;
  const priv = exams.filter(e => e.type === 'Private').length;
  
  const upcoming = exams.filter(e => {
    if (!e.examDate) return false;
    return new Date(e.examDate) >= new Date(new Date().setHours(0, 0, 0, 0));
  }).length;

  const statItems = [
    {
      label: 'Total Exams',
      value: total,
      icon: FolderHeart,
      colorClass: 'text-indigo-500 dark:text-indigo-400',
      bgClass: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      label: 'Government',
      value: govt,
      icon: Landmark,
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      label: 'Private Sector',
      value: priv,
      icon: Briefcase,
      colorClass: 'text-purple-500 dark:text-purple-400',
      bgClass: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      label: 'Upcoming Tests',
      value: upcoming,
      icon: CalendarClock,
      colorClass: 'text-amber-500 dark:text-amber-400',
      bgClass: 'bg-amber-500/10 border-amber-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statItems.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className={`p-3 rounded-xl ${stat.bgClass} ${stat.colorClass} shrink-0`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {stat.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}
