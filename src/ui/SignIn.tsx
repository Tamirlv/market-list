import './auth.css';

export default function SignIn({ onSignIn, error }: { onSignIn(): void; error?: string | null }) {
  return (
    <main className="auth-screen">
      <div className="auth-card">
        <h1>הרשימה שלנו</h1>
        <p>רשימת קניות משותפת</p>
        {error && <p role="alert" className="auth-error">{error}</p>}
        <button type="button" className="auth-btn" onClick={onSignIn}>התחברות עם Google</button>
      </div>
    </main>
  );
}
