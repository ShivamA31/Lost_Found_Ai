import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import api from '../api/client';

export default function Messages() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const me = (()=>{ try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const bottom = useRef(null);
  const userId = Number(params.get('user')) || 0;
  const itemId = Number(params.get('item')) || null;
  const refresh = async () => {
    const response = await api.get('/messages/conversations'); setConversations(response.data || []);
  };
  useEffect(() => { if (!localStorage.getItem('token')) { navigate('/login', {replace:true}); return; } refresh().catch(()=>setError('Could not load your messages.')); }, [navigate]);
  useEffect(() => {
    if (!userId) { setThread(null); return; }
    api.get(`/messages/${userId}`).then(response => setThread(response.data)).catch(err => setError(err.response?.data?.error || 'Could not open this conversation.'));
  }, [userId]);
  useEffect(() => { bottom.current?.scrollIntoView({behavior:'smooth'}); }, [thread?.messages?.length]);
  const send = async event => {
    event.preventDefault(); if (!text.trim() || !userId) return;
    setBusy(true); setError('');
    try {
      await api.post('/messages', { recipient_id:userId, item_id:itemId, body:text.trim() });
      setText('');
      const [t] = await Promise.all([api.get(`/messages/${userId}`), refresh()]); setThread(t.data);
    } catch (err) { setError(err.response?.data?.error || 'Message could not be sent.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-[#f3f0e9] p-4 font-inter text-ink-black md:p-8">
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-sm">
      <aside className="w-full max-w-sm border-r border-gray-100 md:block">
        <header className="flex items-center gap-3 border-b p-5"><Link to="/dashboard"><ArrowLeft size={18}/></Link><h1 className="font-oswald text-2xl uppercase">Messages</h1></header>
        <div className="overflow-y-auto">{conversations.map(c=><button key={c.user_id} onClick={()=>setParams({user:String(c.user_id),...(c.item_id?{item:String(c.item_id)}:{})})} className={`w-full border-b p-4 text-left hover:bg-gray-50 ${userId===c.user_id?'bg-red-50':''}`}><p className="font-semibold">{c.user_name}</p>{c.item_title&&<p className="text-xs text-brand-red">About: {c.item_title}</p>}<p className="mt-1 truncate text-sm text-muted-text">{c.last_message}</p></button>)}{!conversations.length&&<p className="p-5 text-sm text-muted-text">Your conversations will appear here.</p>}</div>
      </aside>
      <section className={`flex min-w-0 flex-1 flex-col ${!userId?'hidden md:flex':''}`}>
        {thread ? <><header className="border-b p-5"><p className="font-semibold">{thread.user.name}</p>{itemId&&<p className="text-xs text-muted-text">Listing conversation</p>}</header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#fbfaf8] p-5">{thread.messages.map(m=><div key={m.id} className={`flex ${m.sender_id===me?.id?'justify-end':'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.sender_id===me?.id?'bg-brand-red text-white':'bg-white shadow-sm'}`}>{m.item_title&&<p className="mb-1 text-xs opacity-70">Re: {m.item_title}</p>}{m.body}<p className="mt-1 text-right text-[10px] opacity-60">{new Date(m.created_at).toLocaleString()}</p></div></div>)}<div ref={bottom}/></div>
          {error&&<p role="alert" className="px-5 pt-2 text-sm text-red-700">{error}</p>}
          <form onSubmit={send} className="flex gap-2 border-t p-4"><input value={text} onChange={e=>setText(e.target.value)} maxLength={2000} placeholder="Write a message…" className="min-w-0 flex-1 rounded-full border px-4 py-3 text-sm"/><button disabled={busy||!text.trim()} aria-label="Send message" className="rounded-full bg-brand-red px-5 text-white disabled:opacity-50"><Send size={17}/></button></form>
        </> : <div className="grid flex-1 place-items-center text-center text-sm text-muted-text">{error||'Choose a conversation or open a listing to contact its owner.'}</div>}
      </section>
    </div>
  </main>;
}
