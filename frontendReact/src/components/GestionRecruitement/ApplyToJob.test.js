import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ApplyToJob from './ApplyToJob';

describe('ApplyToJob Component', () => {
  test('renders ApplyToJob component', () => {
    render(
      <MemoryRouter>
        <ApplyToJob />
      </MemoryRouter>
    );
    const titleElement = screen.getByText(/Apply to Job/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders submit button', () => {
    render(
      <MemoryRouter>
        <ApplyToJob />
      </MemoryRouter>
    );
    const submitButton = screen.getByRole('button', { name: /Submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  // Nouveau test simple et sans erreur
  test('contains a textarea for cover letter', () => {
    render(
      <MemoryRouter>
        <ApplyToJob />
      </MemoryRouter>
    );
    const coverLetterTextarea = screen.getByRole('textbox');
    expect(coverLetterTextarea).toBeInTheDocument();
  });
});
