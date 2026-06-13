import { Exam } from '../types';

export const getInitialDemoExams = (): Exam[] => {
  const today = new Date();
  
  const addDays = (date: Date, days: number): string => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate.toISOString().split('T')[0];
  };

  return [
    {
      id: 'demo-1',
      name: 'UPSC Civil Services Examination 2026',
      type: 'Government',
      formStart: addDays(today, -15),
      formEnd: addDays(today, 15),
      examDate: addDays(today, 45),
      admitDate: addDays(today, 30),
      adUrl: 'https://upsc.gov.in',
      notes: 'Focus on Indian Polity, History, and Current Affairs. Need to revise essay writing guidelines.',
      userId: 'demo-user',
      isRecurring: false
    },
    {
      id: 'demo-2',
      name: 'Google Cloud Certified Associate Cloud Engineer',
      type: 'Private',
      formStart: addDays(today, -30),
      formEnd: addDays(today, 60),
      examDate: addDays(today, 12),
      admitDate: addDays(today, 5),
      adUrl: 'https://cloud.google.com/learn/certification/associate-cloud-engineer',
      notes: 'Prepare Kubernetes engine, VPC networks, and IAM role hierarchies. Doing practice labs.',
      userId: 'demo-user',
      isRecurring: false
    },
    {
      id: 'demo-3',
      name: 'Staff Selection Commission (SSC) CGL',
      type: 'Government',
      formStart: addDays(today, -5),
      formEnd: addDays(today, 25),
      examDate: addDays(today, 90),
      admitDate: addDays(today, 80),
      adUrl: 'https://ssc.gov.in',
      notes: 'Work on quantitative aptitude speed and English comprehension shortcuts.',
      userId: 'demo-user',
      isRecurring: false
    },
    {
      id: 'demo-4',
      name: 'AWS Certified Solutions Architect - Associate',
      type: 'Private',
      formStart: addDays(today, -10),
      formEnd: addDays(today, 40),
      examDate: addDays(today, 1), // Tomorrow!
      admitDate: addDays(today, -2),
      adUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
      notes: 'Last minute review of VPC Peering vs Transit Gateway, S3 storage tiers, and AWS KMS.',
      userId: 'demo-user',
      isRecurring: false
    }
  ];
};
