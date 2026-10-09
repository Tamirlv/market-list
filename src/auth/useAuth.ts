import { useCallback, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth } from '../data/firebase';
import { isAllowed } from '../config/allowlist';

export type AuthStatus = 'loading' | 'signedOut' | 'denied' | 'ready';
export interface AuthUser { uid: string; email: string; firstName: string }
export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  signIn(): void;
  signOut(): void;
}

const SIGN_IN_FAILED = 'ההתחברות נכשלה, נסו שוב';

function toAuthUser(u: User): AuthUser {
  const email = u.email ?? '';
  return { uid: u.uid, email, firstName: u.displayName?.split(' ')[0] ?? email };
}

export function useAuth(): AuthState {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth).catch(() => setError(SIGN_IN_FAILED));
    return onAuthStateChanged(auth, (u) => {
      setFbUser(u);
      setResolved(true);
    });
  }, []);

  const signIn = useCallback(() => {
    setError(null);
    signInWithRedirect(auth, new GoogleAuthProvider()).catch(() => setError(SIGN_IN_FAILED));
  }, []);
  const signOut = useCallback(() => {
    void fbSignOut(auth);
  }, []);

  if (!resolved) return { status: 'loading', user: null, error, signIn, signOut };
  if (!fbUser) return { status: 'signedOut', user: null, error, signIn, signOut };
  const user = toAuthUser(fbUser);
  return { status: isAllowed(user.email) ? 'ready' : 'denied', user, error, signIn, signOut };
}
