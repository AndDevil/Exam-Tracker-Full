import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ExamCard from '../components/ExamCard';
import { Exam } from '../types';

const mockExam: Exam = {
  id: 'test-exam-123',
  name: 'AWS Solutions Architect',
  type: 'Private',
  examDate: '2026-07-15',
  formEnd: '2026-06-30',
  userId: 'user-123'
};

describe('ExamCard Component', () => {
  test('renders exam basic info and metadata', () => {
    render(
      <MemoryRouter>
        <ExamCard exam={mockExam} onDelete={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('AWS Solutions Architect')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  test('fires delete callback', () => {
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <ExamCard exam={mockExam} onDelete={onDelete} />
      </MemoryRouter>
    );

    const deleteButton = screen.getByTitle('Delete Exam');
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith('test-exam-123');
  });
});
