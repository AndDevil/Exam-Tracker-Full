import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, getDaysCountdown } from '../utils/dateHelpers';
import { ExternalLink, Calendar, Hourglass, Landmark, Briefcase, Eye, Edit, Trash2 } from 'lucide-react';

export default function ExamCard({ exam, onDelete }) {
  const { id, name, type, formEnd, examDate, adUrl, notes } = exam;

  const examCountdown = getDaysCountdown(examDate);
  const deadlineCountdown = getDaysCountdown(formEnd);

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Decorative colored top border bar depending on exam type */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        type === 'Government' 
          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
          : 'bg-gradient-to-r from-purple-500 to-indigo-500'
      }`} />

      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1 max-w-[70%]">
            <h3 className="font-bold text-lg leading-tight tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150 truncate" title={name}>
              {name}
            </h3>
            
            {/* Tag */}
            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              type === 'Government'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
            }`}>
              {type === 'Government' ? <Landmark size={10} /> : <Briefcase size={10} />}
              <span>{type}</span>
            </span>
          </div>

          {/* Quick Action Icons */}
          <div className="flex space-x-1">
            <Link
              to={`/exam/edit/${id}`}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
              title="Edit Exam"
            >
              <Edit size={15} />
            </Link>
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 cursor-pointer"
              title="Delete Exam"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Notes Snippet */}
        {notes && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {notes}
          </p>
        )}

        {/* Date Indicators */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-850">
          {/* Form Deadline */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-semibold">
              <Hourglass size={14} className="shrink-0" />
              <span>Apply Deadline:</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-700 dark:text-slate-350 font-bold">
                {formatDate(formEnd)}
              </span>
              {deadlineCountdown && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${deadlineCountdown.colorClass}`}>
                  {deadlineCountdown.label}
                </span>
              )}
            </div>
          </div>

          {/* Exam Date */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-semibold">
              <Calendar size={14} className="shrink-0" />
              <span>Exam Date:</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-700 dark:text-slate-350 font-bold">
                {formatDate(examDate)}
              </span>
              {examCountdown && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${examCountdown.colorClass}`}>
                  {examCountdown.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 mt-5">
        <Link
          to={`/exam/${id}`}
          className="flex-1 inline-flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-550/10 dark:hover:bg-indigo-550/20 text-indigo-600 dark:text-indigo-400 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors duration-150"
        >
          <Eye size={14} />
          <span>View Details</span>
        </Link>
        {adUrl && (
          <a
            href={adUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all duration-150"
            title="Official Advertisement Website"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
