import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, ArrowLeft, Sparkles } from 'lucide-react';
import api from '../api/client';

// Animated search progress bar + 404 state
function SearchStatus({ state, query, onAction }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (state === 'loading') {
      setProgress(0);
      const iv = setInterval(() => setProgress(p => p < 88 ? p + 6 : p), 80);
      return () => clearInterval(iv);
    }
    setProgress(100);
  }, [state]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Pool ladder illustration */}
      <img
        src="/images/search-pool-ladder.png"
        alt="Searching illustration"
        className="w-64 h-auto mb-8 object-contain"
      />

      {state === 'loading' && (
        <div className="w-full max-w-xs">
          <p className="text-sm text-muted-text mb-3 font-medium">Searching reports…</p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-red rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state === 'empty' && (
        <div className="animate-fade-in">
          <div className="font-oswald text-8xl text-brand-red mb-2">404</div>
          <h2 className="font-oswald text-2xl mb-2">No matching report found</h2>
          <p className="text-muted-text mb-8">Nothing like "<strong>{query}</strong>" has been reported yet.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onAction('lost')}
              className="bg-ink-black text-white px-6 py-3 rounded-full font-medium hover:bg-black">
              Report this as Lost
            </button>
            <button onClick={() => onAction('found')}
              className="bg-white border border-gray-200 text-ink-black px-6 py-3 rounded-full font-medium hover:bg-gray-50">
              Report as Found
            </button>
          </div>
          <button onClick={() => onAction('search')} className="mt-6 text-brand-red hover:underline text-sm">
            Try another search
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="animate-fade-in">
          <h2 className="font-oswald text-2xl mb-2">Something went wrong</h2>
          <p className="text-muted-text mb-6">Could not reach the server. Is the backend running?</p>
          <button onClick={() => onAction('retry')}
            className="bg-ink-black text-white px-6 py-3 rounded-full font-medium">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const [state, setState] = useState('loading');
  const [results, setResults] = useState([]);
  const [people, setPeople] = useState([]);
  const [inputValue, setInputValue] = useState(query);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!query) { setState('empty'); return; }
    setState('loading');
    const minTime = new Promise(r => setTimeout(r, 700));
    const req = Promise.all([api.get(`/search?q=${encodeURIComponent(query)}`), api.get(`/users/search?q=${encodeURIComponent(query)}`)]);
    Promise.all([req, minTime])
      .then(([[res, userRes]]) => {
        const data = res.data.results || [];
        setResults(data);
        setPeople(userRes.data.users || []);
        setState(data.length === 0 && !(userRes.data.users || []).length ? 'empty' : 'results');
      })
      .catch(() => setState('error'));
  }, [query, retryCount]);

  const handleNewSearch = (e) => {
    e.preventDefault();
    if (inputValue.trim()) navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
  };

  const handleAction = (action) => {
    if (action === 'lost') navigate(`/report-lost?title=${encodeURIComponent(query)}`);
    else if (action === 'found') navigate('/report-found');
    else if (action === 'search') navigate('/');
    else if (action === 'retry') setRetryCount(count => count + 1);
  };

  return (
    <div className="min-h-screen bg-beige font-inter">
      {/* Search bar header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-muted-text hover:text-ink-black"><ArrowLeft size={20} /></Link>
        <form onSubmit={handleNewSearch} className="flex flex-1 max-w-xl bg-gray-100 rounded-full px-4 py-2 gap-2 items-center">
          <Search size={16} className="text-muted-text flex-shrink-0" />
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search again…"
          />
          <button type="submit" className="bg-brand-red text-white px-4 py-1 rounded-full text-sm font-medium">Search</button>
        </form>
      </header>

      {/* Content */}
      {state !== 'results' ? (
        <SearchStatus state={state} query={query} onAction={handleAction} />
      ) : (
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-red-100 bg-white p-5 sm:flex-row sm:items-center">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-brand-red"><Sparkles size={21} /></div>
            <div><p className="font-semibold">Meaning-based AI search</p><p className="mt-1 text-sm text-muted-text">The model compares what you mean, so “wireless headphones” can find a report about “Bluetooth earbuds.” Open a result to see the match score and why it ranked.</p></div>
          </div>
          <h1 className="font-oswald text-2xl mb-1">Results for "<span className="text-brand-red">{query}</span>"</h1>
          <p className="text-sm text-muted-text mb-6">{results.length} items and {people.length} people found</p>
          {people.length > 0 && <section className="mb-7"><h2 className="mb-3 font-oswald text-xl uppercase">Students</h2><div className="flex flex-wrap gap-3">{people.map(person=><Link key={person.id} to={`/users/${person.id}`} className="rounded-2xl bg-white px-4 py-3 shadow-sm"><p className="font-semibold">{person.name}</p><p className="mt-1 text-xs text-muted-text">{person.listings} listings · {person.lost} lost · {person.found} found</p></Link>)}</div></section>}
          {results.length === 0 ? <p className="rounded-2xl bg-white p-5 text-sm text-muted-text">No item listings matched this description yet. You can still open a student profile above to see their listings.</p> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(item => (
              <Link to={`/item/${item.id}`} key={item.id}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-brand-red transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.type === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.type}
                    </span>
                    <h3 className="font-semibold mt-1">{item.title}</h3>
                  </div>
                  {item.similarity != null && (
                    <span title="Semantic similarity from the AI text model" className="text-xs font-bold text-brand-red bg-red-50 px-2 py-1 rounded-lg">AI {item.similarity}%</span>
                  )}
                </div>
                <p className="text-sm text-muted-text line-clamp-2">{item.description}</p>
                {item.user_name && <p className="mt-3 text-xs text-muted-text">Listed by <span className="font-semibold text-ink-black">{item.user_name}</span></p>}
                <div className="flex items-center gap-1 text-xs text-muted-text mt-3">
                  <span>📍</span> {item.location_name || 'Unknown'}
                </div>
              </Link>
            ))}
          </div>}
        </div>
      )}
    </div>
  );
}
