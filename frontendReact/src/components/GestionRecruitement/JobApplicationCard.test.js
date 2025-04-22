import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JobApplicationCard from './JobApplicationCard';

// Mock de la fonction fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      { _id: '1', applicantId: 'John Doe', coverLetter: 'I am very interested in this position.', status: 'pending' },
      { _id: '2', applicantId: 'Jane Smith', coverLetter: 'Looking forward to contributing.', status: 'accepted' }
    ]),
  })
);

describe('JobApplicationCard Component', () => {
  test('renders JobApplicationCard without crashing', async () => {
    render(
      <MemoryRouter>
        <JobApplicationCard />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      const titleElement = screen.getByText(/Liste des Candidatures/i);
      expect(titleElement).toBeTruthy();
    });
  });

  test('displays the job applications', async () => {
    render(
      <MemoryRouter>
        <JobApplicationCard />
      </MemoryRouter>
    );

    await waitFor(() => {
      const applicant1 = screen.getByText(/John Doe/i);
      const applicant2 = screen.getByText(/Jane Smith/i);
      expect(applicant1).toBeTruthy();
      expect(applicant2).toBeTruthy();
    });
  });
});
