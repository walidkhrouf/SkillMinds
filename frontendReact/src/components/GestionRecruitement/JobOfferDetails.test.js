import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JobOfferDetails from './JobOfferDetails';

jest.mock('axios');

// Mock des données
const mockJobOffer = {
  title: 'Frontend Developer',
  description: 'Develop user interfaces',
  location: 'Canada',
  city: 'Montreal',
  experienceLevel: 'Junior',
  jobType: 'Full-Time',
  salaryRange: '50K-60K',
  requiredSkills: ['JavaScript', 'React'],
  postedBy: { _id: '12345', username: 'testuser' },
  status: 'open',
};

// Mock de l'API axios
axios.get.mockImplementation((url) => {
  if (url.includes('/api/recruitment/job-offers/')) {
    return Promise.resolve({ data: { jobOffer: mockJobOffer } });
  }
  if (url.includes('/api/admin/skills')) {
    return Promise.resolve({
      data: [
        { _id: 'JavaScript', name: 'JavaScript' },
        { _id: 'React', name: 'React' },
      ],
    });
  }
  return Promise.reject(new Error('Not found'));
});

// Fonction pour rendre le composant avec le routeur
const renderWithRouter = (component) => {
  return render(
    <MemoryRouter initialEntries={['/job-details/1']}>
      <Routes>
        <Route path="/job-details/:jobId" element={component} />
      </Routes>
    </MemoryRouter>
  );
};

describe('JobOfferDetails Component', () => {
  test('renders job details correctly', async () => {
    renderWithRouter(<JobOfferDetails />);

    await waitFor(() => {
      expect(screen.getByText(/Frontend Developer/i)).toBeInTheDocument();
      expect(screen.getByText(/Develop user interfaces/i)).toBeInTheDocument();
      expect(screen.getByText(/Canada/i)).toBeInTheDocument();
      expect(screen.getByText(/Montreal/i)).toBeInTheDocument();
      expect(screen.getByText(/Junior/i)).toBeInTheDocument();
      expect(screen.getByText(/Full-Time/i)).toBeInTheDocument();
      expect(screen.getByText(/50K-60K/i)).toBeInTheDocument();
      expect(screen.getByText(/JavaScript, React/i)).toBeInTheDocument();
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
      expect(screen.getByText(/open/i)).toBeInTheDocument();
    });
  });

  test('renders back to job offers button', async () => {
    renderWithRouter(<JobOfferDetails />);

    await waitFor(() => {
      const backButton = screen.getByText(/Back to Job Offers/i);
      expect(backButton).toBeInTheDocument();
    });
  });
});
