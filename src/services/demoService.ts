import { Exam } from '../types';
import { getInitialDemoExams } from './demoData';

export const getDemoExams = (): Exam[] => {
  const data = localStorage.getItem('demo_exams');
  if (!data) {
    const defaults = getInitialDemoExams();
    localStorage.setItem('demo_exams', JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
};

export const saveDemoExams = (exams: Exam[]) => {
  localStorage.setItem('demo_exams', JSON.stringify(exams));
  window.dispatchEvent(new Event('demo-exams-updated'));
};

export const addDemoExam = async (exam: Omit<Exam, 'id' | 'userId'>): Promise<Exam> => {
  const exams = getDemoExams();
  const newExam: Exam = {
    ...exam,
    id: `demo-${Date.now()}`,
    userId: 'demo-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  exams.push(newExam);
  saveDemoExams(exams);
  return newExam;
};

export const updateDemoExam = async (examId: string, examData: Partial<Exam>): Promise<void> => {
  const exams = getDemoExams();
  const updated = exams.map(e => e.id === examId ? { ...e, ...examData, updatedAt: new Date().toISOString() } : e);
  saveDemoExams(updated);
};

export const deleteDemoExam = async (examId: string): Promise<void> => {
  const exams = getDemoExams();
  const filtered = exams.filter(e => e.id !== examId);
  saveDemoExams(filtered);
};
