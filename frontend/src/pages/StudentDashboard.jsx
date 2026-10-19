import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, Box, CircleCheck, LogOut, MapPin, MessageCircle, Plus, Search, Sparkles } from 'lucide-react';
import api from '../api/client';

function readUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = useMemo(readUser, []);
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { replace: true });
      return;
    }

    Promise.all([api.get('/items/mine'), api.get('/meta/summary')])
      .then(async ([reportResponse, summaryResponse]) => {
        const ownReports = reportResponse.data || [];
        setReports(ownReports);
        setSummary(summaryResponse.data);
        const recentLost = ownReports.filter(item => item.type === 'LOST').slice(0, 5);
        const matchResponses = await Promise.all(recentLost.map(item => api.get(`/matches/item/${item.id}`).catch(() => ({ data: [] }))));
        setMatchCount(matchResponses.reduce((total, response) => total + (response.data?.length || 0), 0));
      })
      .catch(() => setError('We could not load your dashboard. Check that the server is running and sign in again.'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const lostCount = reports.filter(item => item.type === 'LOST').length;
  const foundCount = reports.filter(item => item.type === 'FOUND').length;
  const recentReports = reports.slice(0, 4);
  const searchItems = event => { event.preventDefault(); if (searchText.trim()) navigate(`/search?q=${encodeURIComponent(searchText.trim())}`); };

  return (
    <div className="min-h-screen bg-[#f3f0e9] font-inter text-ink-black">
      <header className="border-b border-black/5 bg-white/90 px-5 py-4 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link to="/" className="font-oswald text-xl tracking-widest">CAMPUSFIND<span className="text-brand-red">.</span></Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link to="/lost" className="rounded-full px-4 py-2 text-sm hover:bg-gray-100">Lost items</Link>
            <Link to="/found" className="rounded-full px-4 py-2 text-sm hover:bg-gray-100">Found items</Link>
            <Link to="/my-reports" className="rounded-full px-4 py-2 text-sm hover:bg-gray-100">My reports</Link>
            <Link to="/messages" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm hover:bg-gray-100"><MessageCircle size={15}/> Messages</Link>
            <Link to="/notifications" aria-label="Notifications" className="rounded-full p-2 hover:bg-gray-100"><Bell size={18} /></Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-text sm:block">{user?.name || 'Student'}</span>
            <button onClick={signOut} className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm hover:border-brand-red hover:text-brand-red">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#171717] p-7 text-white shadow-xl md:p-10">
          <div className="absolute -right-12 -top-28 h-80 w-80 rounded-full border-[46px] border-white/5" />
          <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Your campus account is active
              </div>
              <h1 className="font-oswald text-4xl uppercase leading-tight md:text-6xl">Good to see you,<br /><span className="text-[#ff615a]">{user?.name?.split(' ')[0] || 'student'}.</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 md:text-base">Keep track of your reports and see when the matching assistant finds something that could be yours.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/report-lost" className="inline-flex items-center gap-2 rounded-full bg-brand-red px-5 py-3 text-sm font-semibold text-white hover:bg-red-600"><Plus size={17} /> Report lost</Link>
              <Link to="/report-found" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-black hover:bg-gray-100"><Plus size={17} /> Report found</Link>
            </div>
          </div>
        </section>

        {error && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-muted-text"><span className="text-sm">My lost reports</span><Box size={18} /></div><div className="mt-3 font-oswald text-4xl">{loading ? '—' : lostCount}</div><Link to="/my-reports" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-red">Manage reports <ArrowRight size={13} /></Link></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-muted-text"><span className="text-sm">My found reports</span><CircleCheck size={18} /></div><div className="mt-3 font-oswald text-4xl">{loading ? '—' : foundCount}</div><Link to="/found" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-red">Browse found items <ArrowRight size={13} /></Link></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-muted-text"><span className="text-sm">Possible AI matches</span><Sparkles size={18} className="text-brand-red" /></div><div className="mt-3 font-oswald text-4xl">{loading ? '—' : matchCount}</div><span className="mt-2 block text-xs text-muted-text">Across your five most recent lost reports</span></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-muted-text"><span className="text-sm">Campus reports</span><MapPin size={18} /></div><div className="mt-3 font-oswald text-4xl">{summary?.reports ?? '—'}</div><span className="mt-2 block text-xs text-muted-text">{summary?.lost ?? 0} lost · {summary?.found ?? 0} found and active</span></div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm md:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-brand-red">Your activity</p><h2 className="mt-1 font-oswald text-2xl uppercase">Recent reports</h2></div>
              <Link to="/my-reports" className="text-sm font-medium text-muted-text hover:text-brand-red">View all</Link>
            </div>
            {loading ? <p className="py-10 text-center text-sm text-muted-text">Loading your reports…</p> : recentReports.length === 0 ? (
              <div className="rounded-2xl bg-[#f7f5f1] px-5 py-8 text-center"><p className="font-medium">Your first report starts the search.</p><p className="mt-1 text-sm text-muted-text">Add the details you remember and the matching assistant will look for similar reports.</p><Link to="/report-lost" className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink-black px-4 py-2 text-sm text-white">Report an item <ArrowRight size={14} /></Link></div>
            ) : <div className="divide-y divide-gray-100">{recentReports.map(item => <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.type === 'LOST' ? 'bg-red-50 text-brand-red' : 'bg-emerald-50 text-emerald-700'}`}><Box size={19} /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-text">{item.type} · {item.location_name || 'Campus'} · {item.status}</p></div><Link to={`/item/${item.id}`} className="shrink-0 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium hover:border-brand-red hover:text-brand-red">AI matches</Link></div>)}</div>}
          </div>

          <aside className="rounded-3xl border border-red-100 bg-[#fff8f6] p-6 shadow-sm md:p-7">
            <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-red text-white"><Sparkles size={20} /></div><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-brand-red">Matching assistant</p><h2 className="font-oswald text-2xl uppercase">AI is {summary?.aiStatus === 'online' ? 'online' : 'checking'}</h2></div></div>
            <p className="mt-5 text-sm leading-6 text-muted-text">It understands descriptions by meaning, then checks category, campus location, date, and color. Potential matches show a score and explain which details lined up.</p>
            <form onSubmit={searchItems} className="mt-5 rounded-2xl bg-white p-4"><label htmlFor="ai-search" className="text-xs font-semibold text-ink-black">Describe what you lost or found</label><p className="mt-1 text-xs leading-5 text-muted-text">Include what it looks like, where you saw it, and a detail that could help identify it.</p><div className="mt-3 flex gap-2"><input id="ai-search" value={searchText} onChange={e=>setSearchText(e.target.value)} className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm" placeholder="e.g. Blue earbuds near Block 4"/><button aria-label="Search reports with AI" className="rounded-xl bg-brand-red px-3 text-white"><Search size={17}/></button></div><p className="mt-2 text-[11px] leading-4 text-muted-text">How could someone recognize or use it? Add those details for better matches.</p></form>
            <p className="mt-4 text-[11px] text-muted-text">AI suggestions are leads. Confirm identifying details before claiming an item.</p>
          </aside>
        </section>
      </main>
    </div>
  );
}
