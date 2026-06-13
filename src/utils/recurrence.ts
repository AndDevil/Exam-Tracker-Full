import { RRule } from 'rrule';
import { Exam } from '../types';

/**
 * Calculates the next occurrence date based on an RRULE string and a starting date.
 */
export const getNextOccurrenceDate = (ruleStr: string, fromDateStr: string): string | null => {
  try {
    const cleanRuleStr = ruleStr.replace(/^RRULE:/i, '');
    const rule = RRule.fromString(cleanRuleStr);
    const fromDate = new Date(fromDateStr);
    // Find the next occurrence strictly after the current date
    const next = rule.after(fromDate, false);
    if (!next) return null;
    return next.toISOString().split('T')[0];
  } catch (err) {
    console.error("RRule parsing failed for rule:", ruleStr, err);
    return null;
  }
};

/**
 * Automatically check and roll over passed recurring exams, producing new instances.
 */
export const checkAndRollOverRecurringExams = async (
  exams: Exam[],
  addExam: (examData: Omit<Exam, 'id' | 'userId'>) => Promise<any>,
  updateExam: (payload: { examId: string; examData: Partial<Exam> }) => Promise<any>
) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  for (const exam of exams) {
    // Only roll over if it is recurring, has a rule, has an examDate, and the examDate has passed (prior to today)
    if (exam.isRecurring && exam.recurrenceRule && exam.examDate && exam.examDate < todayStr) {
      const nextDate = getNextOccurrenceDate(exam.recurrenceRule, exam.examDate);
      
      if (nextDate) {
        // Create future instance
        const futureExam: Omit<Exam, 'id' | 'userId'> = {
          name: exam.name,
          type: exam.type,
          formStart: exam.formStart ? getNextOccurrenceDate(exam.recurrenceRule, exam.formStart) : null,
          formEnd: exam.formEnd ? getNextOccurrenceDate(exam.recurrenceRule, exam.formEnd) : null,
          examDate: nextDate,
          admitDate: exam.admitDate ? getNextOccurrenceDate(exam.recurrenceRule, exam.admitDate) : null,
          adUrl: exam.adUrl,
          notes: exam.notes,
          isRecurring: true,
          recurrenceRule: exam.recurrenceRule,
          recurringParentId: exam.id
        };

        try {
          // Add the next instance
          await addExam(futureExam);
          // Turn off recurrence on the past instance to prevent double-triggering it
          await updateExam({
            examId: exam.id!,
            examData: { isRecurring: false }
          });
        } catch (err) {
          console.error("Failed to rollover recurring exam:", exam.name, err);
        }
      }
    }
  }
};
