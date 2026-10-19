import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart2, Users, Package, CheckCircle, Clock } from 'lucide-react';
import api from '../api/client';

function StatCard({ label, value, icon: Icon, color = 'text-brand-red' }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className={`${color} mb-2`}><Icon size={20} /></div>
      <div className="font-oswald text-3xl">{value ?? '—'}</div>
      <div className="text-xs text-muted-text mt-1">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/claims')
    ]).then(([s, c]) => {
      setStats(s.data);
      setClaims(c.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateClaim = async (id, status, admin_note = '') => {
    await api.put(`/claims/${id}`, { status, admin_note });
    setClaims(c => c.map(x => x.id === id ? { ...x, status } : x));
  };

  if (user?.role !== 'ADMIN') return (
    <div className="min-h-screen bg-beige flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3">🔒</div><p className="text-muted-text">Admin access only.</p><Link to="/" className="text-brand-red hover:underline">Go home</Link></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-beige font-inter">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-muted-text hover:text-ink-black"><ArrowLeft size={20} /></Link>
        <h1 className="font-oswald text-2xl">Admin Dashboard</h1>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tab bar */}
        <div className="flex gap-2 bg-white rounded-2xl p-1 inline-flex mb-6 shadow-sm">
          {['overview', 'claims'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-ink-black text-white' : 'text-muted-text hover:text-ink-black'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-20 text-muted-text">Loading…</div> : tab === 'overview' ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard label="Total Items" value={stats?.total} icon={Package} />
              <StatCard label="Lost" value={stats?.lost} icon={Package} color="text-red-500" />
              <StatCard label="Found" value={stats?.found} icon={Package} color="text-green-500" />
              <StatCard label="Potential Matches" value={stats?.potential_matches} icon={BarChart2} color="text-amber-500" />
              <StatCard label="Pending Claims" value={stats?.pending_claims} icon={Clock} color="text-orange-500" />
              <StatCard label="Resolved" value={stats?.resolved} icon={CheckCircle} color="text-green-600" />
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-oswald text-lg mb-4">Recent Activity (Last 7 Days)</h3>
              {stats?.chart_data?.length === 0 ? (
                <p className="text-muted-text text-sm">No activity yet.</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {stats?.chart_data?.map(d => (
                    <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
                      <div className="bg-brand-red rounded-t-sm w-full" style={{ height: `${Math.min(100, (d.count / 10) * 100)}%` }} />
                      <span className="text-xs text-muted-text">{new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <h2 className="font-oswald text-xl">Claims Review ({claims.length})</h2>
            {claims.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center text-muted-text shadow-sm">No claims yet.</div>
            ) : claims.map(claim => (
              <div key={claim.id} className="bg-white rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-semibold">{claim.claimant_name}</span>
                    <span className="text-xs text-muted-text ml-2">claims match #{claim.match_id}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    claim.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    claim.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>{claim.status}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-muted-text mb-1">Lost Item</div>
                    <div className="font-medium">{claim.lost_title}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-muted-text mb-1">Found Item</div>
                    <div className="font-medium">{claim.found_title}</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="text-xs text-blue-600 mb-1 font-medium">Claimant's Description</div>
                    <div>{claim.claim_details}</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <div className="text-xs text-amber-600 mb-1 font-medium">Verification Hint Answer</div>
                    <div>{claim.verification_answer}</div>
                    <div className="text-xs text-muted-text mt-1 border-t pt-1">Hint: {claim.verification_hint}</div>
                  </div>
                </div>
                {claim.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateClaim(claim.id, 'APPROVED')}
                      className="flex-1 bg-green-50 text-green-700 py-2 rounded-xl text-sm font-medium hover:bg-green-100">
                      ✓ Approve
                    </button>
                    <button onClick={() => updateClaim(claim.id, 'REJECTED')}
                      className="flex-1 bg-red-50 text-red-700 py-2 rounded-xl text-sm font-medium hover:bg-red-100">
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
