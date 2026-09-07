import type { FormEvent } from "react";

export function SetupScreen() {
  return <main className="center-screen"><section className="auth-card"><span className="auth-icon">⚙️</span><p className="eyebrow">Ett steg kvar</p><h1>Koppla Supabase</h1><p>Lägg Project URL och Publishable key i filen <code>.env.local</code> och starta sedan om appen.</p></section></main>;
}

export function LoginScreen({ email, setEmail, message, busy, onSubmit }: { email: string; setEmail: (value: string) => void; message: string; busy: boolean; onSubmit: (event: FormEvent) => void }) {
  return <main className="center-screen"><section className="auth-card"><span className="auth-icon">🌿</span><p className="eyebrow">Välkommen till</p><h1>Emels Tasks</h1><p>Logga in med din e-post. Du får en säker engångslänk och behöver inget lösenord.</p><form onSubmit={onSubmit}><label htmlFor="email">E-postadress</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="emelie@example.com" /><button className="primary-action" disabled={busy}>{busy ? "Skickar…" : "Skicka inloggningslänk"}</button></form>{message && <p className="alert" role="status">{message}</p>}</section></main>;
}
