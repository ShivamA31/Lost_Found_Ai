import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/client';

export default function ClaimPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ claim_details: '', verification_answer: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [info, setInfo] = useState(null);
  useEffect(() => { api.get(`/claims/${matchId}/info`).then(r=>setInfo(r.data)).catch(err=>setError(err.response?.data?.error || 'Could not load this claim.')); }, [matchId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/claims', { match_id: matchId, ...form });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit claim.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen bg-beige flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-10 text-center shadow-sm max-w-md w-full">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-oswald text-2xl mb-2">Claim Submitted!</h2>
        <p className="text-muted-text mb-6">An admin will review your claim and verification answer shortly.</p>
        <Link to="/my-reports" className="bg-ink-black text-white px-6 py-3 rounded-full font-medium">View My Reports</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-beige font-inter">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted-text hover:text-ink-black"><ArrowLeft size={20} /></button>
        <h1 className="font-oswald text-2xl">Submit Claim</h1>
      </header>

      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <p className="text-muted-text mb-6 text-sm">
            {info ? `Claiming “${info.found_title}” for your lost report “${info.lost_title}”.` : 'Loading claim details…'} Your answer will be reviewed by an admin.
          </p>

          {error && <div className="bg-red-50 border border-red-200 text-brand-red rounded-xl px-4 py-3 mb-5 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {info?.requires_verification && <div>
              <label className="block text-sm font-semibold mb-2">Why is this item yours?</label>
              <textarea
                required
                rows={4}
                value={form.claim_details}
                onChange={e => setForm({ ...form, claim_details: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-brand-red text-sm resize-none"
                placeholder="Describe the item in detail — brand, contents, unique marks, when you lost it…"
              />
            </div>}
            <div>
              <label className="block text-sm font-semibold mb-2 text-brand-red">Verification Answer (from finder's hint)</label>
              <input
                type="text"
                required
                value={form.verification_answer}
                onChange={e => setForm({ ...form, verification_answer: e.target.value })}
                className="w-full border border-red-200 rounded-xl px-4 py-3 outline-none focus:border-brand-red text-sm"
                placeholder="Answer the finder's private question…"
              />
            </div>
            <button type="submit" disabled={loading}
              className="bg-brand-red text-white py-3 rounded-full font-medium hover:bg-red-600 disabled:opacity-60 transition-colors">
              {loading ? 'Submitting…' : 'Submit Claim'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
