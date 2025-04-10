import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AllJobOffers from './AllJobOffers';
import moment from 'moment';

jest.mock('axios');

// Mock utilisateur connecté
const mockCurrentUser = {
  _id: '12345',
  username: 'testuser',
};

// Mock du localStorage
Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockCurrentUser));

// Fonction pour rendre le composant avec le routeur
const renderWithRouter = (component) => {
  return render(
    <MemoryRouter initialEntries={['/all-job-offers']}>
      <Routes>
        <Route path="/all-job-offers" element={component} />
      </Routes>
    </MemoryRouter>
  );
};

// Date actuelle fixe pour éviter les variations pendant les tests
const fixedDate = moment().subtract(1, 'days').toISOString();
const olderDate = moment().subtract(10, 'days').toISOString();

// Mock des réponses d'API
axios.get.mockResolvedValue({
  data: [
    {
      _id: '1',
      title: 'Frontend Developer',
      description: 'Develop user interfaces',
      location: 'Canada',
      city: 'Montreal',
      jobType: 'Full-Time',
      status: 'open',
      postedBy: { _id: '12345', username: 'testuser' },
      applicants: [{ _id: '56789' }],
      createdAt: olderDate, // Offre plus ancienne (10 jours)
    },
    {
      _id: '2',
      title: 'Backend Developer',
      description: 'Develop backend services',
      location: 'France',
      city: 'Paris',
      jobType: 'Part-Time',
      status: 'open',
      postedBy: { _id: '67890', username: 'otheruser' },
      applicants: [],
      createdAt: fixedDate, // Offre plus récente (1 jour)
    },
  ],
});

axios.delete.mockResolvedValue({ data: { message: 'Job deleted successfully' } });

describe('AllJobOffers Component', () => {
  
  test('shows "Apply" button for jobs not posted by the user', async () => {
    renderWithRouter(<AllJobOffers />);
    await waitFor(() => {
      const applyButton = screen.getByText(/Apply/i);
      expect(applyButton).toBeInTheDocument();
    });
  });

  test('applies date filter correctly for "Past 7 days"', async () => {
    renderWithRouter(<AllJobOffers />);
    await waitFor(() => {
      const dateFilter = screen.getByLabelText(/Past 7 days/i);
      fireEvent.click(dateFilter);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Frontend Developer/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Backend Developer/i)).toBeInTheDocument();
    });
  });

  test('applies date filter for "Past 24 hours" correctly', async () => {
    renderWithRouter(<AllJobOffers />);
    await waitFor(() => {
      const dateFilter = screen.getByLabelText(/Past 24 hours/i);
      fireEvent.click(dateFilter);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Frontend Developer/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Backend Developer/i)).not.toBeInTheDocument();
    });
  });

  test('applies date filter for "Past 30 days" correctly', async () => {
    renderWithRouter(<AllJobOffers />);
    await waitFor(() => {
      const dateFilter = screen.getByLabelText(/Past 30 days/i);
      fireEvent.click(dateFilter);
    });

    await waitFor(() => {
      expect(screen.getByText(/Frontend Developer/i)).toBeInTheDocument();
      expect(screen.getByText(/Backend Developer/i)).toBeInTheDocument();
    });
  });

  test('displays "No job offers found" when filter is too restrictive', async () => {
    renderWithRouter(<AllJobOffers />);
    await waitFor(() => {
      const dateFilter = screen.getByLabelText(/Past 24 hours/i);
      fireEvent.click(dateFilter);
    });

    await waitFor(() => {
      expect(screen.getByText(/No job offers found/i)).toBeInTheDocument();
    });
  });
});
