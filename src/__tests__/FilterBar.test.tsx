import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '../components/FilterBar';

describe('FilterBar Component', () => {
  test('renders with initial values and triggers search change', () => {
    const setSearch = vi.fn();
    const setTypeFilter = vi.fn();
    const setSortBy = vi.fn();

    render(
      <FilterBar
        search="UPSC"
        setSearch={setSearch}
        typeFilter="All"
        setTypeFilter={setTypeFilter}
        sortBy="examDate-asc"
        setSortBy={setSortBy}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search exams by name/i) as HTMLInputElement;
    expect(searchInput.value).toBe('UPSC');

    fireEvent.change(searchInput, { target: { value: 'AWS' } });
    expect(setSearch).toHaveBeenCalledWith('AWS');
  });

  test('triggers sector filter buttons', () => {
    const setSearch = vi.fn();
    const setTypeFilter = vi.fn();
    const setSortBy = vi.fn();

    render(
      <FilterBar
        search=""
        setSearch={setSearch}
        typeFilter="All"
        setTypeFilter={setTypeFilter}
        sortBy="examDate-asc"
        setSortBy={setSortBy}
      />
    );

    const govtButton = screen.getByText('Government');
    fireEvent.click(govtButton);
    expect(setTypeFilter).toHaveBeenCalledWith('Government');
  });
});
