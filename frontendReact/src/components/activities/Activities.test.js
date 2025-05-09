import React from 'react';
import { render } from '@testing-library/react';
import Activities from './Activities';
import { BrowserRouter } from 'react-router-dom';

test('renders Activities component without crashing', () => {
  render(
    <BrowserRouter>
      <Activities />
    </BrowserRouter>
  );
});
