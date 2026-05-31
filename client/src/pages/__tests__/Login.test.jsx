import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mocks: izolujemy test od routera i Supabase (brak realnego API)
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  signInWithPassword: vi.fn(),
  profilesSingle: vi.fn(),
}));

// Mock nawigacji: zamiast prawdziwego przejścia po trasach,
// zapisujemy argumenty wywołania navigate(...)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

// Mock Supabase:
// - auth.signInWithPassword(...) udaje logowanie
// - from('profiles')...single() udaje odczyt profilu (czy admin)
vi.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
    },
    from: (table) => {
      if (table !== 'profiles') throw new Error(`Unexpected table: ${table}`);
      return {
        select: () => ({
          eq: () => ({
            single: mocks.profilesSingle,
          }),
        }),
      };
    },
  },
}));

import Login from '../Login.jsx';

describe('Login', () => {
  it('loguje i przekierowuje na /dashboard', async () => {
    const user = userEvent.setup();

    // Opóźniamy odpowiedź "logowania", żeby móc sprawdzić stan loading w UI.
    let resolveLogin;
    mocks.signInWithPassword.mockImplementation(
      () => new Promise((res) => (resolveLogin = res)),
    );
    // Zakładamy profil użytkownika jako "nie-admin" -> ścieżka /dashboard.
    mocks.profilesSingle.mockResolvedValue({ data: { is_admin: false } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    // Wpisujemy dane do pól (komponent nie ma powiązania label->input przez htmlFor/id,
    // więc wybieramy elementy po typie inputa).
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    await user.type(emailInput, 'owner@test.local');
    await user.type(passwordInput, 'secret');

    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    // Po submit przycisk przechodzi w stan ładowania i jest zablokowany.
    expect(await screen.findByRole('button', { name: 'Logowanie...' })).toBeDisabled();

    // Kończymy "logowanie" sukcesem (mockowana odpowiedź z Supabase).
    resolveLogin({ data: { user: { id: 'u1' } }, error: null });

    // Po sukcesie logowania aplikacja wywołuje nawigację do /dashboard.
    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalled();
      expect(mocks.navigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});