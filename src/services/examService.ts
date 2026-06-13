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
  limit,
  startAfter,
  getDocs,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { Exam } from '../types';
import { retryWithBackoff } from '../utils/retry';

export const getExamsCollection = (userId: string) => {
  return collection(db, 'users', userId, 'exams');
};

export const getExamDoc = (userId: string, examId: string) => {
  return doc(db, 'users', userId, 'exams', examId);
};

export const addExam = async (userId: string, examData: Omit<Exam, 'id' | 'userId'>): Promise<any> => {
  return retryWithBackoff(async () => {
    const collectionRef = getExamsCollection(userId);
    const data = {
      ...examData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    return await addDoc(collectionRef, data);
  });
};

export const updateExam = async (userId: string, examId: string, examData: Partial<Exam>): Promise<void> => {
  return retryWithBackoff(async () => {
    const docRef = getExamDoc(userId, examId);
    await updateDoc(docRef, {
      ...examData,
      updatedAt: serverTimestamp(),
    });
  });
};

export const deleteExam = async (userId: string, examId: string): Promise<void> => {
  return retryWithBackoff(async () => {
    const docRef = getExamDoc(userId, examId);
    await deleteDoc(docRef);
  });
};

export const subscribeToExams = (
  userId: string,
  onNext: (exams: Exam[]) => void,
  onError?: (error: Error) => void
) => {
  const collectionRef = getExamsCollection(userId);
  const q = query(collectionRef, orderBy('examDate', 'asc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const exams = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Exam[];
      onNext(exams);
    },
    (error) => {
      console.error("Firestore onSnapshot error:", error);
      if (onError) onError(error);
    }
  );
};

export interface PaginatedExams {
  exams: Exam[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export const getExamsPage = async (
  userId: string,
  limitVal: number,
  startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedExams> => {
  return retryWithBackoff(async () => {
    const collectionRef = getExamsCollection(userId);
    let q = query(collectionRef, orderBy('examDate', 'asc'), limit(limitVal));
    if (startAfterDoc) {
      q = query(collectionRef, orderBy('examDate', 'asc'), startAfter(startAfterDoc), limit(limitVal));
    }
    
    const snapshot = await getDocs(q);
    const exams = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Exam[];

    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    return {
      exams,
      lastDoc,
      hasMore: snapshot.docs.length === limitVal
    };
  });
};
