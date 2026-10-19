import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Search } from 'lucide-react';
import api from '../api/client';

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  useEffect(() => { api.get(`/users/${id}`).then(r=>setProfile(r.data)).catch(()=>setProfile(false)); }, [id]);
  useEffect(() => { api.get(`/users/${id}/items`, {params:{type:filter==='ALL'?'':filter,q:query}}).then(r=>setItems(r.data.items||[])).catch(()=>setItems([])); }, [id,filter,query]);
  if (profile === false) return <main className="p-10 text-center">Student not found.</main>;
  return <main className="min-h-screen bg-[#f3f0e9] p-5 text-ink-black md:p-10"><div className="mx-auto max-w-5xl">
    <Link to="/search" className="inline-flex items-center gap-2 text-sm text-muted-text"><ArrowLeft size={17}/> Back to search</Link>
    <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm"><div><p className="text-xs uppercase tracking-widest text-brand-red">Student profile</p><h1 className="mt-1 font-oswald text-3xl uppercase">{profile?.name||'Loading…'}</h1><p className="mt-1 text-sm text-muted-text">{profile?.listings??0} public listings</p></div><Link to={`/messages?user=${id}`} className="inline-flex items-center gap-2 rounded-full bg-brand-red px-5 py-3 text-sm font-semibold text-white"><MessageCircle size={17}/> Message {profile?.name?.split(' ')[0]||'student'}</Link></section>
    <div className="mt-6 flex flex-wrap items-center gap-3"><div className="flex rounded-full bg-white p-1">{['ALL','LOST','FOUND'].map(t=><button key={t} onClick={()=>setFilter(t)} className={`rounded-full px-4 py-2 text-xs font-semibold ${filter===t?'bg-ink-black text-white':'text-muted-text'}`}>{t}</button>)}</div><label className="flex min-w-56 flex-1 items-center gap-2 rounded-full bg-white px-4 py-2"><Search size={16} className="text-muted-text"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search their listings" className="w-full bg-transparent text-sm outline-none"/></label></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item=><Link key={item.id} to={`/item/${item.id}`} className="rounded-3xl bg-white p-5 shadow-sm"><span className="text-xs font-semibold text-brand-red">{item.type}</span><h2 className="mt-1 font-semibold">{item.title}</h2><p className="mt-2 line-clamp-2 text-sm text-muted-text">{item.description}</p><p className="mt-3 text-xs text-muted-text">{item.location_name||'Campus'} · {item.status}</p></Link>)}</div>
    {!items.length&&<p className="mt-12 text-center text-sm text-muted-text">No matching listings yet.</p>}
  </div></main>;
}
