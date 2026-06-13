export type ExamType = 'Government' | 'Private';

export interface Exam {
  id?: string;
  name: string;
  type: ExamType;
  formStart?: string | null;
  formEnd?: string | null;
  examDate?: string | null;
  admitDate?: string | null;
  adUrl?: string;
  notes?: string;
  userId: string;
  createdAt?: any; // Firestore serverTimestamp or Date/Timestamp
  updatedAt?: any;

  // Recurring Exam Support
  isRecurring?: boolean;
  recurrenceRule?: string; // RRule string representation
  recurringParentId?: string; // Original exam instance ID
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  isDemo?: boolean;
}

export interface NotificationToken {
  token: string;
  userId: string;
  createdAt: any;
}
