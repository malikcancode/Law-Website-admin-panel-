'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Loader2 } from 'lucide-react';
import { api, auth } from '@/lib/api';
import PasswordInput from '@/components/PasswordInput';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.getToken()) router.replace('/');
  }, [router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      auth.save(data.token, data.admin);
      router.replace('/');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="login">
      <form className="login__card" onSubmit={onSubmit}>
        <span className="login__mark" aria-hidden="true">
          <Scale size={26} strokeWidth={1.75} />
        </span>
        <h1>Sign in</h1>
        <p className="muted">Consultation requests dashboard</p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            dir="ltr"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <PasswordInput
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn--primary btn--block" disabled={loading}>
          {loading ? <Loader2 className="spin" size={18} /> : null}
          Sign in
        </button>
      </form>
    </main>
  );
}
