import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateJobOffer from './CreateJobOffer';

describe('CreateJobOffer Component', () => {
  test('renders CreateJobOffer component without crashing', () => {
    render(
      <MemoryRouter>
        <CreateJobOffer />
      </MemoryRouter>
    );
    const titleElement = screen.getByText(/Create Job Offer/i);
    expect(titleElement).toBeTruthy();
  });
});
