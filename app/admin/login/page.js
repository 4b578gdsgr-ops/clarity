'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const from = searchParams.get('from') || '/admin/service';
        router.push(from);
      } else {
        setError('Wrong password.');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoFocus
        style={{
          padding: '10px 14px',
          fontSize: 16,
          border: '1px solid #d1c9bc',
          borderRadius: 8,
          outline: 'none',
          background: '#faf9f6',
        }}
      />
      {error && <p style={{ color: '#b91c1c', fontSize: 14, margin: 0 }}>{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        style={{
          padding: '10px 14px',
          fontSize: 16,
          background: loading || !password ? '#a3b8a8' : '#2d8653',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: loading || !password ? 'default' : 'pointer',
          fontWeight: 600,
        }}
      >
        {loading ? 'Checking…' : 'Enter'}
      </button>
    </form>
  );
}

export default function AdminLogin() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f2ec',
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #e5e0d8',
        borderRadius: 12,
        padding: '36px 40px',
        width: '100%',
        maxWidth: 360,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a3328', marginBottom: 24 }}>
          Admin
        </h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
