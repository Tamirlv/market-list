import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../src/app/App';
import { useAuth } from '../../src/auth/useAuth';

vi.mock('../../src/auth/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../src/app/useShoppingData', () => ({
  useShoppingData: () => ({ items: [], catalog: [], actions: {}, error: null, clearError: vi.fn() }),
}));

const signIn = vi.fn();
const signOut = vi.fn();
const base = { user: null, error: null, signIn, signOut };

describe('App auth gate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a spinner while loading', () => {
    vi.mocked(useAuth).mockReturnValue({ ...base, status: 'loading' });
    render(<App />);
    expect(screen.getByRole('status', { name: 'טוען' })).toBeInTheDocument();
  });

  it('signedOut shows the Google button and calls signIn', async () => {
    vi.mocked(useAuth).mockReturnValue({ ...base, status: 'signedOut' });
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'התחברות עם Google' }));
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('signedOut shows the error message when sign-in failed', () => {
    vi.mocked(useAuth).mockReturnValue({ ...base, status: 'signedOut', error: 'ההתחברות נכשלה, נסו שוב' });
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('ההתחברות נכשלה, נסו שוב');
  });

  it('denied shows no-access, the email, and no list content; sign out works', async () => {
    vi.mocked(useAuth).mockReturnValue({
      ...base,
      status: 'denied',
      user: { uid: 'u', email: 'x@y.com', firstName: 'x' },
    });
    render(<App />);
    expect(screen.getByText('אין לך גישה לרשימה הזו')).toBeInTheDocument();
    expect(screen.getByText('x@y.com')).toBeInTheDocument();
    expect(screen.queryByText('הרשימה שלנו')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'התנתקות' }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('ready renders the shell stub', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...base,
      status: 'ready',
      user: { uid: 'u', email: 'tamirlevi22@gmail.com', firstName: 'Tamir' },
    });
    render(<App />);
    expect(screen.getByText('הרשימה שלנו')).toBeInTheDocument();
  });
});
