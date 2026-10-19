import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authenticate = async (credentials = form) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', credentials);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || (err.request ? 'Could not reach the server. Check that the backend and database are running, then try again.' : 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return setError('Email is required.');
    if (!form.password) return setError('Password is required.');
    await authenticate({ ...form, email: form.email.trim().toLowerCase() });
  };

  const quickLogin = (email) => authenticate({ email, password: 'password123' });

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-oswald text-3xl text-ink-black tracking-wider">CAMPUSFIND</Link>
          <p className="text-muted-text mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h2 className="font-oswald text-2xl mb-6">Welcome Back</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-brand-red rounded-xl px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-brand-red transition-colors"
                placeholder="you@campus.edu"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-brand-red transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-brand-red text-white py-3 rounded-full font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-text mt-6">
            No account?{' '}
            <Link to="/register" className="text-brand-red font-medium hover:underline">Register</Link>
          </p>

          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-muted-text text-center mb-3">Demo accounts use password <strong>password123</strong>.</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled={loading} onClick={() => quickLogin('alice@campus.edu')} className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium hover:border-brand-red disabled:opacity-60">Student login</button>
              <button type="button" disabled={loading} onClick={() => quickLogin('admin@campus.edu')} className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium hover:border-brand-red disabled:opacity-60">Admin login</button>
            </div>
            <details className="mt-4 text-xs text-muted-text">
              <summary className="cursor-pointer text-center">All seeded demo logins</summary>
              <p className="mt-2 text-center leading-5">Admin: admin@campus.edu<br />Students: alice@campus.edu, bob@campus.edu, charlie@campus.edu, diana@campus.edu, evan@campus.edu<br />Password for each: password123</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
