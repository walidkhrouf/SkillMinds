import React from 'react';
import { render, screen } from '@testing-library/react';
import ActivityDetails from './ActivityDetails';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock axios to prevent real API calls
jest.mock('axios');

describe('ActivityDetails Component', () => {
  it('renders loading initially', () => {
    render(
      <MemoryRouter initialEntries={['/activity/123']}>
        <Routes>
          <Route path="/activity/:id" element={<ActivityDetails />} />
        </Routes>
      </MemoryRouter>
    );

   
  });
});
