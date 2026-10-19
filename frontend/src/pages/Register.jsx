import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    if (!name) return setError('Full name is required.');
    if (!/^[\p{L}][\p{L}\p{M} .'-]*$/u.test(name)) return setError('Enter a valid name using letters, spaces, apostrophes, periods, or hyphens.');
    if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(email)) return setError('Enter a valid email address, for example name@campus.edu.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (new TextEncoder().encode(form.password).length > 72) return setError('Password must be no more than 72 bytes.');
    if (phone && !/^\+?[0-9() .-]{7,20}$/.test(phone)) return setError('Enter a valid phone number, or leave the field blank.');
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password: form.password, phone });
      // Auto-login after register
      const res = await api.post('/auth/login', { email, password: form.password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || (err.request ? 'Could not reach the server. Check that the backend and database are running, then try again.' : 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-oswald text-3xl text-ink-black tracking-wider">CAMPUSFIND</Link>
          <p className="text-muted-text mt-2">Create your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h2 className="font-oswald text-2xl mb-6">Get Started</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-brand-red rounded-xl px-4 py-3 mb-5 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Full Name</label>
              <input type="text" autoComplete="name" maxLength={255} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-brand-red" placeholder="Alice Smith" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input type="email" autoComplete="email" maxLength={254} required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-brand-red" placeholder="you@campus.edu" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Phone (optional)</label>
              <input type="tel" autoComplete="tel" maxLength={50} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-brand-red" placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Password</label>
              <input type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-brand-red" placeholder="Min 8 characters" />
            </div>
            <button type="submit" disabled={loading}
              className="mt-2 bg-brand-red text-white py-3 rounded-full font-medium hover:bg-red-600 disabled:opacity-60 transition-colors">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-text mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-brand-red font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
