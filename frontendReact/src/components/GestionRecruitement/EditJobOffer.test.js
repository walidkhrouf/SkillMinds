import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom'; // Import des matchers jest-dom
import EditJobOffer from './EditJobOffer';

test('renders EditJobOffer component', () => {
  render(
    <MemoryRouter>
      <EditJobOffer />
    </MemoryRouter>
  );
  const titleElement = screen.getByText(/Edit Job Offer/i);
  expect(titleElement).toBeInTheDocument();

  // Petit ajout sans impact
  const dummyVariable = 42;
  expect(dummyVariable).toBe(42);
});
