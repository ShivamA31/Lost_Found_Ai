import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import api from '../api/client';

const STATUS_COLORS = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  MATCHED: 'bg-amber-100 text-amber-700',
  CLAIMED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

export default function MyReports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('LOST');

  useEffect(() => {
    api.get('/items/mine')
      .then(res => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i => i.type === tab);

  return (
    <div className="min-h-screen bg-beige font-inter">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-muted-text hover:text-ink-black"><ArrowLeft size={20} /></Link>
        <h1 className="font-oswald text-2xl">My Reports</h1>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Tab switcher */}
        <div className="flex gap-2 bg-white rounded-2xl p-1 inline-flex mb-6 shadow-sm">
          {['LOST', 'FOUND'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-ink-black text-white' : 'text-muted-text hover:text-ink-black'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-text">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-muted-text mb-4">You haven't reported any {tab.toLowerCase()} items yet.</p>
            <Link to={tab === 'LOST' ? '/report-lost' : '/report-found'}
              className="bg-brand-red text-white px-6 py-2 rounded-full text-sm font-medium">
              Report Now
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm flex gap-4 items-start">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.image_url
                    ? <img src={`http://localhost:5000${item.image_url}`} alt="" className="w-full h-full object-cover" />
                    : <span className="text-3xl text-gray-300">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base">{item.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-text mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-text">
                    <span>📍 {item.location_name || '—'}</span>
                    <span>📅 {item.date_occurred ? new Date(item.date_occurred).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link to={`/item/${item.id}`}
                    className="bg-gray-100 text-ink-black px-4 py-1.5 rounded-full text-xs font-medium hover:bg-gray-200">
                    View Matches
                  </Link>
                  <Link to={`/edit-item/${item.id}`}
                    className="bg-red-50 text-brand-red px-4 py-1.5 rounded-full text-xs font-medium hover:bg-red-100">
                    Edit listing
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
