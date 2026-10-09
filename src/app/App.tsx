import { useAuth } from '../auth/useAuth';
import SignIn from '../ui/SignIn';
import NoAccess from '../ui/NoAccess';
import Shell from '../ui/Shell';
import { useShoppingData } from './useShoppingData';
import type { AuthUser } from '../auth/useAuth';

function ReadyShell({ user }: { user: AuthUser }) {
  const { items, catalog, actions, error, clearError } = useShoppingData(user);
  return <Shell user={user} items={items} catalog={catalog} actions={actions} error={error} onDismissError={clearError} />;
}

export default function App() {
  const { status, user, error, signIn, signOut } = useAuth();
  switch (status) {
    case 'loading':
      return (
        <main className="auth-screen">
          <div role="status" aria-label="טוען" className="spinner" />
        </main>
      );
    case 'signedOut':
      return <SignIn onSignIn={signIn} error={error} />;
    case 'denied':
      return <NoAccess email={user?.email ?? ''} onSignOut={signOut} />;
    case 'ready':
      return user ? <ReadyShell user={user} /> : null;
  }
}
