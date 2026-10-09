import { useAuth } from '../auth/useAuth';
import SignIn from '../ui/SignIn';
import NoAccess from '../ui/NoAccess';
import Shell from '../ui/Shell';

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
      return <Shell />;
  }
}
