import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, MessageCircle, Pencil, XCircle } from 'lucide-react';
import api from '../api/client';

const SCORE_COLOR = (score) => {
  if (score >= 0.8) return 'text-green-600 bg-green-100';
  if (score >= 0.6) return 'text-amber-600 bg-amber-100';
  return 'text-red-600 bg-red-100';
};

function ScoreBar({ label, value }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-text">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    Promise.all([
      api.get(`/items/${id}`),
      api.get(`/matches/item/${id}`).catch(() => ({ data: [] }))
    ]).then(([itemRes, matchRes]) => {
      setItem(itemRes.data);
      setMatches(matchRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleConfirm = async (matchId) => {
    await api.put(`/matches/${matchId}/confirm`);
    setMatches(m => m.map(x => x.id === matchId ? { ...x, status: 'CONFIRMED' } : x));
  };

  const handleReject = async (matchId) => {
    await api.put(`/matches/${matchId}/reject`);
    setMatches(m => m.filter(x => x.id !== matchId));
  };

  if (loading) return <div className="min-h-screen bg-beige flex items-center justify-center text-muted-text">Loading…</div>;
  if (!item) return <div className="min-h-screen bg-beige flex items-center justify-center text-muted-text">Item not found.</div>;

  const isOwner = user && user.id === item.user_id;

  return (
    <div className="min-h-screen bg-beige font-inter">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link to={item.type === 'LOST' ? '/lost' : '/found'} className="text-muted-text hover:text-ink-black"><ArrowLeft size={20} /></Link>
        <h1 className="font-oswald text-2xl">{item.title}</h1>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${item.type === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {item.type}
        </span>
      </header>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Item card */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
            {item.image_url
              ? <img src={`http://localhost:5000${item.image_url}`} alt={item.title} className="w-full h-full object-cover" />
              : <span className="text-6xl text-gray-200">📦</span>}
          </div>
          <div className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f7f5f1] p-3 text-sm">
              <p>Listed by <Link to={`/users/${item.user_id}`} className="font-semibold text-brand-red hover:underline">{item.user_name || 'Student'}</Link></p>
              {isOwner ? <Link to={`/edit-item/${item.id}`} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold"><Pencil size={13}/> Edit listing</Link> : <Link to={`/messages?user=${item.user_id}&item=${item.id}`} className="inline-flex items-center gap-1 rounded-full bg-brand-red px-3 py-1.5 text-xs font-semibold text-white"><MessageCircle size={13}/> Chat with this user</Link>}
            </div>
            {item.given_to_department && <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">This item has been handed to the campus Lost &amp; Found department.</p>}
            <p className="text-muted-text text-sm mb-4">{item.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-xl"><div className="text-xs text-muted-text mb-1">Category</div><div className="font-medium">{item.category_name || '—'}</div></div>
              <div className="bg-gray-50 p-3 rounded-xl"><div className="text-xs text-muted-text mb-1">Location</div><div className="font-medium">{item.location_name || '—'}</div></div>
              <div className="bg-gray-50 p-3 rounded-xl"><div className="text-xs text-muted-text mb-1">Date</div><div className="font-medium">{item.date_occurred ? new Date(item.date_occurred).toLocaleDateString() : '—'}</div></div>
              <div className="bg-gray-50 p-3 rounded-xl"><div className="text-xs text-muted-text mb-1">Color</div><div className="font-medium capitalize">{item.color || '—'}</div></div>
            </div>
          </div>
        </div>

        {/* Matches panel */}
        <div>
          <h2 className="font-oswald text-xl mb-4">{new URLSearchParams(window.location.search).has('new') ? 'AI found these possible matches' : 'Potential Matches'} ({matches.length})</h2>
          {matches.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-muted-text shadow-sm">
              <div className="text-4xl mb-3">🔍</div>
              <p>No matches found yet.</p>
              {isOwner && (
                <button onClick={() => api.post(`/matches/generate/${id}`).then(() => window.location.reload())}
                  className="mt-4 bg-brand-red text-white px-5 py-2 rounded-full text-sm font-medium">
                  Run AI Matching
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {matches.map(match => {
                const reasons = Array.isArray(match.match_reason) ? match.match_reason :
                  (typeof match.match_reason === 'string' ? JSON.parse(match.match_reason || '[]') : []);
                return (
                  <div key={match.id} className="bg-white rounded-3xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div><h3 className="font-semibold">{match.title}</h3><p className="mt-1 text-xs text-muted-text">{match.type || (item.type === 'LOST' ? 'FOUND' : 'LOST')} report by <Link to={`/users/${match.other_user_id}`} className="font-semibold text-brand-red hover:underline">{match.user_name}</Link></p>{match.given_to_department && <p className="mt-1 text-xs text-emerald-700">At campus Lost &amp; Found</p>}</div>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${SCORE_COLOR(match.similarity_score)}`}>
                        {Math.round((match.similarity_score || 0) * 100)}%
                      </span>
                    </div>

                    {/* Score breakdown */}
                    <div className="mb-4">
                      <ScoreBar label="Semantic Similarity" value={match.semantic_score} />
                      <ScoreBar label="Category" value={match.category_score} />
                      <ScoreBar label="Location" value={match.location_score} />
                      <ScoreBar label="Date" value={match.date_score} />
                      <ScoreBar label="Color" value={match.color_score} />
                    </div>

                    {/* Reasons */}
                    {reasons.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {reasons.map((r, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">{r}</span>
                        ))}
                      </div>
                    )}

                    <div className="mb-3 flex gap-2">
                      <Link to={`/messages?user=${match.other_user_id}&item=${match.other_item_id}`} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-50 py-2 text-sm font-medium text-brand-red"><MessageCircle size={15}/> Chat with {match.user_name}</Link>
                      <Link to={`/item/${match.other_item_id}`} className="inline-flex items-center rounded-xl border px-3 py-2 text-sm">Open report</Link>
                    </div>
                    {isOwner && match.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleConfirm(match.id)}
                          className="flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-700 py-2 rounded-xl text-sm font-medium hover:bg-green-100">
                          <CheckCircle size={15}/> Confirm
                        </button>
                        <button onClick={() => handleReject(match.id)}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-700 py-2 rounded-xl text-sm font-medium hover:bg-red-100">
                          <XCircle size={15}/> Reject
                        </button>
                        {item.type === 'LOST' && <Link to={`/claim/${match.id}`}
                          className="flex-1 flex items-center justify-center bg-ink-black text-white py-2 rounded-xl text-sm font-medium hover:bg-black">
                          Claim
                        </Link>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
