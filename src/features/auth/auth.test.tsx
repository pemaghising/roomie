import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { renderWithState } from '../../test-utils';
import ContactEntry from './ContactEntry';
import VerifyCode from './VerifyCode';
import Welcome from './Welcome';
import { loadPending, savePending } from './pending';

const auth = vi.hoisted(() => ({
  signInWithOtp: vi.fn(async () => ({ error: null })),
  verifyOtp: vi.fn(async () => ({ error: null })),
  signInWithOAuth: vi.fn(async () => ({ error: null })),
}));
vi.mock('../../lib/supabase', () => ({ supabase: { auth } }));

beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });

test('welcome offers Google and email, and phone only when enabled', () => {
  renderWithState(<Welcome />, { route: '/welcome' });
  expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /continue with email/i })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /continue with phone/i })).toBeNull();
});

test('email entry validates, sends a code and remembers the address', async () => {
  renderWithState(<ContactEntry />, { route: '/signin/email', path: '/signin/:method' });
  const input = screen.getByLabelText(/email/i);
  await userEvent.type(input, 'not-an-email');
  await userEvent.click(screen.getByRole('button', { name: /send code/i }));
  expect(screen.getByText(/check that email/i)).toBeInTheDocument();
  expect(auth.signInWithOtp).not.toHaveBeenCalled();

  await userEvent.clear(input);
  await userEvent.type(input, 'rahul@example.com');
  await userEvent.click(screen.getByRole('button', { name: /send code/i }));
  await waitFor(() => expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'rahul@example.com', options: { shouldCreateUser: true } }));
  expect(loadPending()).toEqual({ method: 'email', contact: 'rahul@example.com' });
  expect(await screen.findByText('navigated')).toBeInTheDocument();
});

test('phone entry builds an E.164 Nepal number', async () => {
  renderWithState(<ContactEntry />, { route: '/signin/phone', path: '/signin/:method' });
  await userEvent.type(screen.getByLabelText(/phone/i), '98 0123 4567');
  await userEvent.click(screen.getByRole('button', { name: /send code/i }));
  await waitFor(() => expect(auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+9779801234567' }));
});

test('entering the 6-digit code verifies it', async () => {
  savePending({ method: 'email', contact: 'rahul@example.com' });
  renderWithState(<VerifyCode />, { route: '/verify' });
  await userEvent.type(screen.getByLabelText(/6-digit code/i), '123456');
  await waitFor(() => expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'rahul@example.com', token: '123456', type: 'email' }));
});

test('a wrong code says so and clears the boxes', async () => {
  auth.verifyOtp.mockResolvedValueOnce({ error: { message: 'Token has expired or is invalid' } } as never);
  savePending({ method: 'phone', contact: '+9779801234567' });
  renderWithState(<VerifyCode />, { route: '/verify' });
  await userEvent.type(screen.getByLabelText(/6-digit code/i), '999999');
  expect(await screen.findByText(/that code didn't work/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/6-digit code/i)).toHaveValue('');
});
