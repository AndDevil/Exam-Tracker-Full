import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Helper to get the exams collection reference for a user.
 */
export const getExamsCollection = (userId) => {
  return collection(db, 'users', userId, 'exams');
};

/**
 * Helper to get a specific exam document reference.
 */
export const getExamDoc = (userId, examId) => {
  return doc(db, 'users', userId, 'exams', examId);
};

/**
 * Add a new exam.
 */
export const addExam = async (userId, examData) => {
  const collectionRef = getExamsCollection(userId);
  const data = {
    ...examData,
    userId,
    createdAt: serverTimestamp(),
  };
  return await addDoc(collectionRef, data);
};

/**
 * Update an existing exam.
 */
export const updateExam = async (userId, examId, examData) => {
  const docRef = getExamDoc(userId, examId);
  return await updateDoc(docRef, {
    ...examData,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete an exam.
 */
export const deleteExam = async (userId, examId) => {
  const docRef = getExamDoc(userId, examId);
  return await deleteDoc(docRef);
};

/**
 * Subscribe to the user's exams in real-time.
 * Sorted by examDate (nearest first).
 */
export const subscribeToExams = (userId, onNext, onError) => {
  const collectionRef = getExamsCollection(userId);
  // We fetch and sort in JavaScript or Firestore. 
  // Sorting in Firestore requires an index, which is automatically created,
  // but to avoid index-creation errors offline, we can sort in JS or use query.
  // We'll use Firestore query sorted by examDate (ascending).
  const q = query(collectionRef, orderBy('examDate', 'asc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const exams = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      onNext(exams);
    },
    (error) => {
      console.error("Firestore onSnapshot error:", error);
      if (onError) onError(error);
    }
  );
};
