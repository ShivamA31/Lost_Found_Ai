import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, MapPin, Search as SearchIcon, LogOut, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Landing() {
  const navigate = useNavigate();
  const [searchMessage, setSearchMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/meta/summary').then(response => setSummary(response.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.search.value.trim();
    if (!localStorage.getItem('token')) {
      setSearchMessage('Please log in or register before searching.');
      return;
    }
    if (!query) {
      setSearchMessage('Enter an item to search for.');
      return;
    }
    setSearchMessage('');
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const openReportForm = (path) => {
    if (!localStorage.getItem('token')) {
      setSearchMessage('Please log in or register before creating a report.');
      return;
    }
    setSearchMessage('');
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-off-white font-inter">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 bg-brand-red text-off-white">
        <div className="font-oswald text-2xl tracking-wider">CAMPUSFIND</div>
        <div className="flex items-center gap-3">
          {currentUser ? <>
            <span className="hidden text-sm text-white/80 sm:block">Hi, {currentUser.name?.split(' ')[0] || 'there'}</span>
            {currentUser.role === 'ADMIN' ? <Link to="/admin" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-black">Admin dashboard</Link> : <Link to="/dashboard" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-black">My dashboard</Link>}
            <button onClick={handleSignOut} aria-label="Sign out" className="rounded-full p-2 hover:bg-white/10"><LogOut size={18} /></button>
          </> : <>
            <Link to="/login" className="font-medium hover:underline">Login</Link>
            <Link to="/register" className="bg-ink-black text-off-white px-4 py-2 rounded-full font-medium">Get Started</Link>
          </>}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-brand-red text-off-white overflow-hidden py-16 md:py-24 px-6 md:px-12 flex flex-col md:flex-row items-center">
        {/* Giant background text */}
        <div className="absolute top-0 left-0 text-[12rem] md:text-[18rem] font-oswald text-black/10 select-none pointer-events-none leading-none -translate-y-10 whitespace-nowrap">
          REUNITED
        </div>
        
        <div className="relative z-10 w-full md:w-1/2 flex flex-col gap-6">
          <h1 className="font-oswald text-6xl md:text-8xl uppercase leading-none tracking-tight">
            Find What<br />You Lost
          </h1>
          <p className="text-xl md:text-2xl max-w-md text-white/90 font-medium">
            The AI-powered lost and found system for your campus. We match descriptions intelligently.
          </p>
          
          <form onSubmit={handleSearch} className="flex bg-white/20 p-2 rounded-full backdrop-blur-sm max-w-lg mt-4 border border-white/30 focus-within:bg-white focus-within:text-ink-black transition-all">
            <input 
              type="text" 
              name="search"
               placeholder="Describe what it looks like and where you saw it" 
              className="flex-grow bg-transparent px-4 outline-none placeholder:text-white/70 focus:placeholder:text-gray-400"
            />
            <button type="submit" className="bg-ink-black text-off-white p-3 rounded-full hover:bg-black transition-colors">
              <SearchIcon size={20} />
            </button>
          </form>
          {searchMessage && <p role="alert" className="text-sm font-medium">{searchMessage} <Link to="/login" className="underline">Log in</Link> or <Link to="/register" className="underline">register</Link>.</p>}
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button type="button" onClick={() => openReportForm('/report-lost')} className="bg-ink-black text-off-white px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-black transition-transform hover:scale-105">
              Report Lost <ArrowRight size={18} />
            </button>
            <button type="button" onClick={() => openReportForm('/report-found')} className="bg-off-white text-ink-black px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-gray-100 transition-transform hover:scale-105">
              Report Found <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-1/2 mt-12 md:mt-0 flex justify-center">
          <div className="relative w-full max-w-md aspect-[4/5] bg-white rounded-3xl overflow-hidden shadow-2xl rotate-3 transition-transform hover:rotate-0 duration-500">
            <img src="/images/hero-landing.png" alt="Student searching" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-ink-black text-off-white py-12 px-6 flex flex-wrap justify-around md:justify-center gap-12 md:gap-24">
        <div className="text-center">
          <div className="font-oswald text-5xl md:text-6xl text-brand-red">{summary?.reports ?? '—'}</div>
          <div className="text-sm tracking-widest uppercase text-gray-400 mt-2">Active Campus Reports</div>
        </div>
        <div className="text-center">
          <div className="font-oswald text-3xl md:text-4xl text-brand-red flex items-center justify-center gap-2"><Sparkles size={24} />{summary?.aiStatus === 'online' ? 'Online' : '—'}</div>
          <div className="text-sm tracking-widest uppercase text-gray-400 mt-2">AI Matching Assistant</div>
        </div>
        <div className="text-center">
          <div className="font-oswald text-5xl md:text-6xl text-brand-red">{summary?.potentialMatches ?? '—'}</div>
          <div className="text-sm tracking-widest uppercase text-gray-400 mt-2">Potential Matches</div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-1/3">
            <h2 className="font-oswald text-5xl uppercase leading-tight">How it<br />Works</h2>
            <p className="mt-4 text-muted-text text-lg">Our AI semantic matching finds items even if the descriptions don't perfectly match.</p>
          </div>
          <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card-white p-6 rounded-card shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-beige rounded-full flex items-center justify-center mb-4 text-brand-red">
                <Search size={24} />
              </div>
              <h3 className="font-oswald text-xl mb-2">1. Report</h3>
              <p className="text-muted-text text-sm">Submit a detailed description and location.</p>
            </div>
            <div className="bg-card-white p-6 rounded-card shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-beige rounded-full flex items-center justify-center mb-4 text-brand-red">
                <MapPin size={24} />
              </div>
              <h3 className="font-oswald text-xl mb-2">2. Match</h3>
              <p className="text-muted-text text-sm">AI compares reports and notifies you of potential matches.</p>
            </div>
            <div className="bg-card-white p-6 rounded-card shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-beige rounded-full flex items-center justify-center mb-4 text-brand-red">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-oswald text-xl mb-2">3. Claim</h3>
              <p className="text-muted-text text-sm">Verify ownership through a private hint to get it back.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-ink-black py-8 text-center text-gray-500 text-sm">
        <p>&copy; 2026 CampusFind System. Built for students.</p>
      </footer>
    </div>
  );
}
