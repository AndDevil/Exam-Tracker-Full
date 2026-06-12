import { z } from 'zod';

export const examSchema = z.object({
  name: z.string()
    .min(1, 'Exam name is required')
    .max(100, 'Name must be less than 100 characters'),
  type: z.enum(['Government', 'Private'], {
    invalid_type_error: 'Please select an exam type (Government or Private)',
    required_error: 'Exam type is required'
  }),
  formStart: z.string().or(z.literal('')).nullable().optional(),
  formEnd: z.string().or(z.literal('')).nullable().optional(),
  examDate: z.string().or(z.literal('')).nullable().optional(),
  admitDate: z.string().or(z.literal('')).nullable().optional(),
  adUrl: z.string()
    .url('Please enter a valid URL (starting with http:// or https://)')
    .or(z.literal(''))
    .optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional().default(''),
}).refine((data) => {
  if (data.formStart && data.formEnd) {
    return new Date(data.formEnd) >= new Date(data.formStart);
  }
  return true;
}, {
  message: 'Application end date must be after start date',
  path: ['formEnd']
}).refine((data) => {
  if (data.formStart && data.examDate) {
    return new Date(data.examDate) >= new Date(data.formStart);
  }
  return true;
}, {
  message: 'Exam date must be after application start date',
  path: ['examDate']
});
