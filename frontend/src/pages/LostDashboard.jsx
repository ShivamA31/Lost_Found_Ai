import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Heart, Home, Clock, CheckCircle2, Filter, X } from 'lucide-react';
import api from '../api/client';

// Status badge colors
const STATUS_COLORS = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  MATCHED: 'bg-amber-100 text-amber-700',
  CLAIMED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function ItemCard({ item, selected, onClick }) {
  return (
    <div
      onClick={() => onClick(item)}
      className={`bg-white rounded-3xl p-5 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md
        ${selected ? 'border-brand-red' : 'border-transparent'}`}
    >
      {/* Image placeholder or real image */}
      <div className="aspect-[4/3] bg-gray-100 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
        {item.image_url
          ? <img src={`http://localhost:5000${item.image_url}`} alt={item.title} className="w-full h-full object-cover" />
          : <span className="text-4xl text-gray-300">📦</span>
        }
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{item.title}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-text mt-1">
            <MapPin size={12} /> {item.location_name || 'Unknown location'}
          </div>
        </div>
        <button onClick={e => e.stopPropagation()} className="text-gray-200 hover:text-brand-red ml-2 flex-shrink-0">
          <Heart size={18} />
        </button>
      </div>
      {item.user_name && <p className="mt-2 text-xs text-muted-text">Listed by <Link onClick={e=>e.stopPropagation()} to={`/users/${item.user_id}`} className="font-semibold text-brand-red hover:underline">{item.user_name}</Link></p>}
      {item.given_to_department && <p className="mt-2 text-xs font-medium text-emerald-700">At campus Lost &amp; Found</p>}

      <div className="flex justify-between items-center mt-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] || STATUS_COLORS.ACTIVE}`}>
          {item.status}
        </span>
        <span className="text-xs text-muted-text">
          {item.date_occurred ? new Date(item.date_occurred).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
        </span>
      </div>
    </div>
  );
}

function DetailPanel({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="w-80 flex-shrink-0 bg-white rounded-3xl p-6 shadow-sm overflow-y-auto flex flex-col gap-4 animate-fade-in relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-ink-black">
        <X size={18} />
      </button>

      <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center mt-4">
        {item.image_url
          ? <img src={`http://localhost:5000${item.image_url}`} alt={item.title} className="w-full h-full object-cover" />
          : <span className="text-5xl text-gray-300">📦</span>
        }
      </div>

      <div>
        <h2 className="font-oswald text-xl">{item.title}</h2>
        {item.user_name && <p className="mt-1 text-sm text-muted-text">Listed by <Link to={`/users/${item.user_id}`} className="font-semibold text-brand-red hover:underline">{item.user_name}</Link></p>}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] || STATUS_COLORS.ACTIVE}`}>
          {item.status}
        </span>
      </div>

      {item.description && (
        <p className="text-sm text-muted-text bg-gray-50 rounded-xl p-3">{item.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 p-3 rounded-xl">
          <div className="text-muted-text text-xs mb-1">Category</div>
          <div className="font-medium">{item.category_name || '—'}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl">
          <div className="text-muted-text text-xs mb-1">Location</div>
          <div className="font-medium">{item.location_name || '—'}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl">
          <div className="text-muted-text text-xs mb-1">Date</div>
          <div className="font-medium">{item.date_occurred ? new Date(item.date_occurred).toLocaleDateString() : '—'}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl">
          <div className="text-muted-text text-xs mb-1">Color</div>
          <div className="font-medium capitalize">{item.color || '—'}</div>
        </div>
      </div>

      <Link
        to={`/item/${item.id}`}
        className="mt-auto bg-ink-black text-white py-3 rounded-full font-medium text-center hover:bg-black transition-colors"
      >
        View Details & Matches
      </Link>
      <Link to={`/messages?user=${item.user_id}&item=${item.id}`} className="inline-flex items-center justify-center rounded-full border border-gray-200 py-3 text-sm font-medium">Chat with this student</Link>
    </div>
  );
}

export default function Dashboard({ type = 'LOST' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ category: '', location: '' });
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/meta/locations').then(response => setLocations(response.data || [])).catch(() => setLocations([]));
    api.get('/meta/categories').then(response => setCategories(response.data || [])).catch(() => setCategories([]));
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type, limit: 50 });
      if (filters.category) params.set('category', filters.category);
      if (filters.location) params.set('location', filters.location);
      const res = await api.get(`/items?${params}`);
      setItems(res.data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type, filters]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  return (
    <div className="min-h-screen bg-beige font-inter flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="font-oswald text-xl text-ink-black tracking-wide">CAMPUSFIND</Link>
        <nav className="hidden md:flex gap-2">
          <Link to="/lost" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${type === 'LOST' ? 'bg-ink-black text-white' : 'hover:bg-gray-100'}`}>
            Lost Items
          </Link>
          <Link to="/found" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${type === 'FOUND' ? 'bg-ink-black text-white' : 'hover:bg-gray-100'}`}>
            Found Items
          </Link>
          <Link to="/my-reports" className="px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100">My Reports</Link>
        </nav>
        <Link
          to={type === 'LOST' ? '/report-lost' : '/report-found'}
          className="bg-brand-red text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-red-600"
        >
          + Report {type === 'LOST' ? 'Lost' : 'Found'}
        </Link>
      </header>

      <div className="flex flex-1 gap-4 p-4 overflow-hidden h-[calc(100vh-64px)]">
        {/* Left filter sidebar */}
        <aside className="w-56 flex-shrink-0 bg-white rounded-3xl p-5 shadow-sm overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-sm flex items-center gap-2"><Filter size={14}/> Filter by</span>
            <button onClick={() => setFilters({ category: '', location: '' })} className="text-xs text-brand-red hover:underline">Reset</button>
          </div>

          <div className="mb-5">
            <h4 className="text-xs text-muted-text uppercase tracking-wide mb-2">Category</h4>
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:text-brand-red">
                <input type="radio" name="cat" value={cat.id} checked={filters.category === String(cat.id)}
                  onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="accent-brand-red" />
                {cat.name}
              </label>
            ))}
          </div>

          <div>
            <h4 className="text-xs text-muted-text uppercase tracking-wide mb-2">Location</h4>
            {locations.map(loc => (
              <label key={loc.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:text-brand-red">
                <input type="radio" name="loc" value={loc.id} checked={filters.location === String(loc.id)}
                  onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} className="accent-brand-red" />
                {loc.name}
              </label>
            ))}
          </div>
        </aside>

        {/* Main grid */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="mb-4 flex items-baseline gap-3">
            <h1 className="font-oswald text-3xl uppercase">{type === 'LOST' ? 'Lost Items' : 'Found Items'}</h1>
            <span className="text-sm text-muted-text">{items.length} active reports</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-text">Loading…</div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-text gap-4">
              <span className="text-5xl">🔍</span>
              <p>No {type.toLowerCase()} items yet.</p>
              <Link to={type === 'LOST' ? '/report-lost' : '/report-found'}
                className="bg-brand-red text-white px-6 py-2 rounded-full text-sm font-medium">
                Report one now
              </Link>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(item => (
                  <ItemCard key={item.id} item={item} selected={selected?.id === item.id} onClick={setSelected} />
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right detail panel */}
        {selected && <DetailPanel item={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
