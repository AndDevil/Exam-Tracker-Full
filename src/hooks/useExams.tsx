import { useEffect, useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  addExam as addExamDb, 
  updateExam as updateExamDb, 
  deleteExam as deleteExamDb, 
  getExamsPage,
  subscribeToExams 
} from '../services/examService';
import { 
  getDemoExams, 
  addDemoExam, 
  updateDemoExam, 
  deleteDemoExam 
} from '../services/demoService';
import { Exam } from '../types';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export const useExams = (userId: string | undefined, isDemo = false) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadExams = useCallback(async (isInitial = true) => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError(null);

      if (isDemo) {
        const allDemoExams = getDemoExams();
        allDemoExams.sort((a, b) => {
          if (!a.examDate && !b.examDate) return 0;
          if (!a.examDate) return 1;
          if (!b.examDate) return -1;
          return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
        });

        const pageSize = 10;
        const currentCount = isInitial ? 0 : exams.length;
        const nextPageExams = allDemoExams.slice(0, currentCount + pageSize);
        
        setExams(nextPageExams);
        setHasMore(nextPageExams.length < allDemoExams.length);
      } else {
        const pageSize = 10;
        const cursor = isInitial ? null : lastDoc;
        const result = await getExamsPage(userId, pageSize, cursor);
        
        if (isInitial) {
          setExams(result.exams);
        } else {
          setExams((prev) => {
            const existingIds = new Set(prev.map(e => e.id));
            const fresh = result.exams.filter(e => !existingIds.has(e.id));
            return [...prev, ...fresh];
          });
        }
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      }
    } catch (err) {
      setError(err);
      console.error("Error loading exams:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isDemo, lastDoc, exams.length]);

  useEffect(() => {
    if (!userId) return;

    if (isDemo) {
      loadExams(true);
      const handleDemoUpdate = () => {
        loadExams(true);
      };
      window.addEventListener('demo-exams-updated', handleDemoUpdate);
      return () => window.removeEventListener('demo-exams-updated', handleDemoUpdate);
    } else {
      const unsubscribe = subscribeToExams(
        userId,
        (fetchedExams) => {
          setExams((prev) => {
            const currentSize = Math.max(10, prev.length);
            const hasMoreDocs = fetchedExams.length > currentSize;
            setHasMore(hasMoreDocs);
            return fetchedExams.slice(0, currentSize);
          });
        },
        (err) => {
          console.error("Real-time sync error:", err);
          setError(err);
        }
      );
      return () => unsubscribe();
    }
  }, [userId, isDemo]);

  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    await loadExams(false);
  };

  const addMutation = useMutation({
    mutationFn: (examData: Omit<Exam, 'id' | 'userId'>) => {
      if (isDemo) {
        return addDemoExam(examData);
      }
      return addExamDb(userId!, examData);
    },
    onSuccess: () => {
      if (isDemo) {
        loadExams(true);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ examId, examData }: { examId: string; examData: Partial<Exam> }) => {
      if (isDemo) {
        return updateDemoExam(examId, examData);
      }
      return updateExamDb(userId!, examId, examData);
    },
    onSuccess: () => {
      if (isDemo) {
        loadExams(true);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (examId: string) => {
      if (isDemo) {
        return deleteDemoExam(examId);
      }
      return deleteExamDb(userId!, examId);
    },
    onSuccess: () => {
      if (isDemo) {
        loadExams(true);
      }
    },
  });

  return {
    exams,
    isLoading,
    hasMore,
    error,
    loadMore,
    addExam: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateExam: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteExam: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
