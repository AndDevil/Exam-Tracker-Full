import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { examSchema } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { useExams } from '../hooks/useExams';
import { ArrowLeft, Landmark, Briefcase, Calendar, Link as LinkIcon, FileText, Sparkles } from 'lucide-react';

export default function ExamForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const { exams, addExam, updateExam, isLoading } = useExams(user?.uid);
  const [saveError, setSaveError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentExam = exams.find((e) => e.id === id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: '',
      type: 'Government',
      formStart: '',
      formEnd: '',
      examDate: '',
      admitDate: '',
      adUrl: '',
      notes: ''
    }
  });

  const selectedType = watch('type');

  // Load current exam data if editing
  useEffect(() => {
    if (isEditMode && currentExam) {
      setValue('name', currentExam.name || '');
      setValue('type', currentExam.type || 'Government');
      setValue('formStart', currentExam.formStart || '');
      setValue('formEnd', currentExam.formEnd || '');
      setValue('examDate', currentExam.examDate || '');
      setValue('admitDate', currentExam.admitDate || '');
      setValue('adUrl', currentExam.adUrl || '');
      setValue('notes', currentExam.notes || '');
    }
  }, [isEditMode, currentExam, setValue]);

  const onSubmit = async (data) => {
    try {
      setSaveError('');
      setSubmitting(true);

      // Clean empty fields to null for database
      const cleanedData = {
        ...data,
        formStart: data.formStart || null,
        formEnd: data.formEnd || null,
        examDate: data.examDate || null,
        admitDate: data.admitDate || null,
        adUrl: data.adUrl || '',
        notes: data.notes || ''
      };

      if (isEditMode) {
        await updateExam({ examId: id, examData: cleanedData });
        navigate(`/exam/${id}`);
      } else {
        await addExam(cleanedData);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setSaveError('An error occurred while saving. Please check your offline status.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditMode && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to={isEditMode ? `/exam/${id}` : '/'}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {isEditMode ? 'Edit Exam Details' : 'Add New Exam Schedule'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill in all dates to enable push notification reminders and dashboard countdowns.
            </p>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm mb-6">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Exam Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Exam Name *
            </label>
            <input
              type="text"
              placeholder="e.g. UPSC Civil Services, AWS Solution Architect"
              {...register('name')}
              className={`block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-sm focus:outline-none transition-all duration-150 ${
                errors.name 
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                  : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name.message}</p>
            )}
          </div>

          {/* Exam Type Toggle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Exam Sector / Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setValue('type', 'Government')}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-sm font-bold transition-all duration-200 cursor-pointer ${
                  selectedType === 'Government'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50'
                }`}
              >
                <Landmark size={16} />
                <span>Government</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'Private')}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-sm font-bold transition-all duration-200 cursor-pointer ${
                  selectedType === 'Private'
                    ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-500/35 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50'
                }`}
              >
                <Briefcase size={16} />
                <span>Private / Certifications</span>
              </button>
            </div>
          </div>

          {/* Dates Grid */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-5 grid md:grid-cols-2 gap-6">
            {/* Form Start Date */}
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Calendar size={14} />
                <span>Application Start Date</span>
              </label>
              <input
                type="date"
                {...register('formStart')}
                className="block w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl text-sm focus:outline-none transition-colors"
              />
            </div>

            {/* Form End Date */}
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Calendar size={14} />
                <span>Application End Date</span>
              </label>
              <input
                type="date"
                {...register('formEnd')}
                className={`block w-full px-4 py-2 bg-white dark:bg-slate-900 border focus:outline-none rounded-xl text-sm transition-colors ${
                  errors.formEnd 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400'
                }`}
              />
              {errors.formEnd && (
                <p className="text-red-500 text-xs mt-1 font-semibold">{errors.formEnd.message}</p>
              )}
            </div>

            {/* Admit Card Date */}
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Calendar size={14} />
                <span>Admit Card Date</span>
              </label>
              <input
                type="date"
                {...register('admitDate')}
                className="block w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl text-sm focus:outline-none transition-colors"
              />
            </div>

            {/* Exam Date */}
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Calendar size={14} />
                <span>Exam Date</span>
              </label>
              <input
                type="date"
                {...register('examDate')}
                className={`block w-full px-4 py-2 bg-white dark:bg-slate-900 border focus:outline-none rounded-xl text-sm transition-colors ${
                  errors.examDate 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400'
                }`}
              />
              {errors.examDate && (
                <p className="text-red-500 text-xs mt-1 font-semibold">{errors.examDate.message}</p>
              )}
            </div>
          </div>

          {/* Advertisement URL */}
          <div className="space-y-1.5">
            <label className="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <LinkIcon size={14} />
              <span>Official Notification URL</span>
            </label>
            <input
              type="text"
              placeholder="https://example.gov/notifications/exam-2026"
              {...register('adUrl')}
              className={`block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-sm focus:outline-none transition-all duration-150 ${
                errors.adUrl 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400'
              }`}
            />
            {errors.adUrl && (
              <p className="text-red-500 text-xs mt-1 font-semibold">{errors.adUrl.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <FileText size={14} />
              <span>Additional Notes</span>
            </label>
            <textarea
              rows="4"
              placeholder="e.g. syllabus details, preparation plans, documents needed..."
              {...register('notes')}
              className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl text-sm focus:outline-none transition-all duration-150 resize-y"
            ></textarea>
            {errors.notes && (
              <p className="text-red-500 text-xs mt-1 font-semibold">{errors.notes.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-150 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isEditMode ? 'Save Changes' : 'Create Schedule'}</span>
              )}
            </button>
            <Link
              to={isEditMode ? `/exam/${id}` : '/'}
              className="flex-1 text-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-350 font-bold py-3 px-4 rounded-xl transition-colors duration-150"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
