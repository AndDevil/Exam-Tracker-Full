import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  addExam as addExamDb, 
  updateExam as updateExamDb, 
  deleteExam as deleteExamDb, 
  subscribeToExams 
} from '../services/examService';

export const useExams = (userId) => {
  const queryClient = useQueryClient();
  const queryKey = ['exams', userId];

  // We set up a React Query that reads from the cache.
  // The query is populated by the real-time subscription below.
  const { data: exams = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => {
      // In case we want to support query fetching when subscription is slow
      return queryClient.getQueryData(queryKey) || [];
    },
    enabled: !!userId,
    staleTime: Infinity, // Data is updated in real-time, no need for automatic refetching
  });

  // Set up the real-time listener
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToExams(
      userId,
      (fetchedExams) => {
        // Directly update the React Query cache
        queryClient.setQueryData(['exams', userId], fetchedExams);
      },
      (error) => {
        console.error("Real-time sync error:", error);
      }
    );

    return () => unsubscribe();
  }, [userId, queryClient]);

  // Mutations
  const addMutation = useMutation({
    mutationFn: (examData) => addExamDb(userId, examData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ examId, examData }) => updateExamDb(userId, examId, examData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (examId) => deleteExamDb(userId, examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    exams,
    // It is only loading if there is no cache yet and the hook is marked loading
    isLoading: isLoading && exams.length === 0,
    error,
    addExam: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateExam: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteExam: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
