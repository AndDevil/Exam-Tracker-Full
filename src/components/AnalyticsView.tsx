import { 
  PieChart, 
  TrendingUp, 
  Hourglass,
  CalendarCheck,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { Exam } from '../types';

interface AnalyticsViewProps {
  exams?: Exam[];
}

export default function AnalyticsView({ exams = [] }: AnalyticsViewProps) {
  const total = exams.length;
  
  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm space-y-4">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full w-fit mx-auto">
          <PieChart size={36} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Data for Analytics</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
          Create some exam schedules with deadline and test dates to generate analytical insights.
        </p>
      </div>
    );
  }

  // 1. Sector Splitting Metrics
  const govtCount = exams.filter(e => e.type === 'Government').length;
  const privateCount = exams.filter(e => e.type === 'Private').length;
  const govtPercent = Math.round((govtCount / total) * 100);
  const privatePercent = Math.round((privateCount / total) * 100);

  // 2. Urgent Milestone Metrics
  const todayStart = new Date().setHours(0,0,0,0);
  const threeDaysFromNow = new Date().getTime() + (3 * 24 * 60 * 60 * 1000);

  const examsToday = exams.filter(e => e.examDate && new Date(e.examDate).setHours(0,0,0,0) === todayStart).length;
  
  const deadlinesExpiringSoon = exams.filter(e => {
    if (!e.formEnd) return false;
    const t = new Date(e.formEnd).getTime();
    return t >= todayStart && t <= threeDaysFromNow;
  }).length;

  const totalUpcomingTests = exams.filter(e => e.examDate && new Date(e.examDate).getTime() >= todayStart).length;

  // 3. Next 6 Months Load Distribution (Timeline Bar Chart)
  interface MonthlyLoadItem {
    monthIndex: number;
    year: number;
    label: string;
    count: number;
  }

  const getNext6Months = (): MonthlyLoadItem[] => {
    const months: MonthlyLoadItem[] = [];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
      months.push({
        monthIndex: date.getMonth(),
        year: date.getFullYear(),
        label: date.toLocaleString('default', { month: 'short' }),
        count: 0
      });
      date.setMonth(date.getMonth() + 1);
    }
    return months;
  };

  const monthlyLoad = getNext6Months();
  exams.forEach(exam => {
    if (!exam.examDate) return;
    const examDateObj = new Date(exam.examDate);
    const m = examDateObj.getMonth();
    const y = examDateObj.getFullYear();
    
    const matchedMonth = monthlyLoad.find(item => item.monthIndex === m && item.year === y);
    if (matchedMonth) {
      matchedMonth.count += 1;
    }
  });

  const maxMonthlyCount = Math.max(...monthlyLoad.map(m => m.count), 1);

  return (
    <div className="space-y-6">
      {/* Top section: Grid layout */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Sector Ratio Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm md:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
              <PieChart size={14} />
              <span>Sector Distribution</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ratio of government vs private exams</p>
          </div>

          <div className="space-y-4 py-2">
            {/* Visual Custom Progress bar */}
            <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${govtPercent}%` }}
                title={`Government: ${govtPercent}%`}
              />
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
                style={{ width: `${privatePercent}%` }}
                title={`Private: ${privatePercent}%`}
              />
            </div>

            {/* Labels and values */}
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Government Sector</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">{govtCount} ({govtPercent}%)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Private Sector</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">{privateCount} ({privatePercent}%)</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-2 border border-slate-100 dark:border-slate-800/70">
            <TrendingUp size={14} className="text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span>
              {govtCount >= privateCount 
                ? 'Your schedule is currently focused primarily on Government Sector examinations.' 
                : 'Your schedule is currently focused primarily on Private Sector careers and tests.'}
            </span>
          </div>
        </div>

        {/* Milestone Urgency Stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm md:col-span-7 space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
            <ClipboardList size={14} />
            <span>Milestone Analytics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl space-y-2">
              <div className="flex items-center space-x-1 text-amber-500 dark:text-amber-400">
                <Hourglass size={15} />
                <span className="text-[10px] uppercase font-bold tracking-wider">Deadlines (3d)</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{deadlinesExpiringSoon}</div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                Applications closing within 3 days.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl space-y-2">
              <div className="flex items-center space-x-1 text-red-500 dark:text-red-400">
                <AlertCircle size={15} />
                <span className="text-[10px] uppercase font-bold tracking-wider">Exams Today</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{examsToday}</div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                Tests scheduled for today.
              </p>
            </div>

            {/* Metric 3 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl space-y-2">
              <div className="flex items-center space-x-1 text-indigo-500 dark:text-indigo-400">
                <CalendarCheck size={15} />
                <span className="text-[10px] uppercase font-bold tracking-wider">Upcoming Tests</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{totalUpcomingTests}</div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                Total future exams scheduled.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly distribution bar chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
            <TrendingUp size={14} />
            <span>Monthly Exam Load (Next 6 Months)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Concentration of test dates by month</p>
        </div>

        {/* Custom CSS Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-48 pt-6 px-2 sm:px-6 relative border-b border-slate-100 dark:border-slate-800">
          {monthlyLoad.map((item, idx) => {
            const pct = (item.count / maxMonthlyCount) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                {/* Tooltip on Hover */}
                <div className="absolute top-[-24px] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-[10px] px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
                  {item.count} {item.count === 1 ? 'Exam' : 'Exams'}
                </div>

                {/* Animated Bar */}
                <div 
                  className={`w-full max-w-[42px] rounded-t-lg transition-all duration-500 ease-out bg-gradient-to-t ${
                    item.count === 0 
                      ? 'bg-slate-100 dark:bg-slate-800 h-[8px]' 
                      : 'from-indigo-600 via-indigo-500 to-purple-500 group-hover:brightness-105 shadow-md shadow-indigo-500/10'
                  }`}
                  style={{ height: item.count === 0 ? '8px' : `calc(${pct}% - 24px)` }}
                />

                {/* Label */}
                <div className="text-2xs font-extrabold uppercase text-slate-400 dark:text-slate-500 mt-2 tracking-wide">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
