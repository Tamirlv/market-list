import './auth.css';

export default function NoAccess({ email, onSignOut }: { email: string; onSignOut(): void }) {
  return (
    <main className="auth-screen">
      <div className="auth-card">
        <h1>אין לך גישה לרשימה הזו</h1>
        <p dir="ltr">{email}</p>
        <button type="button" className="auth-btn secondary" onClick={onSignOut}>התנתקות</button>
      </div>
    </main>
  );
}
