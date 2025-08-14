'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
type Health = { ok: boolean; t: number } | null;

export default function Page() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [health, setHealth] = useState<Health>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);

  // 1) Inicjalizacja motywu (domyślnie ciemny)
  useEffect(() => {
    try {
      const saved = (localStorage.getItem('acd_theme') as Theme | null) ?? 'dark';
      setTheme(saved);
    } catch {/* ignore */}
  }, []);

  // 2) Synchronizacja motywu z <html> i localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('acd_theme', theme); } catch {/* ignore */}
  }, [theme]);

  // 3) Opcjonalny test serwera (jeśli dodasz app/api/health/route.ts)
  useEffect(() => {
    fetch('/api/health')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setHealth)
      .catch(() => setHealthErr('Endpoint /api/health niedostępny (to tylko test — można pominąć).'));
  }, []);

  const colors = theme === 'dark'
    ? { bg: '#111827', text: '#e5e7eb', border: '#374151', panel: '#1f2937', accent: '#f97316' }
    : { bg: '#f8fafc', text: '#111827', border: '#e5e7eb', panel: '#ffffff', accent: '#f97316' };

  return (
    <main style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 32 }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>
            Aplikacja firmowa{' '}
            <span style={{
              marginLeft: 8, padding: '2px 8px', borderRadius: 8,
              background: 'rgba(249, 115, 22, 0.15)', color: colors.accent, fontSize: 12, fontWeight: 700
            }}>MVP</span>
          </h1>
          <button
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
            className="toggle"
            aria-label="Przełącz motyw"
          >
            {theme === 'dark' ? '☀️ Jasny' : '🌙 Ciemny'}
          </button>
        </header>

        <section style={{
          border: `1px solid ${colors.border}`, background: colors.panel, borderRadius: 16, padding: 16
        }}>
          <h2 style={{ marginTop: 0 }}>Dashboard (podgląd)</h2>
          <p style={{ marginTop: 0 }}>
            Ten widok służy tylko do testu uruchomienia. Jeśli widzisz go pod <b>IP:PORT</b>, to pipeline i kontener działają.
          </p>
          <ul style={{ lineHeight: 1.9, paddingLeft: 18 }}>
            <li>Motyw: <b>{theme}</b> (zapis: <code>localStorage.acd_theme</code>)</li>
            <li>Adres: <code>{typeof window !== 'undefined' ? window.location.origin : ''}</code></li>
            {health && (
              <li>Health: <b>{String(health.ok)}</b>, czas: {new Date(health.t).toLocaleString()}</li>
            )}
            {healthErr && <li style={{ color: '#fca5a5' }}>Uwaga: {healthErr}</li>}
          </ul>
        </section>
      </div>

      <style jsx>{`
        .toggle {
          border: 1px solid ${colors.border};
          background: ${colors.panel};
          color: ${colors.text};
          border-radius: 12px;
          padding: 8px 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .toggle:hover { opacity: .9; }
      `}</style>
    </main>
  );
}
