import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Add this import
import AddActivity from './AddActivity';
import { MemoryRouter } from 'react-router-dom';


jest.mock('axios');
jest.mock('./MapComponent', () => () => <div>Map</div>);
jest.mock('./CalendlyWidget', () => () => <div>Calendly</div>);

describe('AddActivity', () => {
  beforeEach(() => {
    
    Storage.prototype.getItem = jest.fn(() => 'mock-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form and can navigate steps', () => {
    render(
      <MemoryRouter>
        <AddActivity />
      </MemoryRouter>
    );

  
    
    
    fireEvent.click(screen.getByText('Next'));
    
    
    expect(screen.getByLabelText('Location:')).toBeInTheDocument();
  });

  it('shows errors when required fields are missing', () => {
    render(
      <MemoryRouter>
        <AddActivity />
      </MemoryRouter>
    );

    
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
  });

  it('toggles paid activity checkbox', () => {
    render(
      <MemoryRouter>
        <AddActivity />
      </MemoryRouter>
    );

  
   
  });
});