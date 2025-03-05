import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ForgetPassword from './ForgetPassword';
import '@testing-library/jest-dom';

describe('ForgetPassword Component', () => {
    beforeEach(() => {
        render(
            <MemoryRouter initialEntries={['/reset-password/123/token']}>
                <Routes>
                    <Route path="/reset-password/:id/:token" element={<ForgetPassword />} />
                </Routes>
            </MemoryRouter>
        );
    });

    test('renders the form elements', () => {
        expect(screen.getByRole('heading', { name: /Reset Password/i })).toBeInTheDocument();
        expect(screen.getAllByLabelText(/New Password:/i)[0]).toBeInTheDocument(); // Use the first match
        expect(screen.getAllByLabelText(/Confirm New Password:/i)[0]).toBeInTheDocument(); // Use the first match
        expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
    });

    test('allows user to input password', () => {
        const passwordInput = screen.getAllByLabelText(/New Password:/i)[0]; // Use the first match
        fireEvent.change(passwordInput, { target: { value: 'Password1!' } });
        expect(passwordInput.value).toBe('Password1!');
    });

    test('allows user to input confirm password', () => {
        const confirmPasswordInput = screen.getAllByLabelText(/Confirm New Password:/i)[0]; // Use the first match
        fireEvent.change(confirmPasswordInput, { target: { value: 'Password1!' } });
        expect(confirmPasswordInput.value).toBe('Password1!');
    });
});